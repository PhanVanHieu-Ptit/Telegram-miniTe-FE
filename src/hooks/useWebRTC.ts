/**
 * useWebRTC — Custom hook for WebRTC peer-to-peer video/audio calling.
 *
 * Responsibilities:
 *  - Connect to CallWebRTC (rtc-service) via Socket.io with JWT auth
 *  - Persist call records via backend-api REST calls
 *  - Manage RTCPeerConnection lifecycle (offer → answer → ICE → connected)
 *  - Expose local/remote MediaStreams and call controls to consumers
 *
 * Signaling flow (outgoing call):
 *   1. startCall()        → POST /calls/start  (backend persists, notifies callee)
 *   2. socket: start-call → rtc-service routes offer to callee
 *   3. socket: call-answered ← callee answered → setRemoteDescription
 *   4. Trickle ICE via ice-candidate events
 *
 * Signaling flow (incoming call):
 *   1. socket: incoming-call ← rtc-service (forwarded from caller)
 *   2. acceptCall()       → POST /calls/accept + join-room + send SDP answer
 *   3. Trickle ICE
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { tokenStorage } from '@/lib/token-storage';
import { useAuthStore } from '@/store/auth.store';
import { callApi, type CallDTO } from '@/services/call.api';
import { fetchIceServers } from '@/api/ice-server.api';
import type {
  AcceptCallPayload,
  CallStatus,
  EndCallPayload,
  IceCandidate,
  IncomingCall,
  JoinRoomPayload,
  RejectCallPayload,
  StartCallPayload,
} from '@/types/webrtc.types';


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RTC_SERVICE_URL =
  import.meta.env.VITE_RTC_SERVICE_URL ?? 'http://localhost:4000';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseWebRTCReturn {
  /** Own camera+mic stream (muted in the <video> element to prevent echo) */
  localStream: MediaStream | null;
  /** Remote peer's media stream */
  remoteStream: MediaStream | null;
  /** High-level call state machine status */
  callStatus: CallStatus;
  /** Populated only when an incoming call arrives before it's accepted */
  incomingCall: IncomingCall | null;
  /** Current persisted call record from backend */
  activeCall: CallDTO | null;
  /** Request camera+mic access — call this before startCall */
  getMedia: (type?: 'audio' | 'video') => Promise<MediaStream | null>;
  /** Initiate an outgoing call */
  startCall: (targetUserId: string, callerName: string, callType?: 'audio' | 'video') => Promise<void>;
  /** Accept an incoming call */
  acceptCall: () => Promise<void>;
  /** Decline an incoming call */
  rejectCall: () => Promise<void>;
  /** End the active call and release all resources */
  hangUp: () => Promise<void>;
  /** Whether the socket is connected to rtc-service */
  isSocketConnected: boolean;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export const useWebRTC = (): UseWebRTCReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);

  // ── State ──────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<CallDTO | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // ── 1. Socket initialization ────────────────────────────────────────────────

  useEffect(() => {
    const token = accessToken || tokenStorage.getToken();
    if (!token) {
      console.warn('[useWebRTC] No JWT — socket will not connect');
      return;
    }

    const socket = io(RTC_SERVICE_URL, {
      auth: { token },
      // Allow fallback if websocket fails
      // transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ────────────────────────────────────────────────
    if (socket.connected) {
      setIsSocketConnected(true);
    }

    socket.on('connect', () => {
      console.log('[useWebRTC] Socket connected:', socket.id);
      setIsSocketConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[useWebRTC] Socket disconnected:', reason);
      setIsSocketConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[useWebRTC] Socket connection error:', err.message);
      setIsSocketConnected(false); // Make sure it stays false on error
    });

    // ── Incoming call ───────────────────────────────────────────────────────
    socket.on(
      'incoming-call',
      (data: { callId?: string; callerId: string; callerName: string; roomId: string; offer?: RTCSessionDescriptionInit; callType?: 'audio' | 'video' }) => {
        console.log('[useWebRTC] Incoming call from', data.callerId);
        // Merge with any previous incoming-call data for the same room to
        // handle the two notifications (backend REST + socket start-call)
        // arriving in either order without losing the SDP offer or callId.
        setIncomingCall((prev) => {
          if (prev && prev.roomId === data.roomId) {
            return {
              callId: data.callId ?? prev.callId,
              callerId: data.callerId ?? prev.callerId,
              callerName: data.callerName ?? prev.callerName,
              roomId: data.roomId,
              offer: data.offer ?? prev.offer,
              callType: data.callType ?? prev.callType ?? 'video',
            };
          }
          return {
            callId: data.callId,
            callerId: data.callerId,
            callerName: data.callerName,
            roomId: data.roomId,
            offer: data.offer,
            callType: data.callType ?? 'video',
          };
        });
        if (data.callId) {
          setActiveCall((prev) => prev ?? ({ id: data.callId } as CallDTO));
        }
        setCallStatus('ringing');
      }
    );

    // ── Call accepted (caller side) ─────────────────────────────────────────
    socket.on('call-answered', async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log('[useWebRTC] Call answered — applying remote description');
      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn('[useWebRTC] Received answer but no peer connection exists');
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        // Note: callStatus 'connected' is set when ICE connection succeeds
        // but we can set it here too for UI feedback as negotiation is complete.
        setCallStatus('connected');
      } catch (err) {
        console.error('[useWebRTC] setRemoteDescription (answer) failed', err);
      }
    });

    // ── ICE candidate ───────────────────────────────────────────────────────
    socket.on('ice-candidate', async (data: IceCandidate) => {
      const pc = peerConnectionRef.current;
      if (!pc || !data.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.warn('[useWebRTC] addIceCandidate failed', err);
      }
    });

    // ── Call rejected ───────────────────────────────────────────────────────
    socket.on('call-rejected', (data?: { reason?: string }) => {
      console.log('[useWebRTC] Call rejected:', data?.reason);
      cleanupCall();
    });

    // ── Call ended by remote ────────────────────────────────────────────────
    socket.on('call-ended', (data?: { endedBy?: string; duration?: number }) => {
      console.log('[useWebRTC] Remote ended the call', data);
      cleanupCall();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupCall();
      stopLocalTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // ── 2. RTCPeerConnection factory ────────────────────────────────────────────


  const createPeerConnection = useCallback(async (): Promise<RTCPeerConnection> => {
    let iceServers: RTCIceServer[] = [];
    try {
      const data = await fetchIceServers();
      // Handle both { iceServers: [...] } and [...] formats
      if (Array.isArray(data)) {
        iceServers = data;
      } else if (data && Array.isArray(data.iceServers)) {
        iceServers = data.iceServers;
      }
    } catch (err) {
      console.warn('[useWebRTC] Failed to fetch ICE servers, fallback to default', err);
      // fallback: public STUN
      iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
      ];
    }
    // Remove iceTransportPolicy: 'relay' to allow direct connections (STUN/host)
    // combined with TURN if available. Forced relay is often too restrictive.
    const pc = new RTCPeerConnection({ iceServers });

    // Add local tracks
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } else {
      console.warn('[useWebRTC] createPeerConnection called before getMedia()');
    }

    // Receive remote tracks
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log('[useWebRTC] Remote track received');
      setRemoteStream(event.streams[0] ?? null);
    };

    // Trickle ICE
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && roomIdRef.current && socketRef.current) {
        const payload: IceCandidate = {
          roomId: roomIdRef.current,
          candidate: event.candidate.toJSON(),
        };
        socketRef.current.emit('ice-candidate', payload);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[useWebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected') {
        // Attempt ICE restart before giving up
        console.log('[useWebRTC] Connection disconnected — attempting ICE restart');
        pc.restartIce();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  // ── 3. Media helpers ────────────────────────────────────────────────────────

  const getMedia = useCallback(async (type: 'audio' | 'video' = 'video'): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('[useWebRTC] getUserMedia failed', err);
      return null;
    }
  }, []);

  const stopLocalTracks = useCallback((): void => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  }, []);

  // ── 4. Cleanup ──────────────────────────────────────────────────────────────

  const cleanupCall = useCallback((): void => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    roomIdRef.current = null;
    setRemoteStream(null);
    setIncomingCall(null);
    setActiveCall(null);
    setCallStatus('idle');
  }, []);

  // ── 5. Call actions ─────────────────────────────────────────────────────────

  /**
   * CALLER: persist call in backend, then send WebRTC offer via socket.
   */
  const startCall = useCallback(
    async (targetUserId: string, callerName: string, callType: 'audio' | 'video' = 'video'): Promise<void> => {
      const socket = socketRef.current;
      if (!socket) {
        console.error('[useWebRTC] Socket not initialized');
        return;
      }

      // Wait for connection if not yet connected (up to 5 s)
      if (!socket.connected) {
        console.log('[useWebRTC] Waiting for socket connection…');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.off('connect', onConnect);
            reject(new Error('Socket connection timeout'));
          }, 5000);
          const onConnect = () => {
            clearTimeout(timeout);
            resolve();
          };
          socket.once('connect', onConnect);
        }).catch((err) => {
          console.error('[useWebRTC]', err.message);
          return;
        });
        if (!socket.connected) return;
      }

      setCallStatus('calling');

      try {
        // Step 1: Acquire media
        if (!localStreamRef.current) {
          await getMedia(callType);
        }

        // Step 2: Persist in backend FIRST to get roomId
        const callRecord = await callApi.startCall(targetUserId, callType);
        setActiveCall(callRecord);
        const roomId = callRecord.roomName;
        roomIdRef.current = roomId;

        // Step 3: Join room on rtc-service
        const joinPayload: JoinRoomPayload = { roomId };
        socket.emit('join-room', joinPayload);

        // Step 4: Create PeerConnection + offer
        // (Setting roomIdRef.current BEFORE this ensures early ICE candidates are relayed)
        const pc = await createPeerConnection();
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === 'video' });
        await pc.setLocalDescription(offer);

        // Step 5: Send offer via socket (rtc-service routes it to callee)
        const startPayload: StartCallPayload = {
          targetUserId,
          roomId,
          callerName,
          offer: pc.localDescription as RTCSessionDescriptionInit,
          callType,
          callId: callRecord.id,
        };
        socket.emit('start-call', startPayload);
      } catch (err) {
        console.error('[useWebRTC] startCall failed', err);
        cleanupCall();
      }
    },
    [getMedia, createPeerConnection, cleanupCall]
  );

  /**
   * CALLEE: accept incoming call — send SDP answer, notify backend.
   */
  const acceptCall = useCallback(async (): Promise<void> => {
    const socket = socketRef.current;
    if (!socket || !incomingCall) return;

    if (!incomingCall.offer) {
      console.error('[useWebRTC] Cannot accept call — SDP offer not yet received');
      return;
    }

    try {
      // Step 1: Acquire media (match incoming call type)
      const mediaType = incomingCall.callType ?? 'video';
      if (!localStreamRef.current) {
        await getMedia(mediaType);
      }

      // Step 2: Join call room
      roomIdRef.current = incomingCall.roomId;
      socket.emit('join-room', { roomId: incomingCall.roomId } as JoinRoomPayload);

      // Step 3: Build PeerConnection + SDP answer
      const pc = await createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Step 4: Send answer via socket
      const payload: AcceptCallPayload = {
        callerId: incomingCall.callerId,
        roomId: incomingCall.roomId,
        answer,
      };
      socket.emit('accept-call', payload);

      // Step 5: Persist in backend (non-blocking — best effort)
      if (activeCall?.id) {
        callApi.acceptCall(activeCall.id).then(setActiveCall).catch(console.error);
      }

      setIncomingCall(null);
      setCallStatus('connected');
    } catch (err) {
      console.error('[useWebRTC] acceptCall failed', err);
      cleanupCall();
    }
  }, [incomingCall, activeCall, getMedia, createPeerConnection, cleanupCall]);

  /**
   * CALLEE: decline without answering.
   */
  const rejectCall = useCallback(async (): Promise<void> => {
    const socket = socketRef.current;
    if (!socket || !incomingCall) return;

    const payload: RejectCallPayload = {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
    };
    socket.emit('reject-call', payload);

    // Notify backend (non-blocking)
    if (activeCall?.id) {
      callApi.rejectCall(activeCall.id).catch(console.error);
    }

    cleanupCall();
  }, [incomingCall, activeCall, cleanupCall]);

  /**
   * Either side: end the active call.
   */
  const hangUp = useCallback(async (): Promise<void> => {
    const socket = socketRef.current;
    if (socket && roomIdRef.current) {
      const payload: EndCallPayload = { roomId: roomIdRef.current };
      socket.emit('end-call', payload);
    }

    // Persist in backend (non-blocking)
    if (activeCall?.id) {
      callApi.endCall(activeCall.id).catch(console.error);
    }

    cleanupCall();
    stopLocalTracks();
  }, [activeCall, cleanupCall, stopLocalTracks]);

  // ── 6. Public API ────────────────────────────────────────────────────────────

  return {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    activeCall,
    getMedia,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    isSocketConnected,
  };
};
