import { HttpMethod, MockBody, MockMultipartBody } from "@typespec/spec-api";

export interface ServiceRequest {
  method: HttpMethod;
  url: string;
  body?: MockBody | MockMultipartBody;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
}

function renderMultipartRequest(body: MockMultipartBody) {
  const formData = new FormData();
  if (body.parts) {
    for (const key in body.parts) {
      formData.append(key, JSON.stringify(body.parts[key]));
    }
  }
  if (body.files) {
    body.files.forEach((file) => {
      formData.append(
        `${file.fieldname}`,
        new Blob([file.buffer], { type: file.mimetype }),
        file.originalname,
      );
    });
  }

  return formData;
}

function resolveUrl(request: ServiceRequest) {
  let endpoint = request.url;

  if (request.pathParams) {
    for (const [key, value] of Object.entries(request.pathParams)) {
      endpoint = endpoint.replaceAll(`:${key}`, String(value));
    }
  }

  endpoint = endpoint.replaceAll("[:]", ":");

  if (request.query) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(request.query)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          query.append(key, v);
        }
      } else {
        query.append(key, value as any);
      }
    }
    endpoint = `${endpoint}?${query.toString()}`;
  }
  return endpoint;
}

export async function makeServiceCall(request: ServiceRequest): Promise<Response> {
  const url = resolveUrl(request);
  let body;
  let headers = request.headers as Record<string, string>;
  if (request.body) {
    if ("kind" in request.body) {
      const formData = renderMultipartRequest(request.body);
      body = formData;
    } else {
      body = request.body.rawContent;
      headers = {
        ...headers,
        ...(request.body?.contentType && {
          "Content-Type": request.body.contentType,
        }),
      };
    }
  }
  return await fetch(url, {
    method: request.method.toUpperCase(),
    body,
    headers,
  });
}

type EncodingType = "utf-8" | "base64" | "base64url" | "hex";
export function uint8ArrayToString(bytes: Uint8Array, format: EncodingType): string {
  return Buffer.from(bytes).toString(format);
}
