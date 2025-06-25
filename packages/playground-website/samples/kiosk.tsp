import "@typespec/protobuf";

using Protobuf;

@package({
  name: "kiosk",
})
namespace KioskExample;

@TypeSpec.Protobuf.service
interface Display {
  /**
   * Create a new kiosk. This enrolls the kiosk for sign display.
   */
  createKiosk(...Kiosk): Kiosk;

  /**
   * List active kiosks.
   */
  listKiosks(...WellKnown.Empty): {
    @field(1) kiosks: Kiosk[];
  };

  /**
   * Get a kiosk.
   */
  getKiosk(@field(1) id: int32): Kiosk;

  /**
   * Delete a kiosk.
   */
  deleteKiosk(@field(1) id: int32): void;

  /**
   * Create a new sign.
   */
  createSign(...Sign): Sign;

  /**
   * List active signs.
   */
  listSigns(...WellKnown.Empty): {
    @field(1) signs: Sign[];
  };

  /**
   * Get a sign.
   */
  getSign(@field(1) id: int32): Sign;

  /**
   * Delete a sign.
   */
  deleteSign(@field(1) id: int32): void;

  /**
   * Set a sign for display on one or more kiosks
   */
  setSignIdForKioskIds(@field(1) kiosk_ids: int32[], @field(2) sign_id: int32): void;

  /**
   * Get the sign that should be displayed on a kiosk.
   */
  getSignIdForKioskId(@field(1) kiosk_id: int32): GetSignIdResponse;
  /**
   * Get signs that should be displayed on a kiosk. Streams.
   */
  @stream(StreamMode.Out)
  getSignIdsforKioskId(@field(1) kiosk_id: int32): GetSignIdResponse;
}

model Kiosk {
  // Output only.
  @field(1) id?: int32;

  // Required.
  @field(2) name: string;

  @field(3) size: ScreenSize;
  @field(4) location: WellKnown.LatLng;

  // Output only.
  @field(5) create_time?: WellKnown.Timestamp;
}

model Sign {
  // Output only.
  @field(1) id?: int32;

  // Required.
  @field(2) name: string;

  @field(3) text: string;
  @field(4) image: bytes;

  // Output only.
  @field(5) create_time?: WellKnown.Timestamp;
}

model ScreenSize {
  @field(1) width: int32;
  @field(2) height: int32;
}

model GetSignIdResponse {
  @field(1) sign_id: int32;
}
