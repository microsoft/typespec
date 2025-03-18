export type ScalarEncoding = {
  bytes?: "base64" | "base64url" | "none";
  datetime?: "rfc3339" | "unixTimestamp" | "rfc7231";
};

export type EncodingDefaults = Partial<ScalarEncoding>;
