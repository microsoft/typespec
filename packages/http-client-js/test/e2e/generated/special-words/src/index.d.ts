import { ClientOptions } from '@typespec/ts-http-runtime';
import { PathUncheckedResponse } from '@typespec/ts-http-runtime';

export declare interface And {
    "name": string;
}

declare interface AndOptions extends OperationOptions {
}

export declare interface As {
    "name": string;
}

declare interface AsOptions extends OperationOptions {
}

export declare interface Assert {
    "name": string;
}

declare interface AssertOptions extends OperationOptions {
}

export declare interface Async {
    "name": string;
}

declare interface AsyncOptions extends OperationOptions {
}

export declare interface Await {
    "name": string;
}

declare interface AwaitOptions extends OperationOptions {
}

export declare interface Break {
    "name": string;
}

declare interface BreakOptions extends OperationOptions {
}

export declare interface Class {
    "name": string;
}

declare interface ClassOptions extends OperationOptions {
}

export declare interface Constructor {
    "name": string;
}

declare interface ConstructorOptions extends OperationOptions {
}

export declare interface Continue {
    "name": string;
}

declare interface ContinueOptions extends OperationOptions {
}

export declare function dateDeserializer(date?: string | null): Date;

export declare function dateRfc3339Serializer(date?: Date | null): string;

export declare function dateRfc7231Deserializer(date?: string | null): Date;

export declare function dateRfc7231Serializer(date?: Date | null): string;

export declare function dateUnixTimestampDeserializer(date?: number | null): Date;

export declare function dateUnixTimestampSerializer(date?: Date | null): number;

export declare function decodeBase64(value: string): Uint8Array | undefined;

export declare interface Def {
    "name": string;
}

declare interface DefOptions extends OperationOptions {
}

export declare interface Del {
    "name": string;
}

declare interface DelOptions extends OperationOptions {
}

export declare interface Elif {
    "name": string;
}

declare interface ElifOptions extends OperationOptions {
}

export declare interface Else {
    "name": string;
}

declare interface ElseOptions extends OperationOptions {
}

export declare function encodeUint8Array(value: Uint8Array | undefined | null, encoding: BufferEncoding): string | undefined;

export declare interface Except {
    "name": string;
}

declare interface ExceptOptions extends OperationOptions {
}

export declare interface Exec {
    "name": string;
}

declare interface ExecOptions extends OperationOptions {
}

export declare interface Finally {
    "name": string;
}

declare interface FinallyOptions extends OperationOptions {
}

export declare interface For {
    "name": string;
}

declare interface ForOptions extends OperationOptions {
}

export declare interface From {
    "name": string;
}

declare interface FromOptions extends OperationOptions {
}

declare interface Global_2 {
    "name": string;
}
export { Global_2 as Global }

declare interface GlobalOptions extends OperationOptions {
}

export declare interface If {
    "name": string;
}

declare interface IfOptions extends OperationOptions {
}

export declare interface Import {
    "name": string;
}

declare interface ImportOptions extends OperationOptions {
}

export declare interface In {
    "name": string;
}

declare interface InOptions extends OperationOptions {
}

export declare interface Is {
    "name": string;
}

declare interface IsOptions extends OperationOptions {
}

export declare function jsonAndToApplicationTransform(input_?: any): And;

export declare function jsonAndToTransportTransform(input_?: And | null): any;

export declare function jsonAssertToApplicationTransform(input_?: any): Assert;

export declare function jsonAssertToTransportTransform(input_?: Assert | null): any;

export declare function jsonAsToApplicationTransform(input_?: any): As;

export declare function jsonAsToTransportTransform(input_?: As | null): any;

export declare function jsonAsyncToApplicationTransform(input_?: any): Async;

export declare function jsonAsyncToTransportTransform(input_?: Async | null): any;

export declare function jsonAwaitToApplicationTransform(input_?: any): Await;

export declare function jsonAwaitToTransportTransform(input_?: Await | null): any;

export declare function jsonBreakToApplicationTransform(input_?: any): Break;

