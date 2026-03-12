import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "External" })
namespace TspTest.External;

union CloudEventDataFormat {
  string,
  "BYTES",
  "JSON",
}

@doc("Days of the week for recurrence schedule.")
union DayOfWeek {
  string,

  @doc("Sunday.")
  Sunday: "Sunday",

  @doc("Monday.")
  Monday: "Monday",

  @doc("Tuesday.")
  Tuesday: "Tuesday",

  @doc("Wednesday.")
  Wednesday: "Wednesday",

  @doc("Thursday.")
  Thursday: "Thursday",

  @doc("Friday.")
  Friday: "Friday",

  @doc("Saturday.")
  Saturday: "Saturday",
}

model Body {
  cloudEventDataFormat?: CloudEventDataFormat;
  dayOfWeek?: DayOfWeek;
}

@route("/external")
interface ExternalOp {
  @post
  postExternal(@body body: Body): Body;
}

@@alternateType(CloudEventDataFormat,
  {
    identity: "com.azure.core.models.CloudEventDataFormat",
  },
  "java"
);

@@alternateType(DayOfWeek,
  {
    identity: "java.time.DayOfWeek",
  },
  "java"
);
