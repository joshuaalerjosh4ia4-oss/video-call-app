import { useAuthContext } from "../context/AuthContext";

// Thin convenience re-export so screens can `import { useAuth } from "../hooks/useAuth"`
// without needing to know the underlying context implementation.
export function useAuth() {
  return useAuthContext();
}