export declare function jsonBreakToTransportTransform(input_?: Break | null): any;

export declare function jsonClassToApplicationTransform(input_?: any): Class;

export declare function jsonClassToTransportTransform(input_?: Class | null): any;

export declare function jsonConstructorToApplicationTransform(input_?: any): Constructor;

export declare function jsonConstructorToTransportTransform(input_?: Constructor | null): any;

export declare function jsonContinueToApplicationTransform(input_?: any): Continue;

export declare function jsonContinueToTransportTransform(input_?: Continue | null): any;

export declare function jsonDefToApplicationTransform(input_?: any): Def;

export declare function jsonDefToTransportTransform(input_?: Def | null): any;

export declare function jsonDelToApplicationTransform(input_?: any): Del;

export declare function jsonDelToTransportTransform(input_?: Del | null): any;

export declare function jsonElifToApplicationTransform(input_?: any): Elif;

export declare function jsonElifToTransportTransform(input_?: Elif | null): any;

export declare function jsonElseToApplicationTransform(input_?: any): Else;

export declare function jsonElseToTransportTransform(input_?: Else | null): any;

export declare function jsonExceptToApplicationTransform(input_?: any): Except;

export declare function jsonExceptToTransportTransform(input_?: Except | null): any;

export declare function jsonExecToApplicationTransform(input_?: any): Exec;

export declare function jsonExecToTransportTransform(input_?: Exec | null): any;

export declare function jsonFinallyToApplicationTransform(input_?: any): Finally;

export declare function jsonFinallyToTransportTransform(input_?: Finally | null): any;

export declare function jsonForToApplicationTransform(input_?: any): For;

export declare function jsonForToTransportTransform(input_?: For | null): any;

export declare function jsonFromToApplicationTransform(input_?: any): From;

export declare function jsonFromToTransportTransform(input_?: From | null): any;

export declare function jsonGlobalToApplicationTransform(input_?: any): Global_2;

export declare function jsonGlobalToTransportTransform(input_?: Global_2 | null): any;

export declare function jsonIfToApplicationTransform(input_?: any): If;

export declare function jsonIfToTransportTransform(input_?: If | null): any;

export declare function jsonImportToApplicationTransform(input_?: any): Import;

export declare function jsonImportToTransportTransform(input_?: Import | null): any;

export declare function jsonInToApplicationTransform(input_?: any): In;

export declare function jsonInToTransportTransform(input_?: In | null): any;

export declare function jsonIsToApplicationTransform(input_?: any): Is;

export declare function jsonIsToTransportTransform(input_?: Is | null): any;

export declare function jsonLambdaToApplicationTransform(input_?: any): Lambda;

export declare function jsonLambdaToTransportTransform(input_?: Lambda | null): any;

export declare function jsonNotToApplicationTransform(input_?: any): Not;

export declare function jsonNotToTransportTransform(input_?: Not | null): any;

export declare function jsonOrToApplicationTransform(input_?: any): Or;

export declare function jsonOrToTransportTransform(input_?: Or | null): any;

export declare function jsonPassToApplicationTransform(input_?: any): Pass;

export declare function jsonPassToTransportTransform(input_?: Pass | null): any;

export declare function jsonRaiseToApplicationTransform(input_?: any): Raise;

export declare function jsonRaiseToTransportTransform(input_?: Raise | null): any;

export declare function jsonReturnToApplicationTransform(input_?: any): Return;

export declare function jsonReturnToTransportTransform(input_?: Return | null): any;

export declare function jsonSameAsModelToApplicationTransform(input_?: any): SameAsModel;

export declare function jsonSameAsModelToTransportTransform(input_?: SameAsModel | null): any;

export declare function jsonTryToApplicationTransform(input_?: any): Try;

export declare function jsonTryToTransportTransform(input_?: Try | null): any;

export declare function jsonWhileToApplicationTransform(input_?: any): While;

export declare function jsonWhileToTransportTransform(input_?: While | null): any;

export declare function jsonWithToApplicationTransform(input_?: any): With;

