import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { useChatStore } from "@/store/chat.store";
import { cn } from "@/lib/utils";
import { getMqttClient, type AppMqttClient, type MqttMessage } from "@/mqtt/mqtt.client";
import type { Message } from "@/types/chat.types";
import { publishConversationSeen, subscribeToConversationSeen } from "@/mqtt/mqtt.service";

const MQTT_URL = import.meta.env.VITE_MQTT_URL ?? "ws://localhost:1883";

export default function ChatPage() {
    const activeConversationId = useChatStore((s) => s.activeConversationId);
    const sidebarOpen = useChatStore((s) => s.sidebarOpen);
    const addMessage = useChatStore((s) => s.addMessage);
    const fetchConversations = useChatStore((s) => s.fetchConversations);
    const messages = useChatStore((s) => s.messages);

    // Track MQTT client and subscription state
    const mqttClientRef = useRef<AppMqttClient | null>(null);
    const currentSubscriptionRef = useRef<string | null>(null);
    const messageHandlerRef = useRef<(() => void) | null>(null);

    // Initialize MQTT client
    useEffect(() => {
        const initializeMqtt = async () => {
            try {
                const client = getMqttClient({ url: MQTT_URL });
                await client.connect();
                mqttClientRef.current = client;

                // Setup message handler
                const unsubscribe = client.onMessage<Message>((message: MqttMessage<Message>) => {
                    const { topic, payload } = message;

                    // Handle message events: chat/{conversationId}
                    if (topic.startsWith("chat/") && payload) {
                        addMessage(payload);
                    }
                });

                messageHandlerRef.current = unsubscribe;
            } catch (error) {
                console.error("Failed to initialize MQTT client:", error);
            }
        };

        void initializeMqtt();

        // Cleanup on unmount
        return () => {
            if (messageHandlerRef.current) {
                messageHandlerRef.current();
                messageHandlerRef.current = null;
            }
            if (mqttClientRef.current && currentSubscriptionRef.current) {
                mqttClientRef.current
                    .unsubscribe(`chat/${currentSubscriptionRef.current}`)
                    .catch((error) => {
                        console.error("Failed to unsubscribe on unmount:", error);
                    });
            }
        };
    }, [addMessage]);

    // Subscribe/unsubscribe based on conversationId changes
    useEffect(() => {
        const client = mqttClientRef.current;
        if (!client || !activeConversationId) {
            return;
        }

        // Prevent duplicate subscription
        if (currentSubscriptionRef.current === activeConversationId) {
            return;
        }

        let isSubscribed = true;

        const manageSubscription = async () => {
            try {
                // Unsubscribe from previous conversation
                if (currentSubscriptionRef.current) {
                    await client.unsubscribe(`chat/${currentSubscriptionRef.current}`);
                }

                // Only subscribe if this effect hasn't been cleaned up
                if (isSubscribed) {
                    // Subscribe to new conversation
                    const topic = `chat/${activeConversationId}`;
                    await client.subscribe(topic);
                    currentSubscriptionRef.current = activeConversationId;

                    console.log(`Subscribed to topic: ${topic}`);

                    // Subscribe to seen updates for this conversation
                    await subscribeToConversationSeen(client, activeConversationId);

                    // Publish seen status for the last message if exists
                    const conversationMessages = messages.filter(
                        (msg) => msg.conversationId === activeConversationId
                    );
                    const lastMessage = conversationMessages[conversationMessages.length - 1];

                    if (lastMessage) {
                        await publishConversationSeen(client, activeConversationId, lastMessage.id);
                    }
                }
            } catch (error) {
                console.error("Failed to manage MQTT subscription:", error);
            }
        };

        void manageSubscription();

        // Cleanup subscription when conversationId changes or component unmounts
        return () => {
            isSubscribed = false;
            if (client && currentSubscriptionRef.current === activeConversationId) {
                const topicToUnsubscribe = activeConversationId;
                client
                    .unsubscribe(`chat/${topicToUnsubscribe}`)
                    .then(() => {
                        if (currentSubscriptionRef.current === topicToUnsubscribe) {
                            currentSubscriptionRef.current = null;
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to unsubscribe on conversation change:", error);
                    });
            }
        };
    }, [activeConversationId]);

    // Publish seen status when new messages arrive in active conversation
    useEffect(() => {
        const client = mqttClientRef.current;
        if (!client || !activeConversationId || messages.length === 0) {
            return;
        }

        const conversationMessages = messages.filter(
            (msg) => msg.conversationId === activeConversationId
        );
        const lastMessage = conversationMessages[conversationMessages.length - 1];

        if (lastMessage) {
            publishConversationSeen(client, activeConversationId, lastMessage.id).catch((error) => {
                console.error("Failed to publish seen status:", error);
            });
        }
    }, [messages, activeConversationId]);

    // Fetch conversations on mount
    useEffect(() => {
        void fetchConversations();
    }, [fetchConversations]);

    return (
        <main className="flex h-dvh w-full overflow-hidden">
            {/* Sidebar */}
            <div
                className={cn(
                    "h-full w-full shrink-0 border-r border-border md:w-80",
                    activeConversationId && !sidebarOpen ? "hidden md:block" : "block"
                )}
            >
                <Sidebar />
            </div>

            {/* Chat panel */}
            <div
                className={cn(
                    "h-full flex-1",
                    !activeConversationId || sidebarOpen ? "hidden md:flex" : "flex"
                )}
            >
                <ChatPanel />
            </div>
        </main>
    );
}
