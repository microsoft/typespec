import "@typespec/rest";

using Http;

@service(#{ title: "Binary sample" })
namespace BinarySample;

model HasBytes {
  bytes: bytes;
}

model BytesBody<ContentType> {
  @body body: bytes;
  @header("content-type") contentType: ContentType;
}

@route("/test")
namespace BytesMethod {
  @route("base64")
  @post
  op jsonWithBase64(@body body: HasBytes): HasBytes;

  @route("textPlain")
  @post
  op textPlain(...BytesBody<"text/plain">): BytesBody<"text/plain">;

  @route("binaryFile")
  @post
  op genericBinaryFile(
    ...BytesBody<"application/octet-stream">,
  ): BytesBody<"application/octet-stream">;

  @route("imagePng")
  @post
  op image(...BytesBody<"image/png">): BytesBody<"image/png">;
}
