import { RepeatabilityClientContext } from "./repeatabilityClientContext.js";
import { OperationOptions } from "../helpers/interfaces.js";
export interface ImmediateSuccessOptions extends OperationOptions {
}
export declare function immediateSuccess(client: RepeatabilityClientContext, repeatabilityRequestId: string, repeatabilityFirstSent: Date, options?: ImmediateSuccessOptions): Promise<void>;
//# sourceMappingURL=repeatabilityClientOperations.d.ts.map