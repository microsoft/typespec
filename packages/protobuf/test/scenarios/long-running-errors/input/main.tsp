import "@typespec/protobuf";

using Protobuf;

@package
namespace Test;

model Metadata {
  @field(1) progress: int32;
}

model Result {
  @field(1) id: string;
}

alias ArrayOperation = LongRunningOperation<Result[], Metadata>;
alias WithMetadata<M extends Reflection.Model> = LongRunningOperation<Result[], M>;
alias Swapped<M extends Reflection.Model, R extends Reflection.Model> = LongRunningOperation<R, M>;

@Protobuf.service
interface Service {
  arrayResponse(@field(1) id: string): LongRunningOperation<Result[], Metadata>;
  recordMetadata(@field(1) id: string): LongRunningOperation<Result, Record<string>>;
  anonymousAndMap(@field(1) id: string): LongRunningOperation<{}, Map<string, Metadata>>;

  // Without the invalid type among the written template arguments, the error points at the return type.
  aliased(@field(1) id: string): ArrayOperation;
  wrapped(@field(1) id: string): WithMetadata<Metadata>;

  // Otherwise it points at the template argument whose type is invalid.
  swapped(@field(1) id: string): Swapped<Record<string>, Result>;
  named(@field(1) id: string): LongRunningOperation<Metadata = Metadata, Response = Result[]>;
  same(@field(1) id: string): LongRunningOperation<Result[], Result[]>;
}
