import { HttpMethod, ServiceRequestFile } from "@typespec/spec-api";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import FormData from "form-data";

export interface ServiceRequest {
  endPoint: string;
  options?: {
    requestBody?: any;
    files?: ServiceRequestFile[];
    config?: AxiosRequestConfig<any> | undefined;
  };
}

function checkAndAddFormDataIfRequired(request: ServiceRequest) {
  if (request.options?.config?.headers?.["Content-Type"] === "multipart/form-data") {
    const formData = new FormData();
    if (request.options?.requestBody) {
      for (const key in request.options.requestBody) {
        formData.append(key, JSON.stringify(request.options.requestBody[key]));
      }
    }
    if (request.options.files) {
      request.options.files.forEach((file) => {
        formData.append(`${file.fieldname}`, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      });
    }
    request.options.requestBody = formData;
    request.options.config = {
      ...request.options.config,
      headers: formData.getHeaders(),
    };
  }
}

function checkAndUpdateEndpoint(request: ServiceRequest) {
  if (request.options?.config?.params) {
    for (const key in request.options.config.params) {
      request.endPoint = request.endPoint.replace(`:${key}`, request.options.config.params[key]);
    }
  }
  request.endPoint = request.endPoint.replace(/\[:\]/g, ":");
}

export async function makeServiceCall(
  serviceCallType: HttpMethod,
  request: ServiceRequest,
): Promise<AxiosResponse<any, any>> {
  checkAndUpdateEndpoint(request);
  checkAndAddFormDataIfRequired(request);
  if (serviceCallType === "put") {
    return await makePutCall(request);
  }
  if (serviceCallType === "post") {
    return await makePostCall(request);
  }
  if (serviceCallType === "get") {
    return await makeGetCall(request);
  }
  if (serviceCallType === "delete") {
    return await makeDeleteCall(request);
  }
  if (serviceCallType === "head") {
    return await makeHeadCall(request);
  }
  return await makePatchCall(request);
}

export async function makePutCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.put(
    request.endPoint,
    request.options?.requestBody,
    request.options?.config,
  );
  return response;
}

export async function makePostCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.post(
    request.endPoint,
    request.options?.requestBody,
    request.options?.config,
  );
  return response;
}

export async function makeGetCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.get(request.endPoint, request.options?.config);
  return response;
}

export async function makePatchCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.patch(
    request.endPoint,
    request.options?.requestBody,
    request.options?.config,
  );
  return response;
}

export async function makeDeleteCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.delete(request.endPoint, request.options?.config);
  return response;
}

export async function makeHeadCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.head(request.endPoint, request.options?.config);
  return response;
}

type EncodingType = "utf-8" | "base64" | "base64url" | "hex";
export function uint8ArrayToString(bytes: Uint8Array, format: EncodingType): string {
  return Buffer.from(bytes).toString(format);
}
