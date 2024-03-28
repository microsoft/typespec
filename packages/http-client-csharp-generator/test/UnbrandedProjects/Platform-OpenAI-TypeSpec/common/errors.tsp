namespace OpenAI;

model Error {
  type: string;
  message: string;
  param: string | null;
  code: string | null;
}

@error
model ErrorResponse {
  error: Error;
}
