/**
 * Utility to check if we should use real API or mock API
 */
export const useRealAPI = (): boolean => {
  if (typeof window === "undefined") return false
  
  const useReal = process.env.NEXT_PUBLIC_USE_REAL_API === "true"
  const hasToken = !!localStorage.getItem("authToken")
  
  // Use real API if explicitly enabled and we have a token
  return useReal && hasToken
}

/**
 * Get API mode for debugging
 */
export const getAPIMode = (): "real" | "mock" => {
  return useRealAPI() ? "real" : "mock"
}

