import apiClient from "@/api/axios";

export interface SummarizeRequest {
  /** Raw pre-formatted messages string (v1 local LLM path) */
  messages?: string;
  /** Fetch & filter messages from DB by conversationId (v2 preferred path) */
  conversationId?: string;
  senderFilter?: string;
  startTime?: string;
  endTime?: string;
}

export interface SummarizeResponse {
  success: boolean;
  summary: string;
  resolved: string[];
  pending: string[];
  language: 'vi';
}

export const messageSummaryService = {
  async summarize(payload: SummarizeRequest): Promise<SummarizeResponse> {
    try {
      const response = await apiClient.post<SummarizeResponse>("/messages/summarize", payload);
      return response.data;
    } catch (error) {
      console.error("Message summary API error:", error);
      throw error;
    }
  },

  async summarizeV2(payload: SummarizeRequest): Promise<SummarizeResponse> {
    try {
      const response = await apiClient.post<SummarizeResponse>("/api/v2/summarize", payload);
      return response.data;
    } catch (error) {
      console.error("Message summary v2 (HuggingFace) API error:", error);
      throw error;
    }
  },
};
