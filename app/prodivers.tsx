"use client";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

// Separate component to handle session logic hooks
const SessionManager = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  useEffect(() => {
    // If the backend failed to refresh the token, force sign out immediately
    if (session?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: "/sign-in" });
    }
  }, [session]);

  return <>{children}</>;
};

const Providers = ({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Don't retry immediately on 401s (let auth handle it)
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 401) return false;
              return failureCount < 3;
            },
          },
        },
      }),
  );

  return (
    <SessionProvider
      session={session}
      // Set to 5 minutes (300s) to keep UI in sync without hammering server.
      // NextAuth automatically checks expiry before making requests anyway.
      refetchInterval={300}
      refetchOnWindowFocus={true} // Good to keep true for UX when tab switching
    >
      <QueryClientProvider client={queryClient}>
        <SessionManager>
          {children}
          <Toaster richColors position="bottom-right" />
        </SessionManager>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default Providers;
