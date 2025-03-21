---
layout: ../layouts/content.astro
---

# Multi protocol

TypeSpec is a protocol agnostic language. It could be used with many different protocols independently or together.

## Examples

### Protobuf service and emit a json schema for the models.

In this example we have a protobuf service and we want to emit a json schema for the models which we can use later to validate the data in our service implementation.

```tsp tryit="{"emit": ["@typespec/protobuf", "@typespec/json-schema"]}"
import "@typespec/protobuf";
import "@typespec/http";
import "@typespec/json-schema";

using Protobuf;
using Http;

@JsonSchema.jsonSchema
@Protobuf.package({
  name: "kiosk",
})
@TypeSpec.service
namespace KioskExample;

// models.tsp
model Kiosk {
  @field(1) id?: int32;
  @field(2) name: string;
  @field(3) size: ScreenSize;
  @field(4) location: LatLng;
  @field(5) create_time?: int32;
}
model ScreenSize {
  @field(1) width: int32;
  @field(2) height: int32;
}

model LatLng {
  @field(1) lat: float64;
  @field(2) lng: float64;
}

model ListResponse {
  @field(1) kiosks: Kiosk[];
}

@Protobuf.service
interface Kiosks {
  @post createKiosk(...Kiosk): Kiosk;
  @list listKiosks(): ListResponse;
  @get getKiosk(@path @field(1) id: int32): Kiosk;
  @delete deleteKiosk(@path @field(1) id: int32): void;
}
```
