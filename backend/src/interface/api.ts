export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T; // optional, contains the actual response payload
  error?: string; // optional, for error messages
  code?: string; // optional, error codes
}
