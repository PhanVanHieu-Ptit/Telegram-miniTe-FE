import { create } from "zustand";
import { getUserPresence, type UserPresence } from "@/api/presence.api";

export type PresenceState = {
    userId: string;
    online: boolean;
    lastSeen: string | null;
};

interface PresenceStoreState {
    presenceMap: Record<string, PresenceState>;
}

interface PresenceStoreActions {
    setPresence: (userId: string, presence: PresenceState) => void;
    updateOnline: (userId: string, online: boolean) => void;
    fetchPresence: (userId: string) => Promise<void>;
}

type PresenceStore = PresenceStoreState & PresenceStoreActions;

export const usePresenceStore = create<PresenceStore>((set, get) => ({
    // State
    presenceMap: {},

    // Actions
    setPresence: (userId: string, presence: PresenceState) => {
        set((state) => ({
            presenceMap: {
                ...state.presenceMap,
                [userId]: presence,
            },
        }));
    },

    updateOnline: (userId: string, online: boolean) => {
        set((state) => {
            const existing = state.presenceMap[userId];
            return {
                presenceMap: {
                    ...state.presenceMap,
                    [userId]: {
                        userId,
                        online,
                        lastSeen: existing?.lastSeen ?? null,
                    },
                },
            };
        });
    },

    fetchPresence: async (userId: string) => {
        try {
            const userPresence: UserPresence = await getUserPresence(userId);
            const presence: PresenceState = {
                userId: userPresence.userId,
                online: userPresence.online,
                lastSeen: userPresence.lastSeen,
            };
            get().setPresence(userId, presence);
        } catch (error) {
            console.error(`Failed to fetch presence for user ${userId}:`, error);
        }
    },
}));
