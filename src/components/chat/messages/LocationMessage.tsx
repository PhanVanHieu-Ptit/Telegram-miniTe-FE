import React from 'react';

interface LocationPayload {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationMessageProps {
  payload?: LocationPayload;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({ payload }) => {
  if (!payload || !payload.lat || !payload.lng) return <div>Invalid Location</div>;

  const mapUrl = `https://www.google.com/maps?q=${payload.lat},${payload.lng}`;
  // A static map preview image (mocked via a placeholder map service or similar for UI)
  const mapPreviewUrl = `https://static-maps.yandex.ru/1.x/?ll=${payload.lng},${payload.lat}&size=400,200&z=15&l=map&pt=${payload.lng},${payload.lat},pm2rdm`;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[200px]">
      <a 
        href={mapUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg hover:opacity-90 transition"
      >
        <img 
          src={mapPreviewUrl} 
          alt="Map location" 
          className="w-full h-32 object-cover bg-gray-200" 
          onError={(e) => {
             // Fallback if static map fails to load
             (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Map+Preview+Not+Available';
          }}
        />
      </a>
      {payload.address && (
        <span className="text-xs opacity-90 truncate px-1 mt-1 font-medium">
          📍 {payload.address}
        </span>
      )}
    </div>
  );
};
