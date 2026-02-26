/**
 * MQTT Topic Manager
 * - Centralized topic definition and parsing
 * - Type-safe topic handling
 * - Eliminates duplicated regex patterns
 */

export const MQTT_TOPICS = {
    message: (conversationId: string) => `conversation/${conversationId}/message/new` as const,
    typing: (conversationId: string) => `conversation/${conversationId}/typing` as const,
    seen: (conversationId: string) => `conversation/${conversationId}/seen` as const,
    online: "presence/online" as const,
} as const;

// ============================================================================
// Topic Parsers
// ============================================================================

interface ParsedTopic {
    type: "message" | "typing" | "seen" | "online";
    conversationId?: string;
}

export function parseTopic(topic: string): ParsedTopic | null {
    // Match message topic: conversation/{id}/message/new
    const messageMatch = topic.match(/^conversation\/([^/]+)\/message\/new$/);
    if (messageMatch) {
        return { type: "message", conversationId: messageMatch[1] };
    }

    // Match typing topic: conversation/{id}/typing
    const typingMatch = topic.match(/^conversation\/([^/]+)\/typing$/);
    if (typingMatch) {
        return { type: "typing", conversationId: typingMatch[1] };
    }

    // Match seen topic: conversation/{id}/seen
    const seenMatch = topic.match(/^conversation\/([^/]+)\/seen$/);
    if (seenMatch) {
        return { type: "seen", conversationId: seenMatch[1] };
    }

    // Match online topic
    if (topic === MQTT_TOPICS.online) {
        return { type: "online" };
    }

    return null;
}

// ============================================================================
// Validation
// ============================================================================

export function isValidTopic(topic: string): boolean {
    return parseTopic(topic) !== null;
}

export function getTopicConversationId(topic: string): string | undefined {
    const parsed = parseTopic(topic);
    return parsed?.conversationId;
}
