import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace Test;

model Widget is Record<string>;

op foo(): Widget;
