import { DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { cn } from '@/lib/utils';

const { RangePicker } = DatePicker;

interface SummaryFiltersProps {
  senderFilter: string | null;
  setSenderFilter: (val: string | null) => void;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  setDateRange: (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => void;
  members: Array<{ id: string; fullName: string }>;
  onPresetClick: (preset: 'today' | '24h' | '7d') => void;
}

export const SummaryFilters: React.FC<SummaryFiltersProps> = ({
  senderFilter,
  setSenderFilter,
  dateRange,
  setDateRange,
  members,
  onPresetClick,
}) => {
  return (
    <div className="p-6 space-y-6 border-b border-white/5 bg-white/2">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-1">Transmission Source</label>
        <Select
          className="w-full elevated-input border-none! custom-select"
          placeholder="All Senders"
          allowClear
          value={senderFilter}
          onChange={setSenderFilter}
          options={members.map((m) => ({
            label: m.fullName,
            value: m.id,
          }))}
          dropdownStyle={{
            backgroundColor: 'rgba(20, 25, 45, 0.98)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '4px'
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-1">Temporal Window</label>
        <RangePicker
          className="w-full elevated-input border-none! custom-range-picker"
          showTime
          format="YYYY-MM-DD HH:mm"
          value={dateRange}
          placeholder={['Start detection', 'End detection']}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            } else {
              setDateRange(null);
            }
          }}
          dropdownClassName="custom-datepicker-dropdown"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { key: 'today', label: 'TODAY' },
          { key: '24h', label: 'LAST 24H' },
          { key: '7d', label: 'LAST 7 DAYS' }
        ].map((item) => (
          <button
            key={item.key}
            className={cn(
              "px-4 h-8 rounded-lg text-[10px] font-black tracking-[0.1em] transition-all duration-300",
              "bg-white/10 border border-white/20 text-white! hover:text-white! hover:bg-primary/40 hover:border-primary shadow-lg",
              "active:scale-95 active:bg-primary/20"
            )}
            onClick={() => onPresetClick(item.key as any)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
