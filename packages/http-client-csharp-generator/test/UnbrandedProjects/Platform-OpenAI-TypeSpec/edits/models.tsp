namespace OpenAI;
using TypeSpec.OpenAPI;

model CreateEditRequest {
  /**
   * ID of the model to use. You can use the `text-davinci-edit-001` or `code-davinci-edit-001`
   * model with this endpoint.
   */
  @extension("x-oaiTypeLabel", "string")
  `model`: string | "text-davinci-edit-001" | "code-davinci-edit-001";

  /** The input text to use as a starting point for the edit. */
  input?: string | null = "";

  /** The instruction that tells the model how to edit the prompt. */
  instruction: string;

  /** How many edits to generate for the input and instruction. */
  n?: EditN | null = 1;

  /**
   * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output
   * more random, while lower values like 0.2 will make it more focused and deterministic.
   *
   * We generally recommend altering this or `top_p` but not both.
   */
  temperature?: Temperature | null = 1;

  /**
   * An alternative to sampling with temperature, called nucleus sampling, where the model considers
   * the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising
   * the top 10% probability mass are considered.
   *
   * We generally recommend altering this or `temperature` but not both.
   */
  top_p?: TopP | null = 1;
}

#deprecated "deprecated"
model CreateEditResponse {
  /** The object type, which is always `edit`. */
  object: "edit";

  /** The Unix timestamp (in seconds) of when the edit was created. */
  @encode("unixTimestamp", int32)
  created: utcDateTime;

  /** description: A list of edit choices. Can be more than one if `n` is greater than 1. */
  choices: {
    /** The edited result. */
    text: string;

    /** The index of the choice in the list of choices. */
    index: safeint;

    /**
     * The reason the model stopped generating tokens. This will be `stop` if the model hit a
     * natural stop point or a provided stop sequence, or `length` if the maximum number of tokens
     * specified in the request was reached.
     */
    finish_reason: "stop" | "length";
  }[];

  usage: CompletionUsage;
}

@minValue(0)
@maxValue(20)
scalar EditN extends safeint;
