import type { Message } from "@/types/chat.types";

export function getMessagePreview(message?: Message): string {
  if (!message) return "";

  const type = (message.type || "TEXT").toUpperCase();
  const hasAttachments = !!(message.attachments && message.attachments.length > 0);

  if (type === "TEXT") {
    if (hasAttachments) {
      const firstType = message.attachments?.[0]?.type || "";
      if (firstType.startsWith("image/")) return "📷 Photo";
      if (firstType.startsWith("video/")) return "📹 Video";
      if (firstType.startsWith("audio/")) return "🎤 Voice message";
      return "📄 File";
    }
    
    // Check if it's a JSON payload (Poll, Location, etc.)
    if (message.content && (message.content.startsWith("{") || message.content.startsWith("["))) {
        try {
            const payload = JSON.parse(message.content);
            if ("lat" in payload && "lng" in payload) return "📍 Location";
            if ("question" in payload && "options" in payload) return "📊 Poll";
            if ("bankName" in payload && "accountNumber" in payload) return "💳 Bank details";
            if ("phone" in payload && "name" in payload) return "👤 Contact";
        } catch {
            // Not JSON
        }
    }

    // Check if it's a link
    if (message.content && /^https?:\/\/[^\s]+$/.test(message.content.trim())) {
        return "🔗 Link";
    }

    return message.content || "";
  }

  switch (type) {
    case "IMAGE": return "📷 Photo";
    case "GIF": return "🎬 GIF";
    case "VIDEO": return "📹 Video";
    case "VOICE": return "🎤 Voice message";
    case "FILE": return "📄 File";
    case "LOCATION": return "📍 Location";
    case "POLL": return "📊 Poll";
    case "CONTACT": return "👤 Contact";
    case "BANK": return "💳 Bank details";
    case "LINK": return "🔗 Link";
    default: return message.content || "Message";
  }
}
