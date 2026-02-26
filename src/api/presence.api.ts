import apiClient from "./axios";

export interface UserPresence {
    userId: string;
    online: boolean;
    lastSeen: string | null;
}

export const getUserPresence = (userId: string): Promise<UserPresence> => {
    return apiClient
        .get<UserPresence>(`/presence/${userId}`)
        .then((response) => response.data);
};
