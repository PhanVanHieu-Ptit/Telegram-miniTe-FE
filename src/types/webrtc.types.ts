/**
 * WebRTC Types
 * Shared type definitions for WebRTC calling feature
 */

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended";

export interface IncomingCall {
  callId?: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  roomId: string;
  offer?: RTCSessionDescriptionInit;
  callType?: 'audio' | 'video';
}

export interface IceCandidate {
  roomId: string;
  candidate: RTCIceCandidateInit;
}

// ---- Socket event payloads ----

export interface StartCallPayload {
  targetUserId: string;
  roomId: string;
  callerName: string;
  offer: RTCSessionDescriptionInit;
  callType: 'audio' | 'video';
  callId?: string;
}

export interface AcceptCallPayload {
  callerId: string;
  roomId: string;
  answer: RTCSessionDescriptionInit;
}

export interface RejectCallPayload {
  callerId: string;
  roomId: string;
}

export interface EndCallPayload {
  roomId: string;
}

export interface JoinRoomPayload {
  roomId: string;
}
