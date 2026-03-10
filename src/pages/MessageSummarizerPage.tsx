import { useState, useMemo, useEffect } from "react";
import { 
  Table, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  Typography, 
  Tag, 
  Empty, 
  Spin, 
  message 
} from "antd";
import { ArrowLeft, Sparkles, MessageSquare, Filter } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useChatStore } from "@/store/chat.store";
import { summarizeMessages } from "@/api/summarize.api";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

dayjs.extend(isBetween);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const MessageSummarizerPage = () => {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const loading = useChatStore((s) => s.loading);
  const fetchMessages = useChatStore((s) => s.fetchMessages);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [senderFilter, setSenderFilter] = useState<string | null>(null);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Get active conversation details
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  // Fetch all messages for the conversation if not loaded
  // Note: store might only have a page. For summarization we might want more.
  // But for this task, we use what's in the store or maybe trigger a full fetch.
  useEffect(() => {
    if (activeConversationId) {
      // If messages are empty or doesn't match current ID, fetch.
      // In the store's setActiveConversationId, it already calls fetchMessages.
    }
  }, [activeConversationId, fetchMessages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    
    return messages.filter((msg) => {
      // Filter by sender
      if (senderFilter && msg.senderId !== senderFilter) return false;
      
      // Filter by date range
      if (dateRange && dateRange[0] && dateRange[1]) {
        const msgDate = dayjs(msg.timestamp);
        if (!msgDate.isBetween(dateRange[0], dateRange[1], 'second', '[]')) return false;
      }
      
      return true;
    });
  }, [messages, senderFilter, dateRange]);

  const handleSummarize = async () => {
    if (!activeConversationId) {
      message.error("Please select a conversation first");
      return;
    }

    setIsSummarizing(true);
    try {
      const response = await summarizeMessages({
        conversationId: activeConversationId,
        senderFilter: senderFilter || undefined,
        startTime: dateRange?.[0]?.toISOString(),
        endTime: dateRange?.[1]?.toISOString(),
      });

      if (response.success) {
        setSummary(response.summary);
        message.success("Summary generated successfully!");
      } else {
        message.error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Summarization error:", error);
      message.error("An error occurred while generating the summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const columns = [
    {
      title: 'Sender',
      dataIndex: 'senderId',
      key: 'senderId',
      width: '150px',
      render: (senderId: string) => {
        const member = activeConversation?.members.find((m) => m.id === senderId);
        return <Tag color="blue">{member?.fullName || senderId}</Tag>;
      }
    },
    {
      title: 'Message',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => <Text>{content}</Text>
    },
    {
      title: 'Sent Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: '180px',
      render: (timestamp: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      )
    },
  ];

  if (!activeConversationId) {
    return <Navigate to="/chat" />;
  }

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Sidebar - consistent with ChatPage */}
      <div
        className={cn(
          "h-full w-full shrink-0 border-r border-border md:w-80",
          activeConversationId && !sidebarOpen ? "hidden md:block" : "block"
        )}
      >
        <Sidebar />
      </div>

      {/* Summarizer Panel */}
      <div
        className={cn(
          "h-full flex-1 overflow-y-auto p-6 md:p-8",
          !activeConversationId || sidebarOpen ? "hidden md:block" : "block"
        )}
      >
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/chat" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent">
                <ArrowLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
              </Link>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                  Message Summarizer
                </Title>
                <Text type="secondary">
                  Summarize messages for <strong>{activeConversation?.members.map(m => m.fullName).join(', ')}</strong>
                </Text>
              </div>
            </div>
            <Button 
              type="primary" 
              size="large" 
              icon={<Sparkles className="h-4 w-4" />}
              onClick={handleSummarize}
              loading={isSummarizing}
              disabled={filteredMessages.length === 0}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
              shape="round"
            >
              Summarize
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Filters Section (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              <Card 
                title={<div className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</div>} 
                className="shadow-sm border-border"
                styles={{ header: { borderBottom: '1px solid var(--border)' } }}
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Sender</label>
                    <Select
                      placeholder="Select sender"
                      style={{ width: '100%' }}
                      allowClear
                      onChange={(val) => setSenderFilter(val)}
                      value={senderFilter}
                      options={activeConversation?.members.map((m) => ({
                        label: m.fullName,
                        value: m.id
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Date Range</label>
                    <RangePicker
                      style={{ width: '100%' }}
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      onChange={(dates) => {
                        if (dates && dates[0] && dates[1]) {
                          setDateRange([dates[0], dates[1]]);
                        } else {
                          setDateRange(null);
                        }
                      }}
                    />
                  </div>
                  <div className="pt-2">
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      Showing {filteredMessages.length} of {messages.length} messages
                    </Text>
                  </div>
                </div>
              </Card>

              {/* Summary Section (Displayed only after generation) */}
              {summary && (
                <Card 
                  title={<div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Summary</div>}
                  className="shadow-md border-primary/20 bg-primary/5"
                  styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' } }}
                >
                  <div className="space-y-3">
                    {summary.map((line, idx) => (
                      <Paragraph key={idx} style={{ marginBottom: idx === summary.length - 1 ? 0 : '8px' }}>
                        • {line}
                      </Paragraph>
                    ))}
                  </div>
                </Card>
              )}

              {isSummarizing && (
                <Card className="flex items-center justify-center p-8 bg-muted/30 border-dashed">
                  <div className="flex flex-col items-center gap-3">
                    <Spin indicator={<Sparkles className="h-8 w-8 animate-pulse text-primary" />} />
                    <Text strong>AI is analyzing your conversation...</Text>
                  </div>
                </Card>
              )}
            </div>

            {/* Messages Section (2/3) */}
            <div className="lg:col-span-2">
              <Card 
                title={<div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Selected Messages</div>}
                className="shadow-sm h-full border-border"
                styles={{ 
                  header: { borderBottom: '1px solid var(--border)' },
                  body: { padding: 0 } 
                }}
              >
                {filteredMessages.length > 0 ? (
                  <Table 
                    columns={columns} 
                    dataSource={filteredMessages} 
                    rowKey="id"
                    pagination={{ pageSize: 15, size: 'small' }}
                    scroll={{ y: 'calc(100dvh - 350px)' }}
                    loading={loading}
                    size="middle"
                  />
                ) : (
                  <Empty 
                    description="No messages found for the selected filters" 
                    className="my-20"
                  />
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MessageSummarizerPage;
