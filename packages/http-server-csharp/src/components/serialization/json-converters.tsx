import { SourceDirectory, type Children } from "@alloy-js/core";
import { Base64UrlJsonConverter } from "./base64-url-json-converter.jsx";
import { ConstraintAttributes } from "./constraint-attributes.jsx";
import { HttpServiceExceptionFilter } from "./http-service-exception-filter.jsx";
import { JsonSerializationProvider } from "./json-serialization-provider.jsx";
import { TimeSpanDurationConverter } from "./time-span-duration-converter.jsx";
import { UnixEpochDateTimeConverter } from "./unix-epoch-date-time-converter.jsx";

/**
 * Renders the JSON serialization helper files (converters and provider).
 * These are static C# source files used by the generated models and controllers.
 */
export function JsonConverters(): Children {
  return (
    <SourceDirectory path="lib">
      <TimeSpanDurationConverter />
      <Base64UrlJsonConverter />
      <UnixEpochDateTimeConverter />
      <HttpServiceExceptionFilter />
      <JsonSerializationProvider />
      <ConstraintAttributes />
    </SourceDirectory>
  );
}
