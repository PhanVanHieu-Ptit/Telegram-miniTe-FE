export class AppError extends Error {
    code: string;
    details?: unknown;

    constructor(message: string, code: string, details?: unknown) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, code = "VALIDATION_ERROR", details?: unknown) {
        super(message, code, details);
        this.name = "ValidationError";
    }
}

export class NetworkError extends AppError {
    constructor(message: string, code = "NETWORK_ERROR", details?: unknown) {
        super(message, code, details);
        this.name = "NetworkError";
    }
}
