import React, { useRef, useState, useEffect } from 'react';
import { Layers, Undo2, Trash2, Download, Send } from 'lucide-react';
import { Button, Slider } from 'antd';

interface DrawingCanvasProps {
  onSend: (blob: Blob) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSend }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        
        // Fill background with near black for contrast
        ctx.fillStyle = '#0a0f19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
      }
    }
  }, [color, brushSize]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory([...history, canvas.toDataURL()]);
    }
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath(); // reset path
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#0a0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
    }
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) onSend(blob);
      }, 'image/png');
    }
  };

  const colors = [
    '#ffffff', '#ff4d4f', '#52c41a', '#1890ff', '#fadb14', 
    '#eb2f96', '#722ed1', '#fa8c16'
  ];

  return (
    <div className="flex flex-col gap-4 w-80 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Layers className="text-blue-500" size={20} />
          <h3 className="text-white font-bold text-sm">Vẽ tay</h3>
        </div>
        <button onClick={clear} className="text-white/40 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0a0f19] cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={288}
          height={320}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex gap-1.5">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-[10px] text-white/40 uppercase font-bold">Size</span>
          <Slider 
            min={1} 
            max={20} 
            value={brushSize} 
            onChange={setBrushSize} 
            className="flex-1 m-0" 
            tooltip={{ open: false }}
          />
        </div>
      </div>

      <Button 
        type="primary"
        className="h-10 rounded-xl bg-blue-600 hover:bg-blue-500 border-none font-bold flex items-center justify-center gap-2"
        onClick={handleSend}
      >
        <Send size={16} />
        Gửi bản vẽ
      </Button>
    </div>
  );
};
