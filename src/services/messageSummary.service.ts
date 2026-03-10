import apiClient from "@/api/axios";

export interface SummarizeRequest {
  messages: string;
  senderFilter?: string;
  startTime?: string;
  endTime?: string;
}

export interface SummarizeResponse {
  success: boolean;
  summary: string[];
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
};
