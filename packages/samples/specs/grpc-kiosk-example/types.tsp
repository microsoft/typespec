import "@typespec/openapi";

using Http;

//
// types.tsp
//
// Generic types used in the Kiosk example that could be part of a standard library
//

@doc("A timestamp")
model Timestamp {
  seconds: int64;
  nanos: int32;
}

@doc("""
  An object that represents a latitude/longitude pair. This is expressed as a
  pair of doubles to represent degrees latitude and degrees longitude. Unless
  specified otherwise, this must conform to the
  <a href="http://www.unoosa.org/pdf/icg/2012/template/WGS_84.pdf">WGS84
  standard</a>. Values must be within normalized ranges.
  """)
model LatLng {
  // The latitude in degrees. It must be in the range [-90.0, +90.0].
  latitude: float64;

  // The longitude in degrees. It must be in the range [-180.0, +180.0].
  longitude: float64;
}

model Empty {}

@doc("An unexpected error response.")
@error
model RpcStatus {
  code?: int32;
  message?: string;
  details?: ProtobufAny[];
}

model ProtobufAny {
  typeUrl?: string;
  value?: string; // format:byte
}
