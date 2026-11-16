import React, { useState, useRef, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import { Spinner } from './index.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `👋 **Welcome to ChainPulse AI Copilot!**\n\nI can analyze live inventory depletion, supplier delay risks, active shipments, and pending requisition approvals in real time.\n\nTry asking me a question below:`,
      suggestedActions: [
        { label: 'Which items will run out this week?', query: 'Which items will run out this week?' },
        { label: 'Which supplier is most delayed?', query: 'Which supplier is most delayed?' },
        { label: 'Show active shipments', query: 'Show active shipments' }
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await analyticsAPI.askAssistant({ question: text });
      const data = res.data?.data;
      if (data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: data.answer,
            suggestedActions: data.suggestedActions
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `❌ **Error querying supply chain context:** ${err.response?.data?.message || err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format basic markdown (bold, bullet points, italics)
  const renderFormattedText = (txt) => {
    if (!txt) return null;
    const lines = txt.split('\n');
    return lines.map((line, idx) => {
      // Process bold **text**
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <div key={idx} style={{ marginBottom: line.trim() === '' ? 8 : 4 }}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} style={{ color: '#F8F4EC' }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} style={{ color: '#7AAE8E' }}>{part.slice(1, -1)}</em>;
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2C5F5D 0%, #C68642 100%)',
          color: '#F8F4EC',
          border: '2px solid rgba(248,244,236,0.3)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}
        title="ChainPulse AI Assistant"
      >
        {isOpen ? '✕' : '🤖'}
      </motion.button>

      {/* Expandable Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.22 }}
            style={{
              position: 'fixed',
              bottom: 90,
              right: 24,
              width: 390,
              maxWidth: 'calc(100vw - 48px)',
              height: 520,
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 9999,
              background: 'rgba(14,23,20,0.97)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(198,134,66,0.3)',
              borderRadius: 16,
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid rgba(94,139,126,0.18)',
              background: 'rgba(20,30,27,0.85)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2C5F5D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  🤖
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8F4EC' }}>ChainPulse AI Copilot</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span className="live-dot" />
                    <span style={{ fontSize: 10, color: '#7AAE8E', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Live Data Connected</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(212,207,196,0.5)', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    background: m.role === 'user' ? '#2C5F5D' : 'rgba(44,95,93,0.12)',
                    border: m.role === 'user' ? '1px solid #7AAE8E' : '1px solid rgba(94,139,126,0.2)',
                    color: '#F8F4EC',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    fontSize: 12,
                    lineHeight: 1.5
                  }}
                >
                  {renderFormattedText(m.text)}

                  {/* Action Chips if available */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {m.suggestedActions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (act.query) {
                              handleSend(act.query);
                            } else if (act.to) {
                              navigate(act.to);
                              setIsOpen(false);
                            }
                          }}
                          style={{
                            background: 'rgba(198,134,66,0.15)',
                            border: '1px solid rgba(198,134,66,0.3)',
                            color: '#C68642',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {act.to ? `→ ${act.label}` : `💬 ${act.label}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(44,95,93,0.12)', padding: '8px 14px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(212,207,196,0.6)' }}>
                  <Spinner size="sm" />
                  <span>Analyzing live supply chain data…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              style={{
                padding: '10px 14px',
                borderTop: '1px solid rgba(94,139,126,0.15)',
                background: 'rgba(20,30,27,0.9)',
                display: 'flex',
                gap: 8
              }}
            >
              <input
                className="input"
                style={{ flex: 1, fontSize: 12, padding: '8px 12px' }}
                placeholder="Ask about inventory, delays, shipments…"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn btn-procurement"
                style={{ padding: '8px 14px', fontSize: 12 }}
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
