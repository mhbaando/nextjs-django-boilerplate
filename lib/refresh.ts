import { getSession } from "@/lib/getSession";
import { publicRequest } from "@/lib/api-public";

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const session = await getSession();

      if (!session.refreshToken) {
        throw new Error("No refresh token");
      }

      const res = await publicRequest(
        "post",
        "/auth/refresh/",
        {
          refresh: session.refreshToken,
        },
        {
          skipAuthRefresh: true,
        },
      );

      const data = res.data;

      if (data.error) {
        throw new Error("Refresh failed");
      }

      session.accessToken = data.access_token;
      session.refreshToken = data.refresh_token;

      await session.save();

      return data.access_token;
    } catch {
      refreshPromise = null;

      const session = await getSession();
      session.accessToken = undefined;
      session.refreshToken = undefined;
      session.user = undefined;
      await session.save();
      return null;
    }
  })();

  const result = await refreshPromise;

  refreshPromise = null;

  return result;
}
