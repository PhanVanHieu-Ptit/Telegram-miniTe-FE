import apiClient from "./axios";
import type { User } from "../types/chat.types";

export interface SearchUsersParams {
    query: string;
}

export const searchUsers = async (params: SearchUsersParams): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users", {
        params: {
            search: params.query,
        },
    });
    return response.data;
};
