import { PipelineRequest, HttpResponse, RawHttpHeaders } from "@typespec/ts-http-runtime";
export declare class RestError extends Error {
    request: PipelineRequest;
    response: HttpResponse;
    status: string;
    body: any;
    headers: RawHttpHeaders;
    constructor(message: string, response: HttpResponse);
    static fromHttpResponse(response: HttpResponse): RestError;
}
export declare function createRestError(response: HttpResponse): RestError;
//# sourceMappingURL=error.d.ts.map