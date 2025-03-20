import "@typespec/versioning";
import "@typespec/rest";

using Http;
using Versioning;

// Simple services that is versioned and uses metadata and visibility features.
@versioned(Versions)
@service(#{ title: "User service" })
namespace UserService {
  enum Versions {
    v1,
    v2,
  }

  model User {
    @path id: string;
    @visibility(Lifecycle.Create) secret: string;
    name: string;
    @added(Versions.v2) age: int32;
  }

  @route("/users")
  interface Users {
    @post createUser(...User): User;
    @get getUser(@path id: string): User;
  }
}

// Stub to test that the sample deals with multi-service specs.
@service
namespace AnotherService {
  @route("/test")
  op test(): void;
}
