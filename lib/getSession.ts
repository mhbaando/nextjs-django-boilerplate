import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "./sessionConfig";

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );

  return session;
}

export async function getAccessToken() {
  const session = await getSession();
  return session.accessToken;
}

export async function getFullUserInfo() {
  const session = await getSession();
  return {
    id: session.user?.id,
    email: session.user?.email,
    full_name: session.user?.full_name,
    username: session.user?.username,
    avatar: session.user?.avatar,
  };
}
