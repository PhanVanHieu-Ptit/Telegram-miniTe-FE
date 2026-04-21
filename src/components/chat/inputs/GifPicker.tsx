import React, { useState, useEffect } from 'react';
import { Input, Spin } from 'antd';
import { Search } from 'lucide-react';

interface GifPickerProps {
  onSelect: (url: string) => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Using a common public beta key for Giphy
  const GIPHY_API_KEY = 'dc6zaTOxFJmzC'; 

  const fetchGifs = async (query: string = '') => {
    setLoading(true);
    try {
      const endpoint = query 
        ? `https://api.giphy.com/1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`
        : `https://api.giphy.com/1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGifs(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col gap-3 w-80 h-96 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <Input
        prefix={<Search size={16} className="text-white/40" />}
        placeholder="Tìm kiếm GIF..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        variant="filled"
        className="bg-white/5 border-none text-white hover:bg-white/10 focus:bg-white/10 h-10"
      />
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="relative aspect-video overflow-hidden rounded-lg bg-white/5 hover:ring-2 ring-blue-500 transition-all group"
              >
                <img 
                  src={gif.images.fixed_height_small.url} 
                  alt={gif.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
