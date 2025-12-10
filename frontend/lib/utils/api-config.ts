/**
 * Utility to check if we should use real API or mock API
 * 
 * NOTE: For MVP, we always use real API when authenticated.
 * Mock API is deprecated and should not be used in production.
 */
export const useRealAPI = (): boolean => {
  if (typeof window === "undefined") return false
  
  // Always use real API if we have an auth token (user is authenticated)
  const hasToken = !!localStorage.getItem("authToken")
  
  // For MVP: Always use real API when authenticated
  // Remove NEXT_PUBLIC_USE_REAL_API check - it's always true now
  return hasToken
}

/**
 * Get API mode for debugging
 * @deprecated Always returns "real" when authenticated
 */
export const getAPIMode = (): "real" | "mock" => {
  return useRealAPI() ? "real" : "mock"
}

