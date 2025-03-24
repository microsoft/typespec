import "@typespec/rest";

using Http;

@service(#{ title: "Authenticated service with interface override" })
@useAuth(BearerAuth)
namespace TypeSpec.InterfaceAuth;

// requires BearerAuth
@route("/one")
op one(): void;

@useAuth(BasicAuth)
interface Sample {
  // requires BasicAuth
  @route("/two")
  two(): void;
}
