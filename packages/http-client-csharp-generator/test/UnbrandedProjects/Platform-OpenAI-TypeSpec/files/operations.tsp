import "@typespec/http";
import "@typespec/openapi";

import "../common/errors.tsp";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace OpenAI;

@route("/files")
interface Files {
  @tag("OpenAI")
  @get
  @summary("Returns a list of files that belong to the user's organization.")
  @operationId("listFiles")
  list(): ListFilesResponse | ErrorResponse;

  @tag("OpenAI")
  @post
  @summary("Returns a list of files that belong to the user's organization.")
  @operationId("createFile")
  create(
    @header contentType: "multipart/form-data",
    @body file: CreateFileRequest,
  ): OpenAIFile | ErrorResponse;

  @tag("OpenAI")
  @post
  @summary("Returns information about a specific file.")
  @operationId("retrieveFile")
  @route("/files/{file_id}")
  retrieve(
    /** The ID of the file to use for this request. */
    @path file_id: string,
  ): OpenAIFile | ErrorResponse;

  @tag("OpenAI")
  @delete
  @summary("Delete a file")
  @operationId("deleteFile")
  @route("/files/{file_id}")
  delete(
    /** The ID of the file to use for this request. */
    @path file_id: string,
  ): DeleteFileResponse | ErrorResponse;

  @route("/files/{file_id}/content")
  @tag("OpenAI")
  @get
  @summary("Returns the contents of the specified file.")
  @operationId("downloadFile")
  download(
    /** The ID of the file to use for this request. */
    @path file_id: string,
  ): string | ErrorResponse;
}
