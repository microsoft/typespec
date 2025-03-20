import { ImmediateSuccessOptions, immediateSuccess } from "./api/repeatabilityClientOperations.js";
import { RepeatabilityClientContext, RepeatabilityClientOptions, createRepeatabilityClientContext } from "./api/repeatabilityClientContext.js";

export class RepeatabilityClient {
  #context: RepeatabilityClientContext;
  ;
  constructor(options?: RepeatabilityClientOptions) {
    this.#context = createRepeatabilityClientContext(options);

  };
  ;;

  ;
  async immediateSuccess(
    repeatabilityRequestId: string,
    repeatabilityFirstSent: Date,
    options?: ImmediateSuccessOptions,) {
    return immediateSuccess(
      this.#context,
      repeatabilityRequestId,
      repeatabilityFirstSent,
      options
    );
  };
}