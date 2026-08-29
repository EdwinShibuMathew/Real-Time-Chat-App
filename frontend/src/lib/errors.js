export function getApiError(error, fallback = "Something went wrong. Please try again.") {
  if (!error?.response) return "Unable to reach the server. Check your connection and try again.";
  return error.response.data?.message || fallback;
}
