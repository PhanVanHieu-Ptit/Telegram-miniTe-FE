import apiClient from "./axios";

export interface SummarizeRequest {
  conversationId: string;
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

export const summarizeMessages = async (payload: SummarizeRequest): Promise<SummarizeResponse> => {
  const response = await apiClient.post<SummarizeResponse>("/api/v2/summarize", payload);
  return response.data;
};
