import { DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div className="p-6 space-y-7 border-b border-white/5 bg-transparent">
      <div className="space-y-2.5">
        <label className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#0ea5e9]/80 ml-1">{t('transmission_source')}</label>
        <Select
          className="w-full elevated-input border-none! custom-select h-11 ant-select-selection-item"
          placeholder={t('all_senders')}
          allowClear
          value={senderFilter}
          onChange={setSenderFilter}
          options={members.map((m) => ({
            label: m.fullName,
            value: m.id,
          }))}
          variant="borderless"
          dropdownStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '6px',
            borderRadius: '12px'
          }}
        />
      </div>

      <div className="space-y-2.5">
        <label className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#0ea5e9]/80 ml-1">{t('temporal_window')}</label>
        <RangePicker
          className="w-full elevated-input border-none! custom-range-picker h-11"
          showTime
          format="YYYY-MM-DD HH:mm"
          value={dateRange}
          placeholder={[t('start_detection'), t('end_detection')]}
          variant="borderless"
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            } else {
              setDateRange(null);
            }
          }}
          popupClassName="custom-datepicker-dropdown"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { key: 'today', label: t('today_preset') },
          { key: '24h', label: t('last_24h_preset') },
          { key: '7d', label: t('last_7d_preset') }
        ].map((item) => (
          <button
            key={item.key}
            className={cn(
              "px-4 h-8 rounded-lg text-[9px] font-black tracking-widest transition-all duration-300",
              "bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-primary/50 shadow-sm",
              "active:scale-95"
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
