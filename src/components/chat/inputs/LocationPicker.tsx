import React, { useState } from 'react';
import { MapPin, Navigation, Share2 } from 'lucide-react';
import { Button, Switch, Spin } from 'antd';

interface LocationPickerProps {
  onSend: (lat: number, lng: number, isLive: boolean) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ onSend }) => {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [address, setAddress] = useState('');

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        
        // Reverse geocoding (optional, using nominatim for free)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setAddress(data.display_name);
        } catch (e) {
          setAddress('Vị trí hiện tại');
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
        alert('Không thể lấy vị trí. Vui lòng cho phép truy cập GPS.');
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 w-80 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="text-green-500" size={20} />
        <h3 className="text-white font-bold text-sm">Chia sẻ vị trí</h3>
      </div>

      {!coords ? (
        <Button 
          type="primary" 
          icon={loading ? <Spin size="small" /> : <Navigation size={16} />}
          onClick={getCurrentLocation}
          loading={loading}
          className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 border-none flex items-center justify-center gap-2"
        >
          Lấy vị trí hiện tại
        </Button>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
              <span className="text-xs text-white/80 leading-relaxed">
                {address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">Vị trí trực tiếp</span>
              <span className="text-[10px] text-white/50">Cập nhật theo thời gian thực</span>
            </div>
            <Switch checked={isLive} onChange={setIsLive} size="small" />
          </div>

          <div className="flex gap-2">
            <Button 
              className="flex-1 h-10 rounded-xl bg-white/10 border-none text-white hover:bg-white/20"
              onClick={() => setCoords(null)}
            >
              Làm lại
            </Button>
            <Button 
              type="primary"
              className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 border-none flex items-center justify-center gap-2"
              onClick={() => onSend(coords.lat, coords.lng, isLive)}
            >
              <Share2 size={16} />
              Gửi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
