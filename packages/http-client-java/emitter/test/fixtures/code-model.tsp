import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service(#{ title: "Model contract" })
@server("https://example.com", "Example")
@versioned(Versions)
@useAuth(ApiKeyAuth<ApiKeyLocation.header, "api-key">)
namespace ModelContract;

enum Versions {
  v1: "2025-01-02",
}

enum Color {
  red,
  blue,
}

@discriminator("kind")
model Animal {
  name: string;
}

model Cat extends Animal {
  kind: "cat";
  lives: int32;
}

model Item {
  id: string;
  enabled: boolean;
  count: int64;
  ratio: float64;
  color: Color;
  fixed: "yes";
  date: plainDate;
  time: plainTime;
  timestamp: utcDateTime;
  elapsed: duration;
  data: bytes;
  url: url;
  animals: Animal[];
  labels: Record<string>;
  child?: Item;
  choice: string | int32;
}

@route("/items")
interface Items {
  @get list(@query limit?: int32): Item[];
  @get @route("/{id}") read(@path id: string): Item;
  @post create(@body body: Item): Item;
  @delete @route("/{id}") remove(@path id: string): void;
  @get @route("/binary") download(): {
    @header contentType: "application/octet-stream";
    @body body: bytes;
  };
}
