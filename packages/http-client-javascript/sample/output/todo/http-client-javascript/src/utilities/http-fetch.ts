export interface HttpRequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
}
export async function httpFetch(url: string, options: HttpRequestOptions) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
