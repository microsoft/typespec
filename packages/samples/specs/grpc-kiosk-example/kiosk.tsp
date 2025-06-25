import "@typespec/rest";

using Http;

@service(#{ title: "Grpc Kiosk sample" })
namespace GrpcKioskSample;

@route("/v1")
@tag("Display")
namespace Display {
  @doc("Create a kiosk. This enrolls the kiosk for sign display.")
  @route("kiosks")
  @post
  op createKiosk(@body body: Kiosk): Kiosk | RpcStatus;

  @doc("List active kiosks.")
  @route("kiosks")
  op listKiosks(...Empty): ListKiosksResponse | RpcStatus;

  @doc("Get a kiosk.")
  @route("kiosks/{id}")
  op getKiosk(id: KioskId): Kiosk | RpcStatus;

  @doc("Delete a kiosk.")
  @route("kiosks/{id}")
  @delete
  op deleteKiosk(id: KioskId): void | RpcStatus;

  @doc("Create a sign. This enrolls the sign for sign display.")
  @route("signs")
  @post
  op createSign(@body sign: Sign): Sign | RpcStatus;

  @doc("List active signs.")
  @route("signs")
  op listSigns(...Empty): ListSignsResponse;

  @doc("Get a sign.")
  @route("signs/{id}")
  op getSign(id: SignId): Sign | RpcStatus;

  @doc("Delete a sign.")
  @route("signs/{id}")
  @delete
  op deleteSign(id: SignId): void | RpcStatus;

  @doc("Set a sign for display on one or more kiosks.")
  @route("signs/{sign_id}")
  @post
  op setSignIdForKioskIds(...SetSignIdForKioskIdsRequest): void | RpcStatus;

  @doc("Get the sign that should be displayed on a kiosk.")
  @route("kiosks/{kiosk_id}/sign")
  op getSignIdForKioskId(kiosk_id: int32): GetSignIdResponse | RpcStatus;

  //
  // TODO[JC]: Streaming ?
  //@doc("Get signs that should be displayed on a kiosk. Streams.")
  //op GetSignIdsForKioskId(... GetSignIdForKioskIdRequest): @streaming GetSignIdResponse;
  //
}

@doc("Describes a hardware device that can display signs.")
model Kiosk {
  @doc("unique id")
  id?: int32; // Output only.

  @doc("name of device hardware")
  name: string;

  @doc("screen size")
  size: ScreenSize;

  @doc("kiosk location")
  location: LatLng;

  create_time?: Timestamp; // Output only.
}

@doc("""
  Describes a digital sign.
  Signs can include text, images, or both.
  """)
model Sign {
  @doc("unique id")
  id?: int32; // Output only.

  @doc("name of sign")
  name: string;

  @doc("text to display")
  text: string;

  @doc("image to display")
  image: bytes;
}

@doc("Represents the size of a screen in pixels.")
model ScreenSize {
  width: int32;
  height: int32;
}

@doc("A successful response.")
model ListKiosksResponse {
  kiosks?: Kiosk[];
}

@doc("A successful response.")
model ListSignsResponse {
  signs?: Sign[];
}

model SetSignIdForKioskIdsRequest {
  @body kiosk_ids: int32[];
  sign_id: int32;
}

model GetSignIdForKioskIdRequest {
  kiosk_id: int32;
}

@doc("A successful response.")
model GetSignIdResponse {
  sign_id?: int32;
}

alias KioskId = int32;

alias SignId = int32;
