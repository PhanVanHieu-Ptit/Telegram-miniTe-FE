/**
 * useWebRTC — Custom hook for WebRTC peer-to-peer video calling
 *
 * Responsibilities:
 *  - Connect to rtc-service (Socket.io signaling) with JWT auth
 *  - Manage RTCPeerConnection lifecycle
 *  - Handle call flow: start → offer → answer → ICE → connected → hangup
 *  - Expose local and remote MediaStreams to the consumer
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/token-storage";
import type {
  AcceptCallPayload,
  CallStatus,
  EndCallPayload,
  IceCandidate,
  IncomingCall,
  JoinRoomPayload,
  RejectCallPayload,
  StartCallPayload,
} from "@/types/webrtc.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RTC_SERVICE_URL =
  import.meta.env.VITE_RTC_SERVICE_URL ?? "http://localhost:3001";

/** Public STUN servers — swap in TURN creds for production */
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

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
  /** Request camera+mic access — call this on component mount */
  getMedia: () => Promise<MediaStream | null>;
  /** Initiate a call to a remote user */
  startCall: (targetUserId: string, callerName: string) => Promise<void>;
  /** Accept an incoming call */
  acceptCall: () => Promise<void>;
  /** Decline an incoming call without answering */
  rejectCall: () => void;
  /** End the active call and release all resources */
  hangUp: () => void;
  /** Whether the socket is currently connected to rtc-service */
  isSocketConnected: boolean;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export const useWebRTC = (): UseWebRTCReturn => {
  // ──────────────────────────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────────────────────────

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // Refs (mutable, do NOT trigger re-renders)
  // ──────────────────────────────────────────────────────────────────────────

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null); // sync access in callbacks
  const roomIdRef = useRef<string | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Socket initialisation
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = tokenStorage.getToken();
    if (!token) {
      console.warn("[useWebRTC] No JWT found — socket will not connect");
      return;
    }

    const socket = io(RTC_SERVICE_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // ── Connection lifecycle ──────────────────────────────────────────────
    socket.on("connect", () => {
      console.log("[useWebRTC] Socket connected:", socket.id);
      setIsSocketConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[useWebRTC] Socket disconnected:", reason);
      setIsSocketConnected(false);
    });

    // ── Signaling events ──────────────────────────────────────────────────

    /** Remote peer is calling us */
    socket.on(
      "incoming-call",
      (data: {
        callerId: string;
        callerName: string;
        roomId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        console.log("[useWebRTC] Incoming call from", data.callerId);
        setIncomingCall({
          callerId: data.callerId,
          callerName: data.callerName,
          roomId: data.roomId,
          offer: data.offer,
        });
        setCallStatus("ringing");
      }
    );

    /** Callee accepted — we receive their SDP answer */
    socket.on(
      "call-answered",
      async (data: { answer: RTCSessionDescriptionInit }) => {
        console.log("[useWebRTC] Call answered — applying remote description");
        const pc = peerConnectionRef.current;
        if (!pc) return;
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setCallStatus("connected");
        } catch (err) {
          console.error("[useWebRTC] setRemoteDescription (answer) failed", err);
        }
      }
    );

    /** Remote ICE candidate received */
    socket.on("ice-candidate", async (data: IceCandidate) => {
      const pc = peerConnectionRef.current;
      if (!pc || !data.candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("[useWebRTC] addIceCandidate failed", err);
      }
    });

    /** Remote peer rejected our call */
    socket.on("call-rejected", () => {
      console.log("[useWebRTC] Call rejected by remote");
      cleanupCall();
    });

    /** Remote peer hung up */
    socket.on("call-ended", () => {
      console.log("[useWebRTC] Remote peer ended the call");
      cleanupCall();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      cleanupCall();
      stopLocalTracks();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. RTCPeerConnection factory
  // ──────────────────────────────────────────────────────────────────────────

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_CONFIG);

    // Add local media tracks so the remote peer receives our stream
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } else {
      console.warn(
        "[useWebRTC] createPeerConnection called before getMedia() — no local tracks added"
      );
    }

    // Receive remote tracks
    pc.ontrack = (event: RTCTrackEvent) => {
      console.log("[useWebRTC] Remote track received");
      setRemoteStream(event.streams[0] ?? null);
    };

    // Trickle ICE: send each candidate to signaling server as it's gathered
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && roomIdRef.current && socketRef.current) {
        const payload: IceCandidate = {
          roomId: roomIdRef.current,
          candidate: event.candidate.toJSON(),
        };
        socketRef.current.emit("ice-candidate", payload);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[useWebRTC] Connection state:", pc.connectionState);
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Media helpers
  // ──────────────────────────────────────────────────────────────────────────

  const getMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("[useWebRTC] getUserMedia failed", err);
      return null;
    }
  }, []);

  const stopLocalTracks = useCallback((): void => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Cleanup
  // ──────────────────────────────────────────────────────────────────────────

  const cleanupCall = useCallback((): void => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    roomIdRef.current = null;
    setRemoteStream(null);
    setIncomingCall(null);
    setCallStatus("idle");
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Call actions
  // ──────────────────────────────────────────────────────────────────────────

  /** Caller: create offer and notify remote peer */
  const startCall = useCallback(
    async (targetUserId: string, callerName: string): Promise<void> => {
      const socket = socketRef.current;
      if (!socket) {
        console.error("[useWebRTC] Socket not ready");
        return;
      }

      // Ensure we have media before starting
      if (!localStreamRef.current) {
        await getMedia();
      }

      const roomId = `room_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      roomIdRef.current = roomId;

      // Join the room first
      const joinPayload: JoinRoomPayload = { roomId };
      socket.emit("join-room", joinPayload);

      const pc = createPeerConnection();

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const payload: StartCallPayload = {
        targetUserId,
        roomId,
        callerName,
        offer,
      };
      socket.emit("start-call", payload);
      setCallStatus("calling");
    },
    [getMedia, createPeerConnection]
  );

  /** Callee: accept incoming call, send answer */
  const acceptCall = useCallback(async (): Promise<void> => {
    const socket = socketRef.current;
    if (!socket || !incomingCall) return;

    // Ensure we have local media
    if (!localStreamRef.current) {
      await getMedia();
    }

    roomIdRef.current = incomingCall.roomId;

    const joinPayload: JoinRoomPayload = { roomId: incomingCall.roomId };
    socket.emit("join-room", joinPayload);

    const pc = createPeerConnection();

    await pc.setRemoteDescription(
      new RTCSessionDescription(incomingCall.offer)
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const payload: AcceptCallPayload = {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
      answer,
    };
    socket.emit("accept-call", payload);

    setIncomingCall(null);
    setCallStatus("connected");
  }, [incomingCall, getMedia, createPeerConnection]);

  /** Callee: decline without answering */
  const rejectCall = useCallback((): void => {
    const socket = socketRef.current;
    if (!socket || !incomingCall) return;

    const payload: RejectCallPayload = {
      callerId: incomingCall.callerId,
      roomId: incomingCall.roomId,
    };
    socket.emit("reject-call", payload);
    cleanupCall();
  }, [incomingCall, cleanupCall]);

  /** Either side: end active call */
  const hangUp = useCallback((): void => {
    const socket = socketRef.current;
    if (socket && roomIdRef.current) {
      const payload: EndCallPayload = { roomId: roomIdRef.current };
      socket.emit("end-call", payload);
    }
    cleanupCall();
  }, [cleanupCall]);

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Public API
  // ──────────────────────────────────────────────────────────────────────────

  return {
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    getMedia,
    startCall,
    acceptCall,
    rejectCall,
    hangUp,
    isSocketConnected,
  };
};
