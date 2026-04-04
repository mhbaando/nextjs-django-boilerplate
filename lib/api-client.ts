import axios from "axios";
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

import { getSession } from "@/lib/getSession";
import { refreshAccessToken } from "@/lib/refresh";

export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

export const apiClient = axios.create();

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();

  if (session.accessToken) {
    config.headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & ExtendedAxiosRequestConfig)
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh/");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh ||
      isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // 🔥 Refresh token ONCE
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    if (originalRequest.headers?.set) {
      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
    }

    return apiClient(originalRequest);
  },
);
