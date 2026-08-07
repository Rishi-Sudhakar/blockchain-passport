import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/resources";
import type { User } from "@/lib/api/types";
import { clearSessionToken, clearSigningKey, getSessionToken } from "@/lib/storage";

interface SessionState {
  user: User | null;
  isLoading: boolean;
  refetch: () => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const token = await getSessionToken();
      if (!token) return null;
      try {
        return await authApi.session();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch {
      // best effort — clear local state regardless
    }
    await clearSessionToken();
    await clearSigningKey();
    queryClient.setQueryData(["session"], null);
    queryClient.clear();
  };

  return (
    <SessionContext.Provider value={{ user: data ?? null, isLoading, refetch, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
