import { ImmediateSuccessOptions } from "./api/repeatabilityClientOperations.js";
import { RepeatabilityClientOptions } from "./api/repeatabilityClientContext.js";
export declare class RepeatabilityClient {
    #private;
    constructor(options?: RepeatabilityClientOptions);
    immediateSuccess(repeatabilityRequestId: string, repeatabilityFirstSent: Date, options?: ImmediateSuccessOptions): Promise<void>;
}
//# sourceMappingURL=repeatabilityClient.d.ts.map