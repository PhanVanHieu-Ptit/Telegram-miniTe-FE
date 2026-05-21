import { searchMessages, type SearchMessagesParams } from "@/api/chat.api";
import { useDebounce } from "@/hooks/useDebounce";
import { useChatStore } from "@/store/chat.store";
import type { Message } from "@/types/chat.types";
import { DatePicker, Drawer, Input, Select } from "antd";
import dayjs from "dayjs";
import { Filter, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

interface SearchSidebarProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

export function SearchSidebar({ open, onClose, conversationId }: SearchSidebarProps) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [senderFilters, setSenderFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 300);

  const conversations = useChatStore(s => s.conversations);
  const getUser = useChatStore(s => s.getUser);

  const members = useMemo(() => {
    const convo = conversations.find(c => c.id === conversationId);
    return convo?.members || [];
  }, [conversations, conversationId]);

  useEffect(() => {
    if (!open) return;
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params: SearchMessagesParams = {
          conversationId,
        };
        if (debouncedKeyword) params.keyword = debouncedKeyword;
        if (typeFilters.length > 0) params.type = typeFilters;
        if (senderFilters.length > 0) params.senderId = senderFilters;
        if (dateRange?.[0]) params.fromDate = dateRange[0].toISOString();
        if (dateRange?.[1]) params.toDate = dateRange[1].toISOString();

        // if empty search and no filters, maybe we don't search or just show recent
        const msgs = await searchMessages(params);
        setResults(msgs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void fetchResults();
  }, [open, conversationId, debouncedKeyword, typeFilters, senderFilters, dateRange]);

  const scrollToMessage = (msgId: string) => {
    // We could emit an event or find the element and scroll into view
    // Since message list is virtualized, we might need a scroll-to-index mechanism.
    // For now, we'll try to find the DOM node. If not virtualized it's easy.
    // Given we are using virtualization, this is a placeholder.
    console.log("Scroll to message", msgId);
    onClose();
  };

  return (
    <Drawer
      title={<div className="text-white font-semibold flex items-center gap-2"><Filter className="w-4 h-4"/> {t('search_and_filter')}</div>}
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
      styles={{
        header: { background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white' },
        body: { background: '#111827', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
        mask: { background: 'rgba(0,0,0,0.5)' }
      }}
      closeIcon={<X className="text-white hover:text-white/70" />}
    >
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <div>
          <label className="text-xs text-white/50 mb-1 block uppercase font-semibold">Keyword</label>
          <Input 
            prefix={<SearchIcon className="w-4 h-4 text-white/50" />}
            placeholder="Search in messages..." 
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-white/10 placeholder-white/30"
          />
        </div>

        {/* Message Type Filter */}
        <div>
          <label className="text-xs text-white/50 mb-1 block uppercase font-semibold">Message Type</label>
          <Select
            mode="multiple"
            allowClear
            placeholder="Filter by type"
            className="w-full"
            value={typeFilters}
            onChange={setTypeFilters}
            options={[
              { label: 'Text', value: 'TEXT' },
              { label: 'Image', value: 'IMAGE' },
              { label: 'Video', value: 'VIDEO' },
              { label: 'File', value: 'FILE' },
              { label: 'Voice', value: 'VOICE' },
              { label: 'Link', value: 'LINK' },
              { label: 'Poll', value: 'POLL' },
            ]}
          />
        </div>

        {/* Sender Filter */}
        <div>
          <label className="text-xs text-white/50 mb-1 block uppercase font-semibold">Sender</label>
          <Select
            mode="multiple"
            allowClear
            placeholder="Filter by sender"
            className="w-full"
            value={senderFilters}
            onChange={setSenderFilters}
            options={members.map(m => ({ label: m.fullName, value: m.id }))}
          />
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="text-xs text-white/50 mb-1 block uppercase font-semibold">Time Range</label>
          <RangePicker 
            className="w-full bg-white/5 border-white/10"
            value={dateRange}
            onChange={(dates) => setDateRange(dates as any)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-4 border-t border-white/5 pt-4">
        <h3 className="text-sm font-medium text-white mb-3">Results ({results.length})</h3>
        
        {loading ? (
          <div className="text-center text-white/40 py-8">Searching...</div>
        ) : results.length === 0 ? (
          <div className="text-center text-white/40 py-8">No results found</div>
        ) : (
          <div className="flex flex-col gap-3">
            {results.map(msg => {
              const sender = getUser(msg.senderId);
              return (
                <div 
                  key={msg.id} 
                  className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition border border-white/5"
                  onClick={() => scrollToMessage(msg.id)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-blue-400">{sender?.displayName || t('someone')}</span>
                    <span className="text-[10px] text-white/40">{dayjs(msg.timestamp).format('MMM D, HH:mm')}</span>
                  </div>
                  <div className="text-sm text-white/80 line-clamp-3">
                    {/* Render simplified content or just text */}
                    {msg.content || (msg.attachments && msg.attachments.length > 0 ? '[Media]' : '')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Drawer>
  );
}
