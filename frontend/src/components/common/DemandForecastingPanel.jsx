import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI } from '../../services/api';
import { Modal, Spinner } from './index.jsx';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function DemandForecastingPanel() {
  const qc = useQueryClient();
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftingItem, setDraftingItem] = useState(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const { data: forecastRes, isLoading } = useQuery({
    queryKey: ['inventory-forecast'],
    queryFn: () => inventoryAPI.getForecast().then(r => r.data),
    refetchInterval: 20000
  });

  const autoDraftMut = useMutation({
    mutationFn: inventoryAPI.autoDraft,
    onSuccess: (res) => {
      qc.invalidateQueries(['inventory-forecast']);
      qc.invalidateQueries(['requisitions']);
      qc.invalidateQueries(['pending-reqs']);
      qc.invalidateQueries(['inventory']);
      qc.invalidateQueries(['analytics-dashboard']);
      toast.success(res.data?.message || 'Requisition auto-drafted successfully!');
      setDraftingItem(null);
      setBatchModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to auto-draft requisition');
    }
  });

  const summary = forecastRes?.summary || {};
  const allForecasts = forecastRes?.data || [];

  const filteredForecasts = allForecasts.filter(f => {
    if (filterRisk === 'all') return true;
    if (filterRisk === 'critical') return f.riskLevel === 'critical' || f.riskLevel === 'out_of_stock';
    if (filterRisk === 'warning') return f.riskLevel === 'warning';
    if (filterRisk === 'healthy') return f.riskLevel === 'healthy';
    return true;
  });

  const criticalItems = allForecasts.filter(f => f.riskLevel === 'critical' || f.riskLevel === 'out_of_stock');

  const handleSingleAutoDraft = (item) => {
    autoDraftMut.mutate({
      title: `Smart Replenishment: ${item.product.name}`,
      items: [{
        productId: item.product._id,
        quantity: item.suggestedReorderQty,
        notes: `Smart auto-order: ${item.daysRemaining} days of stock remaining (${item.predictedNextMonth} units/mo forecast)`
      }],
      supplierId: item.product.supplier?._id,
      priority: item.daysRemaining <= 5 ? 'critical' : 'high',
      justification: `AI Demand Forecast: Product has ${item.currentStock} units remaining (burn rate: ${item.dailyBurnRate}/day). Expected stockout in ~${item.daysRemaining} days.`
    });
  };

  const handleBatchAutoDraft = () => {
    if (!criticalItems.length) return;
    const itemsPayload = criticalItems.map(c => ({
      productId: c.product._id,
      quantity: c.suggestedReorderQty,
      notes: `Batch smart replenishment: ${c.daysRemaining}d stock left`
    }));

    autoDraftMut.mutate({
      title: `Batch Replenishment: ${criticalItems.length} High-Risk Inventory Items`,
      items: itemsPayload,
      priority: 'critical',
      justification: `Automated replenishment based on predictive demand forecasting. ${criticalItems.length} items will exhaust inventory within 7 days.`
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ background: 'rgba(184,92,56,0.1)', border: '1px solid rgba(184,92,56,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#E08060', fontWeight: 600 }}>🚨 Stockout Risk (&lt;7d)</span>
            <span style={{ fontSize: 18 }}>📉</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#F8F4EC', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            {summary.criticalCount || 0}
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Products requiring replenishment</span>
        </div>

        <div className="card" style={{ background: 'rgba(198,134,66,0.1)', border: '1px solid rgba(198,134,66,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#C68642', fontWeight: 600 }}>⚠️ Warning (&lt;18d)</span>
            <span style={{ fontSize: 18 }}>⏱️</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#F8F4EC', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            {summary.warningCount || 0}
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Depletion within two weeks</span>
        </div>

        <div className="card" style={{ background: 'rgba(44,95,93,0.12)', border: '1px solid rgba(44,95,93,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#7AAE8E', fontWeight: 600 }}>✅ Healthy Stock</span>
            <span style={{ fontSize: 18 }}>📦</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#F8F4EC', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            {summary.healthyCount || 0}
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Safe buffer maintained</span>
        </div>

        <div className="card" style={{ background: 'rgba(94,139,126,0.1)', border: '1px solid rgba(94,139,126,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#5E8B7E', fontWeight: 600 }}>💰 Suggested Reorder Spend</span>
            <span style={{ fontSize: 18 }}>💳</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#C68642', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            ${(summary.projectedSuggestedSpend || 0).toLocaleString()}
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Optimal reorder investment</span>
        </div>
      </div>

      {/* Control Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Risk Level Filter Chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'critical', label: `🚨 Critical (${summary.criticalCount || 0})` },
            { id: 'warning', label: `⚠️ Warning (${summary.warningCount || 0})` },
            { id: 'healthy', label: `✅ Healthy (${summary.healthyCount || 0})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterRisk(f.id)}
              style={{
                background: filterRisk === f.id ? '#2C5F5D' : 'rgba(20,30,27,0.7)',
                color: filterRisk === f.id ? '#F8F4EC' : 'rgba(212,207,196,0.6)',
                border: filterRisk === f.id ? '1px solid #7AAE8E' : '1px solid rgba(94,139,126,0.15)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Batch Reorder Action */}
        {criticalItems.length > 0 && (
          <button
            onClick={() => setBatchModalOpen(true)}
            className="btn btn-procurement"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', fontSize: 13 }}
          >
            <span>⚡ Auto-Draft Requisition ({criticalItems.length} Critical Items)</span>
          </button>
        )}
      </div>

      {/* Forecast Table */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Current Stock</th>
                <th>Historical Usage</th>
                <th>Next Month Forecast</th>
                <th>Stock Lifespan</th>
                <th>Smart Suggested Order</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredForecasts.map(item => {
                const isCritical = item.riskLevel === 'critical' || item.riskLevel === 'out_of_stock';
                const isWarning = item.riskLevel === 'warning';
                const statusColor = isCritical ? '#E08060' : isWarning ? '#C68642' : '#7AAE8E';
                const statusBg = isCritical ? 'rgba(184,92,56,0.15)' : isWarning ? 'rgba(198,134,66,0.15)' : 'rgba(44,95,93,0.15)';

                return (
                  <tr key={item.inventoryId} style={{ background: isCritical ? 'rgba(184,92,56,0.03)' : 'transparent' }}>
                    {/* Product */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#F8F4EC' }}>{item.product?.name}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(212,207,196,0.45)', marginTop: 2 }}>
                        {item.product?.sku} · {item.product?.supplier?.name || 'Primary Vendor'}
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: isCritical ? '#E08060' : '#F8F4EC' }}>
                          {item.currentStock} {item.product?.unit || 'units'}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(212,207,196,0.4)' }}>
                        Reorder Point: {item.reorderPoint}
                      </span>
                    </td>

                    {/* Historical mini bar chart */}
                    <td style={{ width: 140 }}>
                      <div style={{ width: 120, height: 32 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={item.history || []}>
                            <XAxis dataKey="label" hide />
                            <Tooltip
                              contentStyle={{ background: '#141E1B', border: '1px solid rgba(94,139,126,0.3)', borderRadius: 6, fontSize: 11 }}
                              formatter={(val) => [`${val} units`, 'Usage']}
                            />
                            <Bar dataKey="quantity" fill="#5E8B7E" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(212,207,196,0.4)' }}>
                        Avg: {item.avgMonthlyDemand} / mo ({item.trendPct >= 0 ? `+${item.trendPct}%` : `${item.trendPct}%`})
                      </span>
                    </td>

                    {/* Predicted Demand */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#C68642' }}>
                          ~{item.predictedNextMonth}
                        </span>
                        <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.5)' }}>/ month</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(212,207,196,0.4)' }}>
                        Burn rate: {item.dailyBurnRate} units/day
                      </span>
                    </td>

                    {/* Stock Lifespan */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusColor}44`
                      }}>
                        {item.daysRemaining === 0 ? '⛔ Stockout' : `⏱️ ${item.daysRemaining} days left`}
                      </span>
                      <div style={{ width: 90, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, (item.daysRemaining / 30) * 100)}%`,
                          background: statusColor,
                          borderRadius: 2
                        }} />
                      </div>
                    </td>

                    {/* Suggested Smart Reorder */}
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#7AAE8E', fontSize: 13 }}>
                        +{item.suggestedReorderQty} {item.product?.unit}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>
                        Est. Cost: ${item.estimatedCost?.toLocaleString()}
                      </div>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleSingleAutoDraft(item)}
                        disabled={autoDraftMut.isPending}
                        className="btn btn-secondary btn-sm"
                        style={{
                          borderColor: isCritical ? 'rgba(184,92,56,0.4)' : 'rgba(198,134,66,0.3)',
                          color: isCritical ? '#E08060' : '#C68642',
                          fontWeight: 600
                        }}
                      >
                        ⚡ Auto-Draft
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Batch Auto Draft Confirmation Modal */}
      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Confirm Automated Requisition Draft">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'rgba(212,207,196,0.8)' }}>
            This will auto-generate a consolidated draft Purchase Requisition containing <strong>{criticalItems.length} critical inventory items</strong> based on demand forecasting:
          </p>

          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8 }}>
            {criticalItems.map(c => (
              <div key={c.inventoryId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 4 }}>
                <span>{c.product.name} ({c.daysRemaining}d stock left)</span>
                <strong style={{ color: '#C68642' }}>+{c.suggestedReorderQty} units (${c.estimatedCost})</strong>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'rgba(212,207,196,0.5)', fontStyle: 'italic' }}>
            The requisition will be created in "Draft" status for review and approval by Procurement / Management.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => setBatchModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleBatchAutoDraft}
              disabled={autoDraftMut.isPending}
              className="btn btn-procurement"
            >
              {autoDraftMut.isPending ? <Spinner size="sm" /> : 'Confirm & Create Requisition'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
