import { getAuthToken } from "../utils/storage";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not set. Create mobile/.env from .env.example and set it to your machine's LAN IP."
  );
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}

export class ApiRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, timeoutMs } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeout = timeoutMs ? setTimeout(() => controller?.abort(), timeoutMs) : undefined;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller?.signal,
    });
  } catch {
    if (controller?.signal.aborted) {
      throw new ApiRequestError("The email request timed out. Check the server's email provider settings and try again.", 408);
    }
    throw new ApiRequestError(
      "Could not reach the server. Check that EXPO_PUBLIC_API_URL is correct and your phone is on the same network.",
      0
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const json = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;

  if (!response.ok || !json || json.success === false) {
    const message = json && "message" in json ? json.message : `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status);
  }

  return (json as ApiSuccess<T>).data;
}

export const apiClient = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true, timeoutMs?: number) =>
    request<T>(path, { method: "POST", body, auth, timeoutMs }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: "PATCH", body, auth }),
};
