import "@typespec/http";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service
@versioned(Versions)
namespace AdvancedVersioning;

enum Versions {
  v1: "2025-01-01",
  v2: "2026-01-01",
  v3: "2026-06-01",
}

model Request {
  value?: string;
}

@route("/query")
@get
op query(@path name: string, @added(Versions.v2) @query option?: string): void;

@route("/header")
@get
op header(@path name: string, @added(Versions.v2) @header option?: string): void;

@route("/body")
@post
op body(@path name: string, @added(Versions.v2) @body body?: Request): void;
