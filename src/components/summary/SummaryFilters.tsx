import React from 'react';
import { Select, DatePicker, Button, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;
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
    <div className="p-4 space-y-4 border-b border-border">
      <div className="space-y-1">
        <Text strong style={{ fontSize: '13px' }}>Filter by Sender</Text>
        <Select
          className="w-full"
          placeholder="All Senders"
          allowClear
          value={senderFilter}
          onChange={setSenderFilter}
          options={members.map((m) => ({
            label: m.fullName,
            value: m.id,
          }))}
        />
      </div>

      <div className="space-y-1">
        <Text strong style={{ fontSize: '13px' }}>Time Range</Text>
        <RangePicker
          className="w-full"
          showTime
          format="YYYY-MM-DD HH:mm"
          value={dateRange}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0], dates[1]]);
            } else {
              setDateRange(null);
            }
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="small" type="dashed" onClick={() => onPresetClick('today')}>Today</Button>
        <Button size="small" type="dashed" onClick={() => onPresetClick('24h')}>Last 24h</Button>
        <Button size="small" type="dashed" onClick={() => onPresetClick('7d')}>Last 7 days</Button>
      </div>
    </div>
  );
};
