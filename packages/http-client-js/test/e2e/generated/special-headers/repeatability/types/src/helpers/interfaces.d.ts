import { PathUncheckedResponse } from "@typespec/ts-http-runtime";
export interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}
//# sourceMappingURL=interfaces.d.ts.map