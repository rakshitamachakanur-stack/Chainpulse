import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supplierAPI } from '../../services/api';
import { Spinner } from './index.jsx';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export default function SupplierScorecardsPanel() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: scorecardsRes, isLoading } = useQuery({
    queryKey: ['supplier-scorecards'],
    queryFn: () => supplierAPI.getScorecards().then(r => r.data),
    refetchInterval: 30000
  });

  const benchmarks = scorecardsRes?.benchmarks || {};
  const scorecards = scorecardsRes?.data || [];

  const categories = ['all', ...Array.from(new Set(scorecards.map(s => s.category).filter(Boolean)))];

  const filteredScorecards = scorecards.filter(s => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    return true;
  });

  // Data for the comparative chart
  const chartData = filteredScorecards.map(s => ({
    name: s.name.split(' ')[0],
    'On-Time %': s.onTimeRate,
    'Quality %': s.acceptanceRate,
    'Lead-Time Acc %': s.leadTimeAccuracy
  }));

  const TT = {
    contentStyle: {
      background: 'rgba(14,22,18,0.96)',
      border: '1px solid rgba(94,139,126,0.25)',
      borderRadius: 10,
      color: '#F8F4EC',
      fontSize: 12
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Benchmark KPI Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ background: 'rgba(198,134,66,0.1)', border: '1px solid rgba(198,134,66,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#C68642', fontWeight: 600 }}>🏆 Top Performer</span>
            <span style={{ fontSize: 20 }}>🥇</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#F8F4EC', margin: '8px 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {benchmarks.topPerformer || 'N/A'}
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Rank #1 across all metrics</span>
        </div>

        <div className="card" style={{ background: 'rgba(44,95,93,0.12)', border: '1px solid rgba(44,95,93,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#7AAE8E', fontWeight: 600 }}>⏱️ Avg On-Time Delivery</span>
            <span style={{ fontSize: 20 }}>🚚</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#7AAE8E', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            {benchmarks.avgOnTimeDelivery || 0}%
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Cross-supplier punctuality</span>
        </div>

        <div className="card" style={{ background: 'rgba(94,139,126,0.1)', border: '1px solid rgba(94,139,126,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#5E8B7E', fontWeight: 600 }}>🛡️ Quality Acceptance</span>
            <span style={{ fontSize: 20 }}>🔍</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#F8F4EC', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            {benchmarks.avgAcceptanceRate || 0}%
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Goods verified & passed in GRNs</span>
        </div>

        <div className="card" style={{ background: 'rgba(46,50,57,0.3)', border: '1px solid rgba(94,139,126,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(212,207,196,0.7)', fontWeight: 600 }}>📊 Avg Supplier Score</span>
            <span style={{ fontSize: 20 }}>⭐</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#C68642', fontFamily: 'monospace', margin: '8px 0 2px' }}>
            {benchmarks.avgCompositeScore || 0}/100
          </p>
          <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.45)' }}>Composite score index</span>
        </div>
      </div>

      {/* Comparative Performance Chart */}
      <motion.div className="card chart-container" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 2 }}>Ranked Supplier Performance Chart</h3>
            <p style={{ fontSize: 12, color: 'rgba(212,207,196,0.4)' }}>Comparing On-Time %, Quality Acceptance % (GRNs), and Lead-Time Accuracy</p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? '#2C5F5D' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat ? '#F8F4EC' : 'rgba(212,207,196,0.6)',
                  border: '1px solid rgba(94,139,126,0.15)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,139,126,0.1)" />
              <XAxis dataKey="name" stroke="rgba(212,207,196,0.3)" tick={{ fontSize: 11, fill: 'rgba(212,207,196,0.5)' }} />
              <YAxis domain={[0, 100]} stroke="rgba(212,207,196,0.3)" tick={{ fontSize: 11, fill: 'rgba(212,207,196,0.5)' }} tickFormatter={v => `${v}%`} />
              <Tooltip {...TT} formatter={(v, n) => [`${v}%`, n]} />
              <Legend formatter={v => <span style={{ color: 'rgba(212,207,196,0.6)', fontSize: 11 }}>{v}</span>} />
              <Bar dataKey="On-Time %" fill="#7AAE8E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Quality %" fill="#C68642" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lead-Time Acc %" fill="#5E8B7E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Leaderboard & Detailed Scorecards */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
          {filteredScorecards.map(s => {
            const isRank1 = s.rank === 1;
            const isRank2 = s.rank === 2;
            const isRank3 = s.rank === 3;
            const medal = isRank1 ? '🥇' : isRank2 ? '🥈' : isRank3 ? '🥉' : `#${s.rank}`;

            return (
              <motion.div
                key={s.supplierId}
                className="card"
                whileHover={{ y: -3, borderColor: `${s.tierColor}55` }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  position: 'relative',
                  border: isRank1 ? '1px solid rgba(198,134,66,0.4)' : undefined,
                  background: isRank1 ? 'rgba(198,134,66,0.04)' : undefined
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isRank1 ? 'rgba(198,134,66,0.2)' : 'rgba(44,95,93,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isRank1 || isRank2 || isRank3 ? 16 : 12,
                      fontWeight: 800,
                      color: isRank1 ? '#C68642' : '#F8F4EC'
                    }}>
                      {medal}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: '#F8F4EC', fontSize: 15, margin: 0 }}>{s.name}</h4>
                      <p style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(212,207,196,0.4)', margin: '2px 0 0' }}>
                        {s.code} · {s.category?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    background: `${s.tierColor}20`,
                    color: s.tierColor,
                    border: `1px solid ${s.tierColor}44`
                  }}>
                    {s.grade} · {s.tierLabel}
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(94,139,126,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(212,207,196,0.6)', fontWeight: 600 }}>Composite Score</span>
                    <span style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 800, color: s.tierColor }}>
                      {s.compositeScore} / 100
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${s.compositeScore}%`, height: '100%', background: s.tierColor, borderRadius: 3 }} />
                  </div>
                </div>

                {/* Performance Breakdown Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
                  <div style={{ background: 'rgba(44,95,93,0.08)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(94,139,126,0.12)' }}>
                    <span style={{ color: 'rgba(212,207,196,0.45)', display: 'block', fontSize: 10 }}>ON-TIME</span>
                    <strong style={{ fontSize: 13, color: '#7AAE8E' }}>{s.onTimeRate}%</strong>
                    <span style={{ display: 'block', fontSize: 10, color: 'rgba(212,207,196,0.35)', marginTop: 2 }}>
                      {s.onTimeDeliveries}/{s.deliveredOrders} orders
                    </span>
                  </div>

                  <div style={{ background: 'rgba(44,95,93,0.08)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(94,139,126,0.12)' }}>
                    <span style={{ color: 'rgba(212,207,196,0.45)', display: 'block', fontSize: 10 }}>DEFECT RATE</span>
                    <strong style={{ fontSize: 13, color: s.rejectionRate > 3 ? '#E08060' : '#F8F4EC' }}>
                      {s.rejectionRate}%
                    </strong>
                    <span style={{ display: 'block', fontSize: 10, color: 'rgba(212,207,196,0.35)', marginTop: 2 }}>
                      {s.totalRejectedQty} rejected
                    </span>
                  </div>

                  <div style={{ background: 'rgba(44,95,93,0.08)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(94,139,126,0.12)' }}>
                    <span style={{ color: 'rgba(212,207,196,0.45)', display: 'block', fontSize: 10 }}>LEAD TIME</span>
                    <strong style={{ fontSize: 13, color: '#C68642' }}>{s.avgActualLeadTime}d</strong>
                    <span style={{ display: 'block', fontSize: 10, color: 'rgba(212,207,196,0.35)', marginTop: 2 }}>
                      Target: {s.statedLeadTime}d
                    </span>
                  </div>
                </div>

                {/* Footer notes / defect highlights */}
                {Object.keys(s.defectReasons || {}).length > 0 ? (
                  <div style={{ fontSize: 11, color: 'rgba(212,207,196,0.5)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: '#E08060', fontWeight: 600 }}>GRN Issues:</span>
                    {Object.entries(s.defectReasons).map(([reason, count]) => (
                      <span key={reason} style={{ background: 'rgba(184,92,56,0.15)', color: '#E08060', padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>
                        {reason} ({count})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#7AAE8E', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>✨ Clean inspection history (0 rejected units)</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
