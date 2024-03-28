namespace OpenAI;
using TypeSpec.OpenAPI;

model ListModelsResponse {
  object: string;
  data: Model[];
}

/** Describes an OpenAI model offering that can be used with the API. */
model Model {
  /** The model identifier, which can be referenced in the API endpoints. */
  id: string;

  /** The object type, which is always "model". */
  object: "model";

  /** The Unix timestamp (in seconds) when the model was created. */
  @encode("unixTimestamp", int32)
  created: utcDateTime;

  /** The organization that owns the model. */
  owned_by: string;
}

model DeleteModelResponse {
  id: string;
  object: string;
  deleted: boolean;
}

// this is using yaml refs instead of a def in the openapi, not sure if that's required?

scalar User extends string;

@minItems(1)
model TokenArray is safeint[];

@minItems(1)
model TokenArrayArray is TokenArray[];
