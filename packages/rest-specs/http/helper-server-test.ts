import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export enum SERVICE_CALL_TYPE {
  put,
  post,
  get,
  patch,
  delete,
  head,
}

export interface ServiceRequest {
  endPoint: string;
  options?: {
    requestBody?: any;
    config?: AxiosRequestConfig<any> | undefined;
  };
}

export async function makeServiceCall(
  serviceCallType: SERVICE_CALL_TYPE,
  request: ServiceRequest,
): Promise<AxiosResponse<any, any>> {
  if (serviceCallType === SERVICE_CALL_TYPE.put) {
    return await makePutCall(request);
  }
  if (serviceCallType === SERVICE_CALL_TYPE.post) {
    return await makePostCall(request);
  }
  if (serviceCallType === SERVICE_CALL_TYPE.get) {
    return await makeGetCall(request);
  }
  if (serviceCallType === SERVICE_CALL_TYPE.delete) {
    return await makeDeleteCall(request);
  }
  if (serviceCallType === SERVICE_CALL_TYPE.head) {
    return await makeHeadCall(request);
  }
  return await makePatchCall(request);
}

export async function makePutCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.put(request.endPoint, request.options?.requestBody, request.options?.config);
  return response;
}

export async function makePostCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.post(request.endPoint, request.options?.requestBody, request.options?.config);
  return response;
}

export async function makeGetCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.get(request.endPoint, request.options?.config);
  return response;
}

export async function makePatchCall(request: ServiceRequest): Promise<AxiosResponse<any, any>> {
  const response = await axios.patch(request.endPoint, request.options?.requestBody, request.options?.config);
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
