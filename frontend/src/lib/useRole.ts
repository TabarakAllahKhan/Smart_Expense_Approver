import { useAuth } from "@clerk/clerk-react";

export function useRole(): "manager" | "employee" {
  const { sessionClaims, isLoaded } = useAuth();

  if (!isLoaded) return "employee";

  const claims = sessionClaims as { publicMetadata?: { role?: string } } | undefined;
  const role = claims?.publicMetadata?.role;

  return role === "manager" ? "manager" : "employee";
}