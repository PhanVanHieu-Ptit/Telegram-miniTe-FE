/**
 * WebRTC Context — Global provider that keeps a persistent socket connection
 * to the CallWebRTC signaling service so incoming calls are received on ALL
 * tabs/browsers, even when the VideoCall component is not mounted.
 *
 * Usage:
 *   <WebRTCProvider>        ← wrap in App.tsx (inside auth-ready guard)
 *     <VideoCall … />       ← consumes useWebRTCContext()
 *   </WebRTCProvider>
 */

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
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

// Không dùng ICE_CONFIG hardcode nữa

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

export interface WebRTCContextValue {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    callStatus: CallStatus;
    incomingCall: IncomingCall | null;
    activeCall: CallDTO | null;
    isSocketConnected: boolean;
    getMedia: (type?: 'audio' | 'video') => Promise<MediaStream | null>;
    startCall: (
        targetUserId: string,
        callerName: string,
        callType?: 'audio' | 'video',
    ) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => Promise<void>;
    hangUp: () => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

/** Consume the global WebRTC context. Must be used inside <WebRTCProvider>. */
export const useWebRTCContext = (): WebRTCContextValue => {
    const ctx = useContext(WebRTCContext);
    if (!ctx) {
        throw new Error('useWebRTCContext must be used within <WebRTCProvider>');
    }
    return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const WebRTCProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    // ── State ────────────────────────────────────────────────────────────────
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [activeCall, setActiveCall] = useState<CallDTO | null>(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    // ── Refs ─────────────────────────────────────────────────────────────────
    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const roomIdRef = useRef<string | null>(null);

    // ── Helpers (stable refs for use inside useEffect) ───────────────────────

    const cleanupCall = useCallback((): void => {
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        roomIdRef.current = null;
        setRemoteStream(null);
        setIncomingCall(null);
        setActiveCall(null);
        setCallStatus('idle');
    }, []);

    const stopLocalTracks = useCallback((): void => {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
    }, []);

    // ── 1. Socket — always connected while authenticated ────────────────────

    useEffect(() => {
        const token = accessToken || tokenStorage.getToken();
        if (!token) {
            if (isAuthenticated) {
                console.warn(
                    '[WebRTC] Authenticated but no JWT available for RTC socket. ' +
                    'Token will be fetched on next auth refresh.',
                );
            }
            return;
        }

        const socket = io(RTC_SERVICE_URL, {
            auth: { token },
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        if (socket.connected) setIsSocketConnected(true);

        socket.on('connect', () => {
            console.log('[WebRTC] Socket connected:', socket.id);
            setIsSocketConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.warn('[WebRTC] Socket disconnected:', reason);
            setIsSocketConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[WebRTC] Socket connection error:', err.message);
            setIsSocketConnected(false);
        });

        // ── Incoming call ───────────────────────────────────────────────────
        socket.on(
            'incoming-call',
            (data: {
                callId?: string;
                callerId: string;
                callerName: string;
                callerAvatar?: string | null;
                roomId: string;
                offer?: RTCSessionDescriptionInit;
                callType?: 'audio' | 'video';
            }) => {
                console.log('[WebRTC] Incoming call from', data.callerId);
                setIncomingCall((prev) => {
                    if (prev && prev.roomId === data.roomId) {
                        return {
                            callId: data.callId ?? prev.callId,
                            callerId: data.callerId ?? prev.callerId,
                            callerName: data.callerName ?? prev.callerName,
                            callerAvatar: data.callerAvatar ?? prev.callerAvatar,
                            roomId: data.roomId,
                            offer: data.offer ?? prev.offer,
                            callType: data.callType ?? prev.callType ?? 'video',
                        };
                    }
                    return {
                        callId: data.callId,
                        callerId: data.callerId,
                        callerName: data.callerName,
                        callerAvatar: data.callerAvatar,
                        roomId: data.roomId,
                        offer: data.offer,
                        callType: data.callType ?? 'video',
                    };
                });
                if (data.callId) {
                    setActiveCall((prev) => prev ?? ({ id: data.callId } as CallDTO));
                }
                setCallStatus('ringing');
            },
        );

        // ── Call answered (caller side) ─────────────────────────────────────
        socket.on(
            'call-answered',
            async (data: { answer: RTCSessionDescriptionInit }) => {
                console.log('[WebRTC] Call answered — applying remote description');
                const pc = peerConnectionRef.current;
                if (!pc) {
                    console.warn('[WebRTC] Received answer but no peer connection exists');
                    return;
                }
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    // Note: callStatus 'connected' is set when ICE connection succeeds
                    // but we can set it here too for UI feedback as negotiation is complete.
                    setCallStatus('connected');
                } catch (err) {
                    console.error('[WebRTC] setRemoteDescription (answer) failed', err);
                }
            },
        );

        // ── ICE candidate ───────────────────────────────────────────────────
        socket.on('ice-candidate', async (data: IceCandidate) => {
            const pc = peerConnectionRef.current;
            if (!pc || !data.candidate) return;
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) {
                console.warn('[WebRTC] addIceCandidate failed', err);
            }
        });

        // ── Call rejected / ended ───────────────────────────────────────────
        socket.on('call-rejected', () => cleanupCall());
        socket.on('call-ended', () => cleanupCall());

        return () => {
            socket.disconnect();
            socketRef.current = null;
            cleanupCall();
            stopLocalTracks();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, isAuthenticated]);

    // ── 2. PeerConnection factory ───────────────────────────────────────────

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
            console.warn('[WebRTC] Failed to fetch ICE servers, fallback to default', err);
            // fallback: public STUN
            iceServers = [
                { urls: 'stun:stun.l.google.com:19302' },
            ];
        }
        // Remove iceTransportPolicy: 'relay' to allow direct connections (STUN/host)
        // combined with TURN if available. Forced relay is often too restrictive.
        const pc = new RTCPeerConnection({ iceServers });

        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        } else {
            console.warn('[WebRTC] createPeerConnection called before getMedia()');
        }

        pc.ontrack = (event: RTCTrackEvent) => {
            console.log('[WebRTC] Remote track received');
            setRemoteStream(event.streams[0] ?? null);
        };

        pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate && roomIdRef.current && socketRef.current) {
                socketRef.current.emit('ice-candidate', {
                    roomId: roomIdRef.current,
                    candidate: event.candidate.toJSON(),
                } satisfies IceCandidate);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState);
            if (pc.connectionState === 'disconnected') {
                pc.restartIce();
            } else if (
                pc.connectionState === 'failed' ||
                pc.connectionState === 'closed'
            ) {
                cleanupCall();
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [cleanupCall]);

