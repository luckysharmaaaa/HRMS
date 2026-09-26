  /**
   * General API Error class
   */
  export class ApiError extends Error {
    public statusCode: number;
    public errors: unknown;
    public isOperational: boolean;

    constructor(
      message: string,
      statusCode: number = 500,
      errors: unknown = null
    ) {
      super(message);

      this.name = "ApiError";
      this.statusCode = statusCode;
      this.errors = errors;
      this.isOperational = statusCode < 500;

      Error.captureStackTrace(this, this.constructor);
    }

    /**
     * 400 Bad Request
     */
    static badRequest(message = "Bad Request", errors: unknown = null): ApiError {
      return new ApiError(message, 400, errors);
    }

    /**
     * 401 Unauthorized
     */
    static unauthorized(message = "Unauthorized"): ApiError {
      return new ApiError(message, 401);
    }

    /**
     * 403 Forbidden
     */
    static forbidden(message = "Forbidden"): ApiError {
      return new ApiError(message, 403);
    }

    /**
     * 404 Not Found
     */
    static notFound(message = "Not Found"): ApiError {
      return new ApiError(message, 404);
    }

    /**
     * 409 Conflict
     */
    static conflict(message = "Conflict", code?: string): ApiError {
      return new ApiError(message, 409, code ? { code } : null);
    }

    /**
     * 422 Validation Error
     */
    static validation(message = "Validation Failed", errors: unknown = null): ApiError {
      return new ApiError(message, 422, errors);
    }

    /**
     * 500 Internal Server Error
     */
    static internal(message = "Internal Server Error"): ApiError {
      return new ApiError(message, 500);
    }
  }