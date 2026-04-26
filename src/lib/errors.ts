export type AppErrorCode =
  | "LIMIT_REACHED"
  | "DUPLICATE"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "UNKNOWN";

export interface AppActionError {
  code: AppErrorCode;
  message: string;
}

export function appActionError(code: AppErrorCode, message: string): AppActionError {
  return { code, message };
}
