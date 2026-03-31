import { getApiBaseUrl } from "@/lib/auth-api";
import { apiClient, type ExtendedAxiosRequestConfig } from "@/lib/api-client";

export async function publicRequest(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  data?: unknown,
  config?: ExtendedAxiosRequestConfig,
) {
  const baseURL = getApiBaseUrl();

  return apiClient({
    method,
    url: `${baseURL}${url}`,
    data,
    ...config,
  });
}
