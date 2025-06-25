import "@typespec/rest";

using Http;

model Pet {
  name: string;
}

@error
model UserError {
  @statusCode
  @minValue(400)
  @maxValue(499)
  status: int32;
}

@error
model ServerError {
  @statusCode
  @minValue(500)
  @maxValue(599)
  status: int32;
}

op extensive(): Pet | UserError | ServerError;
