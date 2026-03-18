/**
 * IncomingCallOverlay — Global fullscreen overlay shown whenever there is an
 * incoming call, regardless of which page/chat the user is viewing.
 *
 * Rendered once at the App level. It reads the shared WebRTC context so it
 * works even if VideoCall is not mounted.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Phone,
    PhoneOff,
    Video,
    VideoOff,
    Mic,
    MicOff,
    Wifi,
    WifiOff,
    PhoneCall,
} from 'lucide-react';
import { useWebRTCContext } from '@/contexts/webrtc.context';

const IncomingCallOverlay: React.FC = () => {
    const {
        localStream,
        remoteStream,
        callStatus,
        incomingCall,
        acceptCall,
        rejectCall,
        hangUp,
        isSocketConnected,
    } = useWebRTCContext();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Call duration timer
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (callStatus === 'connected') {
            setCallDuration(0);
            timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [callStatus]);

    // Sync video elements
    useEffect(() => {
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const toggleAudio = () => {
        localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
        setIsAudioMuted((prev) => !prev);
    };

    const toggleVideo = () => {
        localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
        setIsVideoOff((prev) => !prev);
    };

    const handleAccept = async () => {
        await acceptCall();
    };

    const handleReject = () => {
        void rejectCall();
    };

    const handleHangUp = () => {
        void hangUp();
    };

    // ── Don't render anything when idle and no incoming call ─────────────────
    if (callStatus === 'idle' && !incomingCall) return null;

    // ── Incoming call popup (ringing) ───────────────────────────────────────
    if (callStatus === 'ringing' && incomingCall) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-gray-900 shadow-2xl ring-1 ring-white/10">
                    {/* Pulsing ring animation */}
                    <div className="relative flex flex-col items-center gap-4 bg-gradient-to-br from-emerald-900/60 to-gray-900 px-8 py-10">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
                            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40">
                                <Phone className="h-10 w-10 text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-semibold text-white">
                                {incomingCall.callerName}
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                Incoming {incomingCall.callType ?? 'video'} call…
                            </p>
                        </div>
                    </div>

                    {/* Accept / Decline */}
                    <div className="flex divide-x divide-white/10 border-t border-white/10">
                        <button
                            onClick={handleReject}
                            className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10"
                        >
                            <PhoneOff className="h-4 w-4" />
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10"
                        >
                            <Phone className="h-4 w-4" />
                            Accept
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Active call UI (calling / connected) ────────────────────────────────
    if (callStatus === 'calling' || callStatus === 'connected') {
        const statusLabel: Record<string, string> = {
            calling: 'Calling…',
            connected: 'Connected',
        };

        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl ring-1 ring-white/10">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <div className="flex items-center gap-2">
                            {isSocketConnected ? (
                                <Wifi className="h-4 w-4 text-emerald-400" />
                            ) : (
                                <WifiOff className="h-4 w-4 text-rose-400" />
                            )}
                            <span className="text-sm font-semibold text-white">
                                {incomingCall?.callerName ?? 'Call'}
                            </span>
                            <span
                                className={`text-xs font-medium ${callStatus === 'connected'
                                        ? 'text-emerald-400'
                                        : 'text-amber-400'
                                    }`}
                            >
                                · {statusLabel[callStatus]}
                                {callStatus === 'connected' &&
                                    ` · ${formatDuration(callDuration)}`}
                            </span>
                        </div>
                    </div>

                    {/* Video */}
                    <div className="relative flex h-[420px] items-center justify-center bg-black">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                <Video className="h-14 w-14 opacity-30" />
                                <span className="text-sm">
                                    {callStatus === 'calling'
                                        ? 'Waiting for the other person to answer…'
                                        : 'Establishing video…'}
                                </span>
                            </div>
                        )}

                        <div className="absolute bottom-3 right-3 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/20">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-28 w-36 object-cover"
                            />
                            {!localStream && (
                                <div className="flex h-28 w-36 items-center justify-center bg-gray-800">
                                    <VideoOff className="h-6 w-6 text-gray-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-gray-900/60 px-6 py-5">
                        {callStatus === 'calling' && (
                            <>
                                <div className="flex items-center gap-2 text-amber-400">
                                    <PhoneCall className="h-5 w-5 animate-pulse" />
                                    <span className="text-sm">Ringing…</span>
                                </div>
                                <button
                                    onClick={handleHangUp}
                                    className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-600 active:scale-95"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                    Cancel
                                </button>
                            </>
                        )}

                        {callStatus === 'connected' && (
                            <>
                                <button
                                    onClick={toggleAudio}
                                    className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 ${isAudioMuted
                                            ? 'bg-rose-500/80 hover:bg-rose-600'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {isAudioMuted ? (
                                        <MicOff className="h-5 w-5" />
                                    ) : (
                                        <Mic className="h-5 w-5" />
                                    )}
                                </button>
                                <button
                                    onClick={handleHangUp}
                                    className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-600 active:scale-95"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                    Hang Up
                                </button>
                                <button
                                    onClick={toggleVideo}
                                    className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 ${isVideoOff
                                            ? 'bg-rose-500/80 hover:bg-rose-600'
                                            : 'bg-white/10 hover:bg-white/20'
                                        }`}
                                >
                                    {isVideoOff ? (
                                        <VideoOff className="h-5 w-5" />
                                    ) : (
                                        <Video className="h-5 w-5" />
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default IncomingCallOverlay;
