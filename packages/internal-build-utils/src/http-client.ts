/**
 * Simple HTTP client for making requests to external APIs
 */

export interface HttpClient {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

/**
 * Default implementation of HttpClient using fetch
 */
export class DefaultHttpClientFetch implements HttpClient {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, init);
  }
}