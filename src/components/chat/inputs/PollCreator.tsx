import React, { useState } from 'react';
import { BarChart2, Plus, X, List } from 'lucide-react';
import { Button, Input, Checkbox, message } from 'antd';

interface PollCreatorProps {
  onSend: (question: string, options: string[], allowMultiple: boolean) => void;
}

export const PollCreator: React.FC<PollCreatorProps> = ({ onSend }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [errors, setErrors] = useState<{question?: boolean, options?: number[]}>({});

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
      if (errors.options?.includes(index)) {
        setErrors(p => ({ ...p, options: p.options?.filter(i => i !== index) }));
      }
    }
  };

  const updateOption = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
    if (val.trim()) {
        setErrors(p => ({ ...p, options: p.options?.filter(i => i !== index) }));
    }
  };

  const handleSend = () => {
    const validOptions = options.map((o, i) => ({ text: o.trim(), index: i })).filter(o => o.text !== '');
    const hasQuestion = !!question.trim();
    const hasEnoughOptions = validOptions.length >= 2;

    if (!hasQuestion || !hasEnoughOptions) {
      setErrors({
        question: !hasQuestion,
        options: options.map((o, i) => o.trim() === '' ? i : -1).filter(i => i !== -1)
      });
      message.error(hasQuestion ? 'Cần ít nhất 2 lựa chọn' : 'Vui lòng nhập câu hỏi');
      return;
    }

    onSend(question, options.filter(o => o.trim() !== ''), allowMultiple);
  };

  return (
    <div className="flex flex-col gap-4 w-80 bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="text-orange-500" size={20} />
        <h3 className="text-white font-bold text-sm">Tạo bình chọn</h3>
      </div>

      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Câu hỏi</label>
          <Input.TextArea
            placeholder="Bạn muốn hỏi gì?"
            value={question}
            onChange={(e) => { setQuestion(e.target.value); setErrors(p => ({...p, question: false})); }}
            status={errors.question ? 'error' : ''}
            variant="filled"
            autoSize={{ minRows: 2, maxRows: 4 }}
            className="bg-white/5 border-none text-white hover:bg-white/10 focus:bg-white/10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-bold text-white/40 ml-1">Lựa chọn (tối thiểu 2)</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 group">
              <Input
                placeholder={`Lựa chọn ${idx + 1}...`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                status={errors.options?.includes(idx) ? 'error' : ''}
                variant="filled"
                className="bg-white/5 border-none text-white hover:bg-white/10 focus:bg-white/10"
                prefix={<List size={14} className="text-white/20" />}
              />
              {options.length > 2 && (
                <button 
                  onClick={() => removeOption(idx)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          
          {options.length < 10 && (
            <button
              onClick={addOption}
              className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 text-white/40 hover:text-blue-400 transition-all text-xs"
            >
              <Plus size={14} />
              Thêm lựa chọn
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
          <Checkbox 
            checked={allowMultiple} 
            onChange={(e) => setAllowMultiple(e.target.checked)}
            className="text-white/70 text-xs"
          >
            Cho phép chọn nhiều
          </Checkbox>
        </div>
      </div>

      <Button 
        type="primary"
        className="h-10 rounded-xl bg-orange-600 hover:bg-orange-500 border-none font-bold"
        onClick={handleSend}
      >
        Tạo bình chọn
      </Button>
    </div>
  );
};