    // ── 3. Media helpers ────────────────────────────────────────────────────

    const getMedia = useCallback(
        async (type: 'audio' | 'video' = 'video'): Promise<MediaStream | null> => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: type === 'video',
                });
                localStreamRef.current = stream;
                setLocalStream(stream);
                return stream;
            } catch (err) {
                console.error('[WebRTC] getUserMedia failed', err);
                return null;
            }
        },
        [],
    );

    // ── 4. Call actions ─────────────────────────────────────────────────────

    const startCall = useCallback(
        async (
            targetUserId: string,
            callerName: string,
            callType: 'audio' | 'video' = 'video',
        ): Promise<void> => {
            let socket = socketRef.current;

            // ── Lazy socket recovery ────────────────────────────────────────
            // If the socket was never created (e.g. token arrived after the
            // initial effect ran), try to create it on-demand so the call is
            // not silently dropped.
            if (!socket) {
                const token =
                    useAuthStore.getState().accessToken || tokenStorage.getToken();
                if (!token) {
                    console.error(
                        '[WebRTC] Cannot start call — no authentication token available',
                    );
                    return;
                }
                console.log('[WebRTC] Socket not found, creating on-demand…');
                socket = io(RTC_SERVICE_URL, {
                    auth: { token },
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                });
                socketRef.current = socket;

                // Wait for connection before proceeding
                try {
                    await new Promise<void>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Socket connection timeout'));
                        }, 5000);
                        socket!.once('connect', () => {
                            clearTimeout(timeout);
                            setIsSocketConnected(true);
                            resolve();
                        });
                        socket!.once('connect_error', (err) => {
                            clearTimeout(timeout);
                            reject(err);
                        });
                    });
                } catch (err) {
                    console.error('[WebRTC] On-demand socket failed:', err);
                    socketRef.current = null;
                    return;
                }
            }

            if (!socket.connected) {
                console.log('[WebRTC] Waiting for socket connection…');
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
                    console.error('[WebRTC]', err.message);
                });
                if (!socket.connected) return;
            }

            setCallStatus('calling');

            try {
                // Step 1: Acquire media
                if (!localStreamRef.current) await getMedia(callType);

                // Step 2: Persist in backend FIRST to get roomId
                const callRecord = await callApi.startCall(targetUserId, callType);
                setActiveCall(callRecord);
                const roomId = callRecord.roomName;
                roomIdRef.current = roomId;

                // Step 3: Join room on rtc-service
                socket.emit('join-room', { roomId } satisfies JoinRoomPayload);

                // Step 4: Create PeerConnection + offer
                // (Setting roomIdRef.current BEFORE this ensures early ICE candidates are relayed)
                const pc = await createPeerConnection();
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: callType === 'video',
                });
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
                console.error('[WebRTC] startCall failed', err);
                cleanupCall();
            }
        },
        [getMedia, createPeerConnection, cleanupCall],
    );

    const acceptCall = useCallback(async (): Promise<void> => {
        const socket = socketRef.current;
        if (!socket || !incomingCall) return;

        if (!incomingCall.offer) {
            console.error('[WebRTC] Cannot accept — SDP offer not yet received');
            return;
        }

        try {
            const mediaType = incomingCall.callType ?? 'video';
            if (!localStreamRef.current) await getMedia(mediaType);

            roomIdRef.current = incomingCall.roomId;
            socket.emit('join-room', {
                roomId: incomingCall.roomId,
            } satisfies JoinRoomPayload);

            const pc = await createPeerConnection();
            await pc.setRemoteDescription(
                new RTCSessionDescription(incomingCall.offer),
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const payload: AcceptCallPayload = {
                callerId: incomingCall.callerId,
                roomId: incomingCall.roomId,
                answer,
            };
            socket.emit('accept-call', payload);

            if (activeCall?.id) {
                callApi
                    .acceptCall(activeCall.id)
                    .then(setActiveCall)
                    .catch(console.error);
            }

            setIncomingCall(null);
            setCallStatus('connected');
        } catch (err) {
            console.error('[WebRTC] acceptCall failed', err);
            cleanupCall();
        }
    }, [incomingCall, activeCall, getMedia, createPeerConnection, cleanupCall]);

    const rejectCall = useCallback(async (): Promise<void> => {
        const socket = socketRef.current;
        if (!socket || !incomingCall) return;

        socket.emit('reject-call', {
            callerId: incomingCall.callerId,
            roomId: incomingCall.roomId,
        } satisfies RejectCallPayload);

        if (activeCall?.id) {
            callApi.rejectCall(activeCall.id).catch(console.error);
        }

        cleanupCall();
    }, [incomingCall, activeCall, cleanupCall]);

    const hangUp = useCallback(async (): Promise<void> => {
        const socket = socketRef.current;
        if (socket && roomIdRef.current) {
            socket.emit('end-call', {
                roomId: roomIdRef.current,
            } satisfies EndCallPayload);
        }

        if (activeCall?.id) {
            callApi.endCall(activeCall.id).catch(console.error);
        }

        cleanupCall();
        stopLocalTracks();
    }, [activeCall, cleanupCall, stopLocalTracks]);

    // ── 5. Context value ────────────────────────────────────────────────────

    const value: WebRTCContextValue = {
        localStream,
        remoteStream,
        callStatus,
        incomingCall,
        activeCall,
        isSocketConnected,
        getMedia,
        startCall,
        acceptCall,
        rejectCall,
        hangUp,
    };

    return (
        <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
    );
};
