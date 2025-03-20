import { Client, ClientOptions } from "@typespec/ts-http-runtime";
export interface RepeatabilityClientContext extends Client {
}
export interface RepeatabilityClientOptions extends ClientOptions {
    endpoint?: string;
}
export declare function createRepeatabilityClientContext(options?: RepeatabilityClientOptions): RepeatabilityClientContext;
//# sourceMappingURL=repeatabilityClientContext.d.ts.map