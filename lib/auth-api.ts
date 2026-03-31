import type { AxiosError } from "axios";

export function getApiBaseUrl(): string {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured.");
  }

  return baseUrl;
}

export function resolveApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
  const messageFromResponse =
    axiosError.response?.data?.message || axiosError.response?.data?.detail;

  if (messageFromResponse) {
    return messageFromResponse;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