export declare function jsonWithToTransportTransform(input_?: With | null): any;

export declare function jsonYieldToApplicationTransform(input_?: any): Yield;

export declare function jsonYieldToTransportTransform(input_?: Yield | null): any;

export declare interface Lambda {
    "name": string;
}

declare interface LambdaOptions extends OperationOptions {
}

export declare class ModelPropertiesClient {
    #private;
    constructor(options?: ModelPropertiesClientOptions);
    sameAsModel(body: SameAsModel, options?: SameAsModelOptions): Promise<void>;
}

declare interface ModelPropertiesClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare class ModelsClient {
    #private;
    constructor(options?: ModelsClientOptions);
    withAnd(body: And, options?: WithAndOptions): Promise<void>;
    withAs(body: As, options?: WithAsOptions): Promise<void>;
    withAssert(body: Assert, options?: WithAssertOptions): Promise<void>;
    withAsync(body: Async, options?: WithAsyncOptions): Promise<void>;
    withAwait(body: Await, options?: WithAwaitOptions): Promise<void>;
    withBreak(body: Break, options?: WithBreakOptions): Promise<void>;
    withClass(body: Class, options?: WithClassOptions): Promise<void>;
    withConstructor(body: Constructor, options?: WithConstructorOptions): Promise<void>;
    withContinue(body: Continue, options?: WithContinueOptions): Promise<void>;
    withDef(body: Def, options?: WithDefOptions): Promise<void>;
    withDel(body: Del, options?: WithDelOptions): Promise<void>;
    withElif(body: Elif, options?: WithElifOptions): Promise<void>;
    withElse(body: Else, options?: WithElseOptions): Promise<void>;
    withExcept(body: Except, options?: WithExceptOptions): Promise<void>;
    withExec(body: Exec, options?: WithExecOptions): Promise<void>;
    withFinally(body: Finally, options?: WithFinallyOptions): Promise<void>;
    withFor(body: For, options?: WithForOptions): Promise<void>;
    withFrom(body: From, options?: WithFromOptions): Promise<void>;
    withGlobal(body: Global_2, options?: WithGlobalOptions): Promise<void>;
    withIf(body: If, options?: WithIfOptions): Promise<void>;
    withImport(body: Import, options?: WithImportOptions): Promise<void>;
    withIn(body: In, options?: WithInOptions): Promise<void>;
    withIs(body: Is, options?: WithIsOptions): Promise<void>;
    withLambda(body: Lambda, options?: WithLambdaOptions): Promise<void>;
    withNot(body: Not, options?: WithNotOptions): Promise<void>;
    withOr(body: Or, options?: WithOrOptions): Promise<void>;
    withPass(body: Pass, options?: WithPassOptions): Promise<void>;
    withRaise(body: Raise, options?: WithRaiseOptions): Promise<void>;
    withReturn(body: Return, options?: WithReturnOptions): Promise<void>;
    withTry(body: Try, options?: WithTryOptions): Promise<void>;
    withWhile(body: While, options?: WithWhileOptions): Promise<void>;
    withWith(body: With, options?: WithWithOptions): Promise<void>;
    withYield(body: Yield, options?: WithYieldOptions): Promise<void>;
}

declare interface ModelsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface Not {
    "name": string;
}

declare interface NotOptions extends OperationOptions {
}

declare interface OperationOptions {
    operationOptions?: {
        onResponse?: (rawResponse: PathUncheckedResponse) => void;
    };
}

