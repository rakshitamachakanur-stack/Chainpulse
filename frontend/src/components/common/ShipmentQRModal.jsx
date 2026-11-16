import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Modal } from './index.jsx';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ShipmentQRModal({ isOpen, onClose, shipment }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const printRef = useRef(null);

  const trackingNumber = shipment?.trackingNumber || '';
  const trackingUrl = `${window.location.origin}/tracking?tn=${encodeURIComponent(trackingNumber)}`;

  useEffect(() => {
    if (!isOpen || !trackingNumber) return;

    QRCode.toDataURL(trackingUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#141E1B',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [isOpen, trackingNumber, trackingUrl]);

  if (!shipment) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success('Tracking URL copied to clipboard!');
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${trackingNumber}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR Code downloaded');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '', 'width=650,height=700');
    win.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${trackingNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
            .label-box { border: 2px solid #000; padding: 20px; border-radius: 8px; max-width: 480px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 14px; }
            .carrier { font-size: 24px; font-weight: 800; text-transform: uppercase; }
            .service { font-size: 13px; font-weight: 600; text-transform: uppercase; background: #000; color: #fff; padding: 3px 8px; border-radius: 4px; }
            .tracking-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin: 0; }
            .tracking-num { font-size: 22px; font-family: monospace; font-weight: 800; margin: 4px 0 16px; letter-spacing: 1px; }
            .qr-center { text-align: center; margin: 16px 0; }
            .route { display: flex; justify-content: space-between; border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 12px 0; margin-bottom: 14px; }
            .route-col { flex: 1; }
            .route-label { font-size: 10px; color: #666; text-transform: uppercase; }
            .route-city { font-size: 16px; font-weight: 700; margin-top: 2px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
            .scan-tip { text-align: center; font-size: 11px; color: #555; margin-top: 12px; font-style: italic; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shipment QR Code & Label" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Printable Label Preview Card */}
        <div
          ref={printRef}
          style={{
            background: '#F8F4EC',
            color: '#182420',
            borderRadius: 12,
            padding: '20px',
            border: '2px solid rgba(198,134,66,0.3)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
          }}
        >
          <div className="label-box">
            {/* Top header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2E3239', paddingBottom: 10, marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7AAE8E', fontWeight: 700, margin: 0 }}>ChainPulse Express</p>
                <p style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#182420' }}>{shipment.carrier || 'CARRIER'}</p>
              </div>
              <span style={{ background: '#2C5F5D', color: '#F8F4EC', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>
                {shipment.serviceType || 'Standard'}
              </span>
            </div>

            {/* Tracking number callout */}
            <div>
              <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#555', margin: 0 }}>Tracking Number</p>
              <p style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, margin: '2px 0 10px', color: '#182420', letterSpacing: '0.05em' }}>
                {shipment.trackingNumber}
              </p>
            </div>

            {/* QR Code Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '10px 0', background: '#FFF', padding: 12, borderRadius: 10, border: '1px solid #E0DCD4' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR for ${shipment.trackingNumber}`} style={{ width: 170, height: 170 }} />
              ) : (
                <div style={{ width: 170, height: 170, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Generating QR…</div>
              )}
              <p style={{ fontSize: 11, color: '#666', marginTop: 8, textAlign: 'center', fontWeight: 500 }}>
                📱 Scan with camera to open live tracking page
              </p>
            </div>

            {/* Route */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #BBB', borderBottom: '1px dashed #BBB', padding: '10px 0', margin: '12px 0' }}>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#777', margin: 0 }}>Origin</p>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '2px 0 0', color: '#182420' }}>{shipment.origin?.city || 'Origin'}</p>
              </div>
              <div style={{ fontSize: 18, alignSelf: 'center', color: '#C68642' }}>✈️</div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#777', margin: 0 }}>Destination</p>
                <p style={{ fontSize: 14, fontWeight: 700, margin: '2px 0 0', color: '#182420' }}>{shipment.destination?.city || 'Destination'}</p>
              </div>
            </div>

            {/* Metadata pills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11 }}>
              <div style={{ background: '#ECE7DC', padding: '6px 8px', borderRadius: 6 }}>
                <span style={{ color: '#777', display: 'block', fontSize: 9 }}>WEIGHT</span>
                <strong>{shipment.weight ? `${shipment.weight} kg` : '15.0 kg'}</strong>
              </div>
              <div style={{ background: '#ECE7DC', padding: '6px 8px', borderRadius: 6 }}>
                <span style={{ color: '#777', display: 'block', fontSize: 9 }}>PACKAGES</span>
                <strong>{shipment.packages || 1} PKG</strong>
              </div>
              <div style={{ background: '#ECE7DC', padding: '6px 8px', borderRadius: 6 }}>
                <span style={{ color: '#777', display: 'block', fontSize: 9 }}>STATUS</span>
                <strong style={{ textTransform: 'capitalize' }}>{shipment.status?.replace(/_/g, ' ')}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleCopyLink} className="btn btn-secondary btn-sm">
            🔗 Copy Link
          </button>
          <button type="button" onClick={handleDownloadQR} className="btn btn-secondary btn-sm">
            💾 Download QR (.png)
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-logistics btn-sm">
            🖨️ Print Shipping Label
          </button>
        </div>
      </div>
    </Modal>
  );
}
