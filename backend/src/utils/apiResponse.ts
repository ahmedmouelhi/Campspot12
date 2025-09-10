export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export class ApiResponseBuilder {
  static success<T>(data?: T, message?: string, pagination?: PaginationInfo): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      pagination,
    };
  }

  static error(error: string, message?: string): ApiResponse {
    return {
      success: false,
      error,
      message: message || error,
    };
  }

  static paginated<T>(
    data: T,
    page: number,
    pageSize: number,
    total: number,
    message?: string
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

// Helper functions for common responses
export const successResponse = <T>(data?: T, message?: string) => 
  ApiResponseBuilder.success(data, message);

export const errorResponse = (error: string, message?: string) => 
  ApiResponseBuilder.error(error, message);

export const paginatedResponse = <T>(
  data: T,
  page: number,
  pageSize: number,
  total: number,
  message?: string
) => ApiResponseBuilder.paginated(data, page, pageSize, total, message);
