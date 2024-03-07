namespace OpenAI;
using TypeSpec.OpenAPI;

model ListFilesResponse {
  object: string; // presumably this is always some constant, but not defined.
  data: OpenAIFile[];
}

model CreateFileRequest {
  /**
   * Name of the [JSON Lines](https://jsonlines.readthedocs.io/en/latest/) file to be uploaded.
   *
   * If the `purpose` is set to "fine-tune", the file will be used for fine-tuning.
   */
  file: bytes;

  /**
   * The intended purpose of the uploaded documents. Use "fine-tune" for
   * [fine-tuning](/docs/api-reference/fine-tuning). This allows us to validate the format of the
   * uploaded file.
   */
  purpose: string;
}

/** The `File` object represents a document that has been uploaded to OpenAI. */
model OpenAIFile {
  /** The file identifier, which can be referenced in the API endpoints. */
  id: string;

  /** The object type, which is always "file". */
  object: "file";

  /** The size of the file in bytes. */
  bytes: safeint;

  /** The Unix timestamp (in seconds) for when the file was created. */
  @encode("unixTimestamp", int32)
  createdAt: utcDateTime;

  /** The name of the file. */
  filename: string;

  /** The intended purpose of the file. Currently, only "fine-tune" is supported. */
  purpose: string;

  /**
   * The current status of the file, which can be either `uploaded`, `processed`, `pending`,
   * `error`, `deleting` or `deleted`.
   */
  status:
    | "uploaded"
    | "processed"
    | "pending"
    | "error"
    | "deleting"
    | "deleted";

  /**
   * Additional details about the status of the file. If the file is in the `error` state, this will
   * include a message describing the error.
   */
  status_details?: string | null;
}

model DeleteFileResponse {
  id: string;
  object: string;
  deleted: boolean;
}
