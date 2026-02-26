import apiClient from "./axios";

export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse {
    id: string;
    username: string;
    email: string;
    createdAt: string;
}

export const register = (payload: RegisterDto): Promise<RegisterResponse> => {
    return apiClient
        .post<RegisterResponse>("/register", payload)
        .then((response) => response.data);
};

export interface LoginDto {
    email: string;
    password: string;
}

export interface LoginResponse {
    id: string;
    username: string;
    email: string;
    token: string;
}

export const login = (payload: LoginDto): Promise<LoginResponse> => {
    return apiClient
        .post<LoginResponse>("/login", payload)
        .then((response) => response.data);
};
