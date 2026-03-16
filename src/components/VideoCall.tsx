/**
 * VideoCall — Full-screen video calling overlay component
 *
 * Usage:
 *   <VideoCall
 *     isOpen={callOpen}
 *     onClose={() => setCallOpen(false)}
 *     targetUserId="user_abc"
 *     targetUserName="Alice"
 *   />
 *
 * The component manages its own useWebRTC state internally.
 * Mount it only when needed (it will immediately request camera/mic on mount).
 */

import React, { useEffect, useRef } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Video,
  VideoOff,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VideoCallProps {
  /** Whether the overlay is rendered */
  isOpen: boolean;
  /** Called when the user closes/hangs-up */
  onClose: () => void;
  /** User ID of the remote participant (for outgoing calls) */
  targetUserId?: string;
  /** Display name of the remote participant */
  targetUserName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VideoCall: React.FC<VideoCallProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName = "Remote User",
}) => {
  // ──────────────────────────────────────────────────────────────────────────
  // Hook + Store
  // ──────────────────────────────────────────────────────────────────────────

  const {
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
  } = useWebRTC();

  const currentUser = useAuthStore((s) => s.user);

  // ──────────────────────────────────────────────────────────────────────────
  // Video element refs
  // ──────────────────────────────────────────────────────────────────────────

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // Request camera+mic on mount
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    void getMedia();
  }, [isOpen, getMedia]);

  // ──────────────────────────────────────────────────────────────────────────
  // Sync streams → <video> srcObject
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ──────────────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────────────

  const handleStartCall = async () => {
    if (!targetUserId) return;
    await startCall(targetUserId, currentUser?.displayName ?? "You");
  };

  const handleHangUp = () => {
    hangUp();
    onClose();
  };

  const handleReject = () => {
    rejectCall();
    onClose();
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Status helpers
  // ──────────────────────────────────────────────────────────────────────────

  const statusLabel: Record<typeof callStatus, string> = {
    idle: "Ready to call",
    calling: "Calling…",
    ringing: "Incoming call",
    connected: "Connected",
    ended: "Call ended",
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render guard
  // ──────────────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* ── Modal card ─────────────────────────────────────────────────────── */}
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl ring-1 ring-white/10">

        {/* ── Header bar ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            {/* Socket status indicator */}
            {isSocketConnected ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-400" />
            )}
            <span className="text-sm font-semibold text-white">
              {targetUserName}
            </span>
            <span
              className={`text-xs font-medium ${
                callStatus === "connected"
                  ? "text-emerald-400"
                  : callStatus === "calling" || callStatus === "ringing"
                  ? "text-amber-400"
                  : "text-gray-400"
              }`}
            >
              · {statusLabel[callStatus]}
            </span>
          </div>

          {/* Close button (only when not in an active call) */}
          {callStatus === "idle" && (
            <button
              id="video-call-close-btn"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Video canvases ───────────────────────────────────────────────── */}
        <div className="relative flex h-[420px] items-center justify-center bg-black">
          {/* Remote video (full canvas) */}
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
                {callStatus === "calling"
                  ? "Waiting for the other person to answer…"
                  : callStatus === "connected"
                  ? "Establishing video…"
                  : "No remote video yet"}
              </span>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-3 right-3 overflow-hidden rounded-xl shadow-lg ring-2 ring-white/20">
            <video
              id="local-video"
              ref={localVideoRef}
              autoPlay
              playsInline
              muted           // Prevent audio echo
              className="h-28 w-36 object-cover"
            />
            {!localStream && (
              <div className="flex h-28 w-36 items-center justify-center bg-gray-800">
                <VideoOff className="h-6 w-6 text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-gray-900/60 px-6 py-5">

          {/* ── IDLE: show start call button ─────────────────────────────── */}
          {callStatus === "idle" && targetUserId && (
            <button
              id="start-call-btn"
              onClick={handleStartCall}
              className="flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 active:scale-95"
            >
              <Phone className="h-4 w-4" />
              Start Video Call
            </button>
          )}

          {/* ── CALLING: show cancel button ───────────────────────────────── */}
          {callStatus === "calling" && (
            <>
              <div className="flex items-center gap-2 text-amber-400">
                <PhoneCall className="h-5 w-5 animate-pulse" />
                <span className="text-sm">Ringing…</span>
              </div>
              <button
                id="cancel-call-btn"
                onClick={handleHangUp}
                className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-600 active:scale-95"
              >
                <PhoneOff className="h-4 w-4" />
                Cancel
              </button>
            </>
          )}

          {/* ── CONNECTED: hang up ────────────────────────────────────────── */}
          {callStatus === "connected" && (
            <button
              id="hang-up-btn"
              onClick={handleHangUp}
              className="flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-600 active:scale-95"
            >
              <PhoneOff className="h-4 w-4" />
              Hang Up
            </button>
          )}
        </div>
      </div>

      {/* ── Incoming call overlay ───────────────────────────────────────────── */}
      {callStatus === "ringing" && incomingCall && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
                <p className="mt-1 text-sm text-gray-400">Incoming video call…</p>
              </div>
            </div>

            {/* Accept / Decline */}
            <div className="flex divide-x divide-white/10 border-t border-white/10">
              <button
                id="reject-call-btn"
                onClick={handleReject}
                className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10"
              >
                <PhoneOff className="h-4 w-4" />
                Decline
              </button>
              <button
                id="accept-call-btn"
                onClick={() => void acceptCall()}
                className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10"
              >
                <Phone className="h-4 w-4" />
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
