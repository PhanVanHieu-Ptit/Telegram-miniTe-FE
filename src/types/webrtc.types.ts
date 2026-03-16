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
  callerId: string;
  callerName: string;
  roomId: string;
  offer: RTCSessionDescriptionInit;
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
