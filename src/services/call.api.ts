/**
 * call.api.ts — REST client for call lifecycle endpoints on backend-api.
 *
 * All state-changing operations (start/accept/reject/end) hit the backend
 * so the call record is persisted in MongoDB and the backend can dispatch
 * notifications to the rtc-service.
 */

import apiClient from '@/api/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallDTO {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'initiating' | 'ringing' | 'ongoing' | 'ended' | 'rejected' | 'missed' | 'failed';
  callType: 'audio' | 'video';
  roomName: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const callApi = {
  /**
   * Initiate a call toward another user.
   * The backend persists the call and notifies the callee via rtc-service.
   */
  async startCall(receiverId: string, callType: 'audio' | 'video' = 'video'): Promise<CallDTO> {
    const { data } = await apiClient.post<CallDTO>('/calls/start', { receiverId, callType });
    return data;
  },

  async acceptCall(callId: string): Promise<CallDTO> {
    const { data } = await apiClient.post<CallDTO>('/calls/accept', { callId });
    return data;
  },

  async rejectCall(callId: string, reason?: string): Promise<CallDTO> {
    const { data } = await apiClient.post<CallDTO>('/calls/reject', { callId, reason });
    return data;
  },

  async endCall(callId: string, reason?: string): Promise<CallDTO> {
    const { data } = await apiClient.post<CallDTO>('/calls/end', { callId, reason });
    return data;
  },

  async getCall(callId: string): Promise<CallDTO> {
    const { data } = await apiClient.get<CallDTO>(`/calls/${callId}`);
    return data;
  },

  async getHistory(): Promise<CallDTO[]> {
    const { data } = await apiClient.get<CallDTO[]>('/calls/history');
    return data;
  },
};
