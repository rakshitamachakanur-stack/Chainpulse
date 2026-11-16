const Supplier     = require('../models/Supplier');
const Order        = require('../models/Order');
const GoodsReceipt = require('../models/GoodsReceipt');
const Shipment     = require('../models/Shipment');

/**
 * Computes comprehensive Supplier Scorecards:
 * 1. On-time delivery rate (delivered vs expected delivery)
 * 2. Rejection rate from Goods Receipt Notes (GRNs)
 * 3. Lead-time accuracy (actual days from order to delivery vs stated leadTime)
 * 4. Composite performance score & ranking
 */
exports.getSupplierScorecards = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    const orders    = await Order.find().populate('supplier');
    const grns      = await GoodsReceipt.find().populate('supplier');
    const shipments = await Shipment.find().populate('order');

    // Create a map of order actual delivery dates from shipments
    const orderActualDeliveryMap = {};
    shipments.forEach(s => {
      if (s.order && s.actualDelivery) {
        orderActualDeliveryMap[s.order._id?.toString() || s.order.toString()] = new Date(s.actualDelivery);
      }
    });

    const scorecards = suppliers.map(sup => {
      const supId = sup._id.toString();

      // Orders for this supplier
      const supOrders = orders.filter(o => o.supplier && (o.supplier._id?.toString() || o.supplier.toString()) === supId);
      const totalOrders = supOrders.length;
      const deliveredOrders = supOrders.filter(o => o.status === 'delivered');
      const activeOrders = supOrders.filter(o => ['approved', 'processing', 'shipped'].includes(o.status));
      const totalSpend = supOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      // 1. On-time delivery calculation
      let onTimeCount = 0;
      let lateCount = 0;
      let actualLeadTimeDaysTotal = 0;
      let leadTimeMeasuredCount = 0;

      deliveredOrders.forEach(o => {
        const orderId = o._id.toString();
        const expected = o.expectedDelivery ? new Date(o.expectedDelivery) : null;
        const actual = o.actualDelivery
          ? new Date(o.actualDelivery)
          : orderActualDeliveryMap[orderId] || new Date(o.updatedAt);

        if (expected) {
          // Allow 24 hours tolerance buffer
          const diffMs = actual.getTime() - expected.getTime();
          if (diffMs <= 86400000) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        } else {
          onTimeCount++; // Default on-time if no deadline was set
        }

        // Measure actual lead time (order creation to delivery)
        if (o.createdAt) {
          const days = Math.max(1, Math.round((actual.getTime() - new Date(o.createdAt).getTime()) / 86400000));
          actualLeadTimeDaysTotal += days;
          leadTimeMeasuredCount++;
        }
      });

      // On-time percentage (use supplier base rating as weighted prior if few orders)
      let onTimeRate = 95;
      if (deliveredOrders.length > 0) {
        onTimeRate = Math.round((onTimeCount / deliveredOrders.length) * 100);
      } else {
        onTimeRate = Math.min(98, Math.round((sup.rating / 5) * 100));
      }

      // 2. Rejection rate from Goods Receipts (GRNs)
      const supGRNs = grns.filter(g => g.supplier && (g.supplier._id?.toString() || g.supplier.toString()) === supId);
      let totalOrderedQty = 0;
      let totalReceivedQty = 0;
      let totalRejectedQty = 0;
      const defectReasons = {};

      supGRNs.forEach(g => {
        (g.items || []).forEach(item => {
          totalOrderedQty += item.orderedQty || 0;
          totalReceivedQty += item.receivedQty || 0;
          totalRejectedQty += item.rejectedQty || 0;

          if (item.rejectedQty > 0 && item.rejectionReason) {
            defectReasons[item.rejectionReason] = (defectReasons[item.rejectionReason] || 0) + item.rejectedQty;
          }
        });
      });

      const totalHandled = totalReceivedQty + totalRejectedQty;
      let rejectionRate = 0;
      let acceptanceRate = 100;

      if (totalHandled > 0) {
        rejectionRate = Number(((totalRejectedQty / totalHandled) * 100).toFixed(1));
        acceptanceRate = Number((100 - rejectionRate).toFixed(1));
      } else {
        // Fallback estimate based on rating
        acceptanceRate = Number((sup.rating >= 4.5 ? 99.2 : sup.rating >= 4.0 ? 96.5 : 92.0).toFixed(1));
        rejectionRate = Number((100 - acceptanceRate).toFixed(1));
      }

      // 3. Lead-time accuracy
      const statedLeadTime = sup.leadTime || 7;
      let avgActualLeadTime = statedLeadTime;
      if (leadTimeMeasuredCount > 0) {
        avgActualLeadTime = Number((actualLeadTimeDaysTotal / leadTimeMeasuredCount).toFixed(1));
      }

      // Lead time accuracy percentage
      const leadVariance = Math.abs(avgActualLeadTime - statedLeadTime);
      const leadTimeAccuracy = Math.max(10, Math.min(100, Math.round(100 - (leadVariance / statedLeadTime) * 100)));

      // 4. Weighted Composite Performance Score (0 - 100)
      // On-time Delivery: 40%, Quality Acceptance: 35%, Lead-time Accuracy: 25%
      const compositeScore = Math.round(
        (onTimeRate * 0.40) +
        (acceptanceRate * 0.35) +
        (leadTimeAccuracy * 0.25)
      );

      // Determine Performance Tier / Grade
      let grade = 'B';
      let tierLabel = 'Reliable';
      let tierColor = '#7AAE8E';

      if (compositeScore >= 90) {
        grade = 'A+';
        tierLabel = 'Elite Partner';
        tierColor = '#C68642'; // Copper
      } else if (compositeScore >= 82) {
        grade = 'A';
        tierLabel = 'Preferred';
        tierColor = '#5E8B7E'; // Pine
      } else if (compositeScore >= 72) {
        grade = 'B';
        tierLabel = 'Standard';
        tierColor = '#7AAE8E'; // Sage
      } else {
        grade = 'C';
        tierLabel = 'Under Review';
        tierColor = '#B85C38'; // Brick
      }

      return {
        supplierId: sup._id,
        name: sup.name,
        code: sup.code,
        category: sup.category,
        contactName: sup.contactName,
        email: sup.email,
        phone: sup.phone,
        status: sup.status,
        rating: sup.rating,
        statedLeadTime,
        avgActualLeadTime,
        leadTimeAccuracy,
        onTimeRate,
        lateDeliveries: lateCount,
        onTimeDeliveries: onTimeCount,
        totalOrders,
        deliveredOrders: deliveredOrders.length,
        activeOrders: activeOrders.length,
        totalSpend,
        totalGrns: supGRNs.length,
        totalReceivedQty,
        totalRejectedQty,
        rejectionRate,
        acceptanceRate,
        defectReasons,
        compositeScore,
        grade,
        tierLabel,
        tierColor
      };
    });

    // Rank suppliers by composite score
    scorecards.sort((a, b) => b.compositeScore - a.compositeScore);
    scorecards.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    // Benchmark averages
    const avgScore = Math.round(scorecards.reduce((sum, s) => sum + s.compositeScore, 0) / (scorecards.length || 1));
    const avgOnTime = Math.round(scorecards.reduce((sum, s) => sum + s.onTimeRate, 0) / (scorecards.length || 1));
    const avgAcceptance = Number((scorecards.reduce((sum, s) => sum + s.acceptanceRate, 0) / (scorecards.length || 1)).toFixed(1));

    res.json({
      success: true,
      benchmarks: {
        totalSuppliers: scorecards.length,
        avgCompositeScore: avgScore,
        avgOnTimeDelivery: avgOnTime,
        avgAcceptanceRate: avgAcceptance,
        topPerformer: scorecards[0]?.name || 'N/A'
      },
      data: scorecards
    });
  } catch (err) {
    console.error('Scorecard error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
