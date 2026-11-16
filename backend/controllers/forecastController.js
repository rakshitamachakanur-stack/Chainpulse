const Inventory   = require('../models/Inventory');
const Product     = require('../models/Product');
const Order       = require('../models/Order');
const Requisition = require('../models/Requisition');
const notify      = require('../middleware/notify');
const emit        = require('../middleware/socketEmit');

/**
 * Computes demand forecasting and stock depletion metrics per product.
 * Uses order history (past 3-6 months) to calculate average monthly consumption,
 * linear regression trend slope, forecasted demand next month, and days remaining.
 */
exports.getDemandForecast = async (req, res) => {
  try {
    const inventories = await Inventory.find().populate({
      path: 'product',
      populate: { path: 'supplier', select: 'name code email leadTime' }
    });

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Fetch non-cancelled orders from the last 6 months
    const recentOrders = await Order.find({
      createdAt: { $gte: sixMonthsAgo },
      status: { $nin: ['cancelled'] }
    }).select('items createdAt supplier');

    const forecasts = inventories.map(inv => {
      const prod = inv.product;
      if (!prod) return null;

      // Filter orders containing this product
      const productOrders = [];
      recentOrders.forEach(o => {
        const item = o.items.find(i => i.product && i.product.toString() === prod._id.toString());
        if (item) {
          productOrders.push({
            date: o.createdAt,
            quantity: item.quantity,
            totalPrice: item.totalPrice
          });
        }
      });

      // Group consumption by month (last 4 months)
      const monthlyBuckets = {};
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', { month: 'short' });
        monthlyBuckets[key] = { label, quantity: 0, count: 0 };
      }

      productOrders.forEach(po => {
        const d = new Date(po.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyBuckets[key]) {
          monthlyBuckets[key].quantity += po.quantity;
          monthlyBuckets[key].count += 1;
        }
      });

      const historyPoints = Object.values(monthlyBuckets);
      const totalPastQty = historyPoints.reduce((sum, h) => sum + h.quantity, 0);
      const avgMonthlyDemand = totalPastQty > 0
        ? Math.round(totalPastQty / historyPoints.length)
        : Math.round(inv.reorderQty * 0.6); // reasonable baseline if new

      // Simple regression slope: calculate change from first half to second half
      const n = historyPoints.length;
      const firstHalf = (historyPoints[0].quantity + historyPoints[1].quantity) / 2;
      const secondHalf = (historyPoints[n - 2].quantity + historyPoints[n - 1].quantity) / 2;
      let trendFactor = 0;
      if (firstHalf > 0) {
        trendFactor = (secondHalf - firstHalf) / firstHalf;
      }
      // Bound trendFactor between -30% and +50% to prevent extreme outliers
      trendFactor = Math.max(-0.3, Math.min(0.5, trendFactor));

      const predictedNextMonth = Math.max(5, Math.round(avgMonthlyDemand * (1 + trendFactor)));
      const dailyBurnRate = Number((predictedNextMonth / 30).toFixed(2));

      // Calculate days of stock remaining
      let daysRemaining = 999;
      if (inv.quantity <= 0) {
        daysRemaining = 0;
      } else if (dailyBurnRate > 0) {
        daysRemaining = Math.floor(inv.quantity / dailyBurnRate);
      }

      // Depletion risk
      let riskLevel = 'healthy';
      if (inv.quantity <= 0) {
        riskLevel = 'out_of_stock';
      } else if (daysRemaining <= 7 || inv.quantity <= inv.reorderPoint) {
        riskLevel = 'critical';
      } else if (daysRemaining <= 18) {
        riskLevel = 'warning';
      }

      // Recommended smart reorder quantity
      // Formula: Target safety stock (1.5x month usage) - current stock, at least reorderQty
      const suggestedReorderQty = Math.max(
        inv.reorderQty || 20,
        Math.round((predictedNextMonth * 1.5) - inv.quantity)
      );

      const estimatedCost = Number((suggestedReorderQty * prod.unitPrice).toFixed(2));

      return {
        inventoryId: inv._id,
        product: {
          _id: prod._id,
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          unit: prod.unit,
          unitPrice: prod.unitPrice,
          supplier: prod.supplier
        },
        warehouse: inv.warehouse,
        currentStock: inv.quantity,
        availableStock: inv.available,
        reservedStock: inv.reserved,
        reorderPoint: inv.reorderPoint,
        reorderQty: inv.reorderQty,
        history: historyPoints,
        avgMonthlyDemand,
        trendPct: Math.round(trendFactor * 100),
        predictedNextMonth,
        dailyBurnRate,
        daysRemaining,
        riskLevel,
        suggestedReorderQty,
        estimatedCost
      };
    }).filter(Boolean);

    // Summary statistics
    const criticalItems = forecasts.filter(f => f.riskLevel === 'critical' || f.riskLevel === 'out_of_stock');
    const warningItems = forecasts.filter(f => f.riskLevel === 'warning');
    const totalSuggestedSpend = forecasts
      .filter(f => f.riskLevel === 'critical' || f.riskLevel === 'warning')
      .reduce((sum, f) => sum + f.estimatedCost, 0);

    // Sort by most urgent (lowest days remaining first)
    forecasts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    res.json({
      success: true,
      summary: {
        totalProducts: forecasts.length,
        criticalCount: criticalItems.length,
        warningCount: warningItems.length,
        healthyCount: forecasts.length - criticalItems.length - warningItems.length,
        projectedSuggestedSpend: Math.round(totalSuggestedSpend)
      },
      data: forecasts
    });
  } catch (err) {
    console.error('Forecast error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Auto-drafts a purchase requisition with smart suggested quantities.
 * Connects directly to the existing procurement approval workflow.
 */
exports.autoDraftRequisition = async (req, res) => {
  try {
    const { items, supplierId, justification, priority } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    // Populate item pricing
    const populatedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const prod = await Product.findById(item.productId || item.product);
      if (!prod) continue;
      const qty = Number(item.quantity) || 10;
      const price = prod.unitPrice || 0;
      const total = Number((qty * price).toFixed(2));
      calculatedTotal += total;

      populatedItems.push({
        product: prod._id,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
        notes: item.notes || `Auto-drafted by smart demand forecasting`
      });
    }

    if (!populatedItems.length) {
      return res.status(400).json({ success: false, message: 'Valid products required' });
    }

    const firstProduct = await Product.findById(populatedItems[0].product).populate('supplier');
    const targetSupplier = supplierId || firstProduct?.supplier?._id;

    const requisition = await Requisition.create({
      title: req.body.title || `Smart Reorder: ${populatedItems.length} Low-Stock Items`,
      items: populatedItems,
      totalAmount: calculatedTotal,
      status: 'draft',
      priority: priority || 'high',
      justification: justification || 'Auto-generated requisition from ChainPulse Demand Forecasting (stock depletion predicted within safety window).',
      neededBy: new Date(Date.now() + 7 * 86400000),
      supplier: targetSupplier,
      createdBy: req.user._id,
      timeline: [{
        status: 'draft',
        by: req.user._id,
        note: 'Auto-drafted via Smart Demand Forecasting & Reorder engine'
      }]
    });

    // Notify procurement and manager
    await notify({
      title: 'Auto-Draft Requisition Created',
      message: `${requisition.reqNumber} auto-drafted for ${populatedItems.length} replenishments ($${calculatedTotal.toLocaleString()}).`,
      type: 'info',
      priority: 'high',
      targetRole: 'procurement',
      refModel: 'Requisition',
      refId: requisition._id,
      createdBy: req.user._id
    });

    emit(req, 'requisition:created', {
      id: requisition._id,
      reqNumber: requisition.reqNumber,
      status: requisition.status
    });

    res.status(201).json({
      success: true,
      message: 'Requisition auto-drafted successfully',
      data: requisition
    });
  } catch (err) {
    console.error('AutoDraft error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