export declare class OperationsClient {
    #private;
    constructor(options?: OperationsClientOptions);
    and(options?: AndOptions): Promise<void>;
    as_(options?: AsOptions): Promise<void>;
    assert(options?: AssertOptions): Promise<void>;
    async(options?: AsyncOptions): Promise<void>;
    await_(options?: AwaitOptions): Promise<void>;
    break_(options?: BreakOptions): Promise<void>;
    class_(options?: ClassOptions): Promise<void>;
    constructor_2(options?: ConstructorOptions): Promise<void>;
    continue_(options?: ContinueOptions): Promise<void>;
    def(options?: DefOptions): Promise<void>;
    del(options?: DelOptions): Promise<void>;
    elif(options?: ElifOptions): Promise<void>;
    else_(options?: ElseOptions): Promise<void>;
    except(options?: ExceptOptions): Promise<void>;
    exec(options?: ExecOptions): Promise<void>;
    finally_(options?: FinallyOptions): Promise<void>;
    for_(options?: ForOptions): Promise<void>;
    from(options?: FromOptions): Promise<void>;
    global(options?: GlobalOptions): Promise<void>;
    if_(options?: IfOptions): Promise<void>;
    import_(options?: ImportOptions): Promise<void>;
    in_(options?: InOptions): Promise<void>;
    is(options?: IsOptions): Promise<void>;
    lambda(options?: LambdaOptions): Promise<void>;
    not(options?: NotOptions): Promise<void>;
    or(options?: OrOptions): Promise<void>;
    pass(options?: PassOptions): Promise<void>;
    raise(options?: RaiseOptions): Promise<void>;
    return_(options?: ReturnOptions): Promise<void>;
    try_(options?: TryOptions): Promise<void>;
    while_(options?: WhileOptions): Promise<void>;
    with_(options?: WithOptions): Promise<void>;
    yield_(options?: YieldOptions): Promise<void>;
}

declare interface OperationsClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface Or {
    "name": string;
}

declare interface OrOptions extends OperationOptions {
}

export declare class ParametersClient {
    #private;
    constructor(options?: ParametersClientOptions);
    withAnd(and: string, options?: WithAndOptions_2): Promise<void>;
    withAs(as_: string, options?: WithAsOptions_2): Promise<void>;
    withAssert(assert: string, options?: WithAssertOptions_2): Promise<void>;
    withAsync(async: string, options?: WithAsyncOptions_2): Promise<void>;
    withAwait(await_: string, options?: WithAwaitOptions_2): Promise<void>;
    withBreak(break_: string, options?: WithBreakOptions_2): Promise<void>;
    withClass(class_: string, options?: WithClassOptions_2): Promise<void>;
    withConstructor(constructor: string, options?: WithConstructorOptions_2): Promise<void>;
    withContinue(continue_: string, options?: WithContinueOptions_2): Promise<void>;
    withDef(def: string, options?: WithDefOptions_2): Promise<void>;
    withDel(del: string, options?: WithDelOptions_2): Promise<void>;
    withElif(elif: string, options?: WithElifOptions_2): Promise<void>;
    withElse(else_: string, options?: WithElseOptions_2): Promise<void>;
    withExcept(except: string, options?: WithExceptOptions_2): Promise<void>;
    withExec(exec: string, options?: WithExecOptions_2): Promise<void>;
    withFinally(finally_: string, options?: WithFinallyOptions_2): Promise<void>;
    withFor(for_: string, options?: WithForOptions_2): Promise<void>;
    withFrom(from: string, options?: WithFromOptions_2): Promise<void>;
    withGlobal(global: string, options?: WithGlobalOptions_2): Promise<void>;
    withIf(if_: string, options?: WithIfOptions_2): Promise<void>;
    withImport(import_: string, options?: WithImportOptions_2): Promise<void>;
    withIn(in_: string, options?: WithInOptions_2): Promise<void>;
    withIs(is: string, options?: WithIsOptions_2): Promise<void>;
    withLambda(lambda: string, options?: WithLambdaOptions_2): Promise<void>;
    withNot(not: string, options?: WithNotOptions_2): Promise<void>;
    withOr(or: string, options?: WithOrOptions_2): Promise<void>;
    withPass(pass: string, options?: WithPassOptions_2): Promise<void>;
    withRaise(raise: string, options?: WithRaiseOptions_2): Promise<void>;
    withReturn(return_: string, options?: WithReturnOptions_2): Promise<void>;
    withTry(try_: string, options?: WithTryOptions_2): Promise<void>;
    withWhile(while_: string, options?: WithWhileOptions_2): Promise<void>;
    withWith(with_: string, options?: WithWithOptions_2): Promise<void>;
    withYield(yield_: string, options?: WithYieldOptions_2): Promise<void>;
    withCancellationToken(cancellationToken: string, options?: WithCancellationTokenOptions): Promise<void>;
}

