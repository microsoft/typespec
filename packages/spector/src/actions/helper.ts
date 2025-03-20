import { HttpMethod, ServiceRequestFile } from "@typespec/spec-api";
import { MockBody } from "@typespec/spec-api/dist/types.js";

export interface ServiceRequest {
  method: HttpMethod;
  url: string;
  body?: MockBody;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  options?: {
    files?: ServiceRequestFile[]; // w???
  };
}

// function checkAndAddFormDataIfRequired(request: ServiceRequest) {
//   if (request.options?.config?.headers?.["Content-Type"] === "multipart/form-data") {
//     const formData = new FormData();
//     if (request.options?.requestBody) {
//       for (const key in request.options.requestBody) {
//         formData.append(key, JSON.stringify(request.options.requestBody[key]));
//       }
//     }
//     if (request.options.files) {
//       request.options.files.forEach((file) => {
//         formData.append(`${file.fieldname}`, file.buffer, {
//           filename: file.originalname,
//           contentType: file.mimetype,
//         });
//       });
//     }
//     request.options.requestBody = formData;
//     request.options.config = {
//       ...request.options.config,
//       headers: formData.getHeaders(),
//     };
//   }
// }

function resolveUrl(request: ServiceRequest) {
  let endpoint = request.url;
  if (request.params) {
    for (const key in request.params) {
      endpoint = request.url.replace(`:${key}`, request.params[key]!.toString());
    }
  }
  if (request.query) {
    console.log("request.query", request.query);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(request.query)) {
      query.append(key, value as any);
    }
    endpoint = `${endpoint}?${query.toString()}`;
  }
  // endpoint = request.url.replace(/\[:\]/g, ":");
  return endpoint;
}

export async function makeServiceCall(request: ServiceRequest): Promise<Response> {
  const url = resolveUrl(request);
  console.log("url", url);
  // checkAndAddFormDataIfRequired(request);

  return await fetch(url, {
    method: request.method.toUpperCase(),
    body: request.body?.rawContent,
    headers: {
      ...request.headers,
      ...(request.body?.contentType && {
        "Content-Type": request.body.contentType,
      }),
    },
  });
}

type EncodingType = "utf-8" | "base64" | "base64url" | "hex";
export function uint8ArrayToString(bytes: Uint8Array, format: EncodingType): string {
  return Buffer.from(bytes).toString(format);
}
