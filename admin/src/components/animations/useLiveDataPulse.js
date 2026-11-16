import { useState, useEffect, useCallback } from 'react';
const STATUS_PROGRESSION = { pending:'picked_up', picked_up:'in_transit', in_transit:'out_for_delivery', out_for_delivery:'delivered', delivered:'delivered' };
function nudge(lat, lng) { const d=()=>(Math.random()-0.5)*0.008; return { lat:lat+d(), lng:lng+d() }; }
export function useLiveDataPulse(initialData, interval=9000, enabled=true) {
  const [data, setData]       = useState(initialData);
  const [flashId, setFlashId] = useState(null);
  const pulse = useCallback(() => {
    setData(prev => {
      const candidates = prev.filter(s => s.status !== 'delivered');
      if(!candidates.length) return prev;
      const target = candidates[Math.floor(Math.random()*candidates.length)];
      const coin = Math.random();
      let updated;
      if(coin < 0.5 && target.currentLocation) {
        updated = { ...target, currentLocation: nudge(target.currentLocation.lat, target.currentLocation.lng) };
      } else {
        updated = { ...target, status: STATUS_PROGRESSION[target.status] || target.status };
      }
      setFlashId(target._id);
      setTimeout(() => setFlashId(null), 1200);
      return prev.map(s => s._id === target._id ? updated : s);
    });
  }, []);
  useEffect(() => {
    if(!enabled) return;
    const t = setInterval(pulse, interval);
    return () => clearInterval(t);
  }, [pulse, interval, enabled]);
  return { data, flashId };
}