declare interface ParametersClientOptions extends ClientOptions {
    endpoint?: string;
}

export declare interface Pass {
    "name": string;
}

declare interface PassOptions extends OperationOptions {
}

export declare interface Raise {
    "name": string;
}

declare interface RaiseOptions extends OperationOptions {
}

export declare interface Return {
    "name": string;
}

declare interface ReturnOptions extends OperationOptions {
}

export declare interface SameAsModel {
    "sameAsModel": string;
}

declare interface SameAsModelOptions extends OperationOptions {
}

export declare function sameAsModelPayloadToTransport(payload: SameAsModel): any;

export declare class SpecialWordsClient {
    #private;
    modelsClient: ModelsClient;
    modelPropertiesClient: ModelPropertiesClient;
    operationsClient: OperationsClient;
    parametersClient: ParametersClient;
    constructor(options?: SpecialWordsClientOptions);
}

declare interface SpecialWordsClientOptions extends ClientOptions {
    endpoint?: string;
}

declare type String_2 = string;
export { String_2 as String }

export declare interface Try {
    "name": string;
}

declare interface TryOptions extends OperationOptions {
}

export declare interface While {
    "name": string;
}

declare interface WhileOptions extends OperationOptions {
}

export declare interface With {
    "name": string;
}

declare interface WithAndOptions extends OperationOptions {
}

declare interface WithAndOptions_2 extends OperationOptions {
}

export declare function withAndPayloadToTransport(payload: And): any;

declare interface WithAsOptions extends OperationOptions {
}

declare interface WithAsOptions_2 extends OperationOptions {
}

export declare function withAsPayloadToTransport(payload: As): any;

declare interface WithAssertOptions extends OperationOptions {
}

declare interface WithAssertOptions_2 extends OperationOptions {
}

export declare function withAssertPayloadToTransport(payload: Assert): any;

declare interface WithAsyncOptions extends OperationOptions {
}

declare interface WithAsyncOptions_2 extends OperationOptions {
}

export declare function withAsyncPayloadToTransport(payload: Async): any;

declare interface WithAwaitOptions extends OperationOptions {
}

declare interface WithAwaitOptions_2 extends OperationOptions {
}

export declare function withAwaitPayloadToTransport(payload: Await): any;

declare interface WithBreakOptions extends OperationOptions {
}

declare interface WithBreakOptions_2 extends OperationOptions {
}

export declare function withBreakPayloadToTransport(payload: Break): any;

declare interface WithCancellationTokenOptions extends OperationOptions {
}

declare interface WithClassOptions extends OperationOptions {
}

declare interface WithClassOptions_2 extends OperationOptions {
}

export declare function withClassPayloadToTransport(payload: Class): any;

declare interface WithConstructorOptions extends OperationOptions {
}

declare interface WithConstructorOptions_2 extends OperationOptions {
}

export declare function withConstructorPayloadToTransport(payload: Constructor): any;

declare interface WithContinueOptions extends OperationOptions {
}

declare interface WithContinueOptions_2 extends OperationOptions {
}

export declare function withContinuePayloadToTransport(payload: Continue): any;

declare interface WithDefOptions extends OperationOptions {
}

declare interface WithDefOptions_2 extends OperationOptions {
}

export declare function withDefPayloadToTransport(payload: Def): any;

declare interface WithDelOptions extends OperationOptions {
}

declare interface WithDelOptions_2 extends OperationOptions {
}

export declare function withDelPayloadToTransport(payload: Del): any;

declare interface WithElifOptions extends OperationOptions {
}

declare interface WithElifOptions_2 extends OperationOptions {
}

export declare function withElifPayloadToTransport(payload: Elif): any;

declare interface WithElseOptions extends OperationOptions {
}

declare interface WithElseOptions_2 extends OperationOptions {
}

