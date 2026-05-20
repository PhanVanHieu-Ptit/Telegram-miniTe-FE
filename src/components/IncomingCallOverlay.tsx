/**
 * IncomingCallOverlay — Global fullscreen overlay shown whenever there is an
 * incoming call, regardless of which page/chat the user is viewing.
 *
 * Rendered once at the App level. It reads the shared WebRTC context so it
 * works even if VideoCall is not mounted.
 */import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    User as UserIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWebRTCContext } from '@/contexts/webrtc.context';
import { playRingtone, type RingtoneHandle } from '@/lib/notification-sound';
import { useChatStore } from '@/store/chat.store';

const IncomingCallOverlay: React.FC = () => {
    const { t } = useTranslation();
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

    // Resolve caller display name & avatar from conversations store
    const conversations = useChatStore((s) => s.conversations);
    const callerInfo = useMemo(() => {
        if (!incomingCall) return null;
        for (const conv of conversations) {
            const member = conv.members.find((m) => m.id === incomingCall.callerId);
            if (member) {
                return {
                    name: member.fullName || incomingCall.callerName,
                    avatar: member.avatarUrl || incomingCall.callerAvatar || null,
                };
            }
        }
        return {
            name: incomingCall.callerName,
            avatar: incomingCall.callerAvatar || null,
        };
    }, [incomingCall, conversations]);

    // ── Ringtone ─────────────────────────────────────────────────────────
    const ringtoneRef = useRef<RingtoneHandle | null>(null);

    useEffect(() => {
        if (callStatus === 'ringing') {
            // Start ringtone when ringing
            ringtoneRef.current = playRingtone();
        } else {
            // Stop ringtone for any other status
            ringtoneRef.current?.stop();
            ringtoneRef.current = null;
        }
        return () => {
            ringtoneRef.current?.stop();
            ringtoneRef.current = null;
        };
    }, [callStatus]);

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
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callStatus]);

    useEffect(() => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md">
                <div className="w-full max-w-sm overflow-hidden rounded-[32px] bg-[#0a0f19]/80 backdrop-blur-2xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] animate-in zoom-in duration-300">
                    {/* Avatar + caller info */}
                    <div className="relative flex flex-col items-center gap-6 bg-gradient-to-b from-emerald-500/10 to-transparent px-8 py-12">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20 scale-150" />
                            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10 scale-125" />
                            {callerInfo?.avatar ? (
                                <img
                                    src={callerInfo.avatar}
                                    alt={callerInfo.name}
                                    className="relative h-24 w-24 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-2xl"
                                />
                            ) : (
                                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 ring-4 ring-emerald-500/30 shadow-2xl">
                                    <UserIcon className="h-12 w-12 text-emerald-400" />
                                </div>
                            )}
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-black text-white tracking-tight">
                                {callerInfo?.name ?? t('unknown')}
                            </h2>
                            <div className="flex items-center justify-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                                    {t('incoming_call', { type: incomingCall.callType ?? 'video' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Accept / Decline */}
                    <div className="flex p-6 pt-0 gap-4">
                        <button
                            onClick={handleReject}
                            className="group flex flex-1 items-center justify-center gap-2 h-14 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 font-bold transition-all duration-300 active:scale-95"
                        >
                            <div className="bg-rose-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                              <PhoneOff className="h-4 w-4 text-white" />
                            </div>
                            {t('decline')}
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={!incomingCall.offer}
                            className="group flex flex-1 items-center justify-center gap-2 h-14 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                            title={!incomingCall.offer ? t('connecting') : undefined}
                        >
                            {incomingCall.offer ? (
                                <>
                                  <div className="bg-emerald-500 p-2 rounded-lg animate-bounce group-hover:animate-none group-hover:scale-110 transition-transform">
                                    <Phone className="h-4 w-4 text-white" />
                                  </div>
                                  {t('accept')}
                                </>
                            ) : (
                                <><div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />{t('connecting')}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Active call UI (calling / connected) ────────────────────────────────
    if (callStatus === 'calling' || callStatus === 'connected') {
        const statusLabel: Record<string, string> = {
            calling: t('calling'),
            connected: t('connected'),
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
                                {incomingCall?.callerName ?? t('call')}
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
                                id="remote-video"
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
                                        ? t('waiting_for_answer')
                                        : t('establishing_video')}
                                </span>
                            </div>
                        )}

                        <div className="absolute bottom-3 right-3 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/20">
                            <video
                                id="local-video"
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
                                    <span className="text-sm">{t('ringing')}</span>
                                </div>
                                <button
                                    onClick={handleHangUp}
                                    className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-600 active:scale-95"
                                >
                                    <PhoneOff className="h-4 w-4" />
                                    {t('cancel')}
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
                                    {t('hang_up')}
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
