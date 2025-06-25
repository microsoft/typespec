import "@typespec/rest";
import "@typespec/openapi";
/* cspell:disable */

using Http;

@service(#{ title: "sample" })
namespace Sample;

@doc("Error")
@error
model Error {
  status: int32;
  message: string;
}

@doc("AutoRest String Test Service")
@tag("String Operations")
@route("/string")
namespace String {
  @doc("Get null string value")
  @route("null")
  @get
  op getNull(): Body<string | null> | Error;

  @doc("Put null string value")
  @route("null")
  @put
  op putNull(@body value: string | null): {
    ...Response<200>;
  } | Error;

  @doc("Get empty string value")
  @route("empty")
  @get
  op getEmpty(): Body<""> | Error;

  @doc("Put empty string value")
  @route("empty")
  @put
  op putEmpty(@body value: ""): {
    ...Response<200>;
  } | Error;

  @doc("Get mbcs string value '啊齄丂狛狜隣郎隣兀﨩ˊ〞〡￤℡㈱‐ー﹡﹢﹫、〓ⅰⅹ⒈€㈠㈩ⅠⅫ！￣ぁんァヶΑ︴АЯаяāɡㄅㄩ─╋︵﹄︻︱︳︴ⅰⅹɑɡ〇〾⿻⺁䜣€'")
  @route("mbcs")
  @get
  op getMbcs(
  ): Body<"啊齄丂狛狜隣郎隣兀﨩ˊ〞〡￤℡㈱‐ー﹡﹢﹫、〓ⅰⅹ⒈€㈠㈩ⅠⅫ！￣ぁんァヶΑ︴АЯаяāɡㄅㄩ─╋︵﹄︻︱︳︴ⅰⅹɑɡ〇〾⿻⺁䜣€"> | Error;

  @doc("Put mbcs string value '啊齄丂狛狜隣郎隣兀﨩ˊ〞〡￤℡㈱‐ー﹡﹢﹫、〓ⅰⅹ⒈€㈠㈩ⅠⅫ！￣ぁんァヶΑ︴АЯаяāɡㄅㄩ─╋︵﹄︻︱︳︴ⅰⅹɑɡ〇〾⿻⺁䜣€'")
  @route("mbcs")
  @put
  op putMbCs(
    @body
    value: "啊齄丂狛狜隣郎隣兀﨩ˊ〞〡￤℡㈱‐ー﹡﹢﹫、〓ⅰⅹ⒈€㈠㈩ⅠⅫ！￣ぁんァヶΑ︴АЯаяāɡㄅㄩ─╋︵﹄︻︱︳︴ⅰⅹɑɡ〇〾⿻⺁䜣€",
  ): {
    ...Response<200>;
  } | Error;

  @doc("Get string value with leading and trailing whitespace '<tab><space><space>Now is the time for all good men to come to the aid of their country<tab><space><space>'")
  @route("whitespace")
  @get
  op getWhitespace(
  ): Body<"   Now is the time for all good men to come to the aid of their country    "> | Error;

  @doc("Get string value with leading and trailing whitespace '<tab><space><space>Now is the time for all good men to come to the aid of their country<tab><space><space>'")
  @route("whitespace")
  @put
  op putWhitespace(
    @body value: "   Now is the time for all good men to come to the aid of their country    ",
  ): {
    ...Response<200>;
  } | Error;

  @doc("Get value that is base64 encoded")
  @route("base64Encoding")
  @get
  op getBase64Encoding(): Body<bytes> | Error;

  @doc("Put value that is base64 encoded")
  @route("base64Encoding")
  @put
  op putBase64Encoding(@body value: bytes): {
    ...Response<200>;
  } | Error;

  @route("enum")
  namespace Enums {
    @doc("Get non expandable string enum value")
    @route("empty")
    @get
    op getNotExpandable(): Body<Colors> | Error;

    @doc("Put non expandable string enum value")
    @route("empty")
    @put
    op putNotExpandable(@body value: Colors): {
      ...Response<200>;
    } | Error;

    @doc("Gets value 'green-color' from a constant")
    @route("constant")
    @get
    op getConstant(): Body<Colors> | Error;

    @doc("Sends value 'green-color' from a constant")
    @route("constant")
    @put
    op putConstant(@body value: Colors): {
      ...Response<200>;
    } | Error;
  }
}

// TODO: closed enum https://github.com/Azure/typespec-azure/issues/1036
enum Colors {
  `red color`,
  `green-color`,
  `blue-color`,
}

alias RefColorConstant = "green-color";