export declare function withElsePayloadToTransport(payload: Else): any;

declare interface WithExceptOptions extends OperationOptions {
}

declare interface WithExceptOptions_2 extends OperationOptions {
}

export declare function withExceptPayloadToTransport(payload: Except): any;

declare interface WithExecOptions extends OperationOptions {
}

declare interface WithExecOptions_2 extends OperationOptions {
}

export declare function withExecPayloadToTransport(payload: Exec): any;

declare interface WithFinallyOptions extends OperationOptions {
}

declare interface WithFinallyOptions_2 extends OperationOptions {
}

export declare function withFinallyPayloadToTransport(payload: Finally): any;

declare interface WithForOptions extends OperationOptions {
}

declare interface WithForOptions_2 extends OperationOptions {
}

export declare function withForPayloadToTransport(payload: For): any;

declare interface WithFromOptions extends OperationOptions {
}

declare interface WithFromOptions_2 extends OperationOptions {
}

export declare function withFromPayloadToTransport(payload: From): any;

declare interface WithGlobalOptions extends OperationOptions {
}

declare interface WithGlobalOptions_2 extends OperationOptions {
}

export declare function withGlobalPayloadToTransport(payload: Global_2): any;

declare interface WithIfOptions extends OperationOptions {
}

declare interface WithIfOptions_2 extends OperationOptions {
}

export declare function withIfPayloadToTransport(payload: If): any;

declare interface WithImportOptions extends OperationOptions {
}

declare interface WithImportOptions_2 extends OperationOptions {
}

export declare function withImportPayloadToTransport(payload: Import): any;

declare interface WithInOptions extends OperationOptions {
}

declare interface WithInOptions_2 extends OperationOptions {
}

export declare function withInPayloadToTransport(payload: In): any;

declare interface WithIsOptions extends OperationOptions {
}

declare interface WithIsOptions_2 extends OperationOptions {
}

export declare function withIsPayloadToTransport(payload: Is): any;

declare interface WithLambdaOptions extends OperationOptions {
}

declare interface WithLambdaOptions_2 extends OperationOptions {
}

export declare function withLambdaPayloadToTransport(payload: Lambda): any;

declare interface WithNotOptions extends OperationOptions {
}

declare interface WithNotOptions_2 extends OperationOptions {
}

export declare function withNotPayloadToTransport(payload: Not): any;

declare interface WithOptions extends OperationOptions {
}

declare interface WithOrOptions extends OperationOptions {
}

declare interface WithOrOptions_2 extends OperationOptions {
}

export declare function withOrPayloadToTransport(payload: Or): any;

declare interface WithPassOptions extends OperationOptions {
}

declare interface WithPassOptions_2 extends OperationOptions {
}

export declare function withPassPayloadToTransport(payload: Pass): any;

declare interface WithRaiseOptions extends OperationOptions {
}

declare interface WithRaiseOptions_2 extends OperationOptions {
}

export declare function withRaisePayloadToTransport(payload: Raise): any;

declare interface WithReturnOptions extends OperationOptions {
}

declare interface WithReturnOptions_2 extends OperationOptions {
}

export declare function withReturnPayloadToTransport(payload: Return): any;

declare interface WithTryOptions extends OperationOptions {
}

declare interface WithTryOptions_2 extends OperationOptions {
}

export declare function withTryPayloadToTransport(payload: Try): any;

declare interface WithWhileOptions extends OperationOptions {
}

declare interface WithWhileOptions_2 extends OperationOptions {
}

export declare function withWhilePayloadToTransport(payload: While): any;

declare interface WithWithOptions extends OperationOptions {
}

declare interface WithWithOptions_2 extends OperationOptions {
}

export declare function withWithPayloadToTransport(payload: With): any;

declare interface WithYieldOptions extends OperationOptions {
}

declare interface WithYieldOptions_2 extends OperationOptions {
}

export declare function withYieldPayloadToTransport(payload: Yield): any;

export declare interface Yield {
    "name": string;
}

declare interface YieldOptions extends OperationOptions {
}

export { }
