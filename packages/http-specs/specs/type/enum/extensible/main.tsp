import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/type/enum/extensible")
namespace Type.Enum.Extensible;

@doc("Days of the week")
union DaysOfWeekExtensibleEnum {
  string,

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

  @doc("Sunday.")
  Sunday: "Sunday",
}

@doc("Service API versions")
union ApiVersionExtensibleEnum {
  string,

  @doc("Version 2020-01-01.")
  `2020-01-01`: "2020-01-01",

  @doc("Version 2021-01-01.")
  `2021-01-01`: "2021-01-01",
}

@route("/string")
interface String {
  @scenario
  @scenarioDoc("Expect to handle a known value. Mock api will return 'Monday'")
  @get
  @route("/known-value")
  getKnownValue(): {
    @header
    contentType: "application/json";

    @body body: DaysOfWeekExtensibleEnum;
  };

  @scenario
  @scenarioDoc("Expect to handle an unknown value. Mock api will return 'Weekend'")
  @get
  @route("/unknown-value")
  getUnknownValue(): {
    @header
    contentType: "application/json";

    @body body: DaysOfWeekExtensibleEnum;
  };

  @scenario
  @scenarioDoc("Expect to send a known value. Mock api expect to receive 'Monday'")
  @put
  @route("/known-value")
  putKnownValue(
    @header
    contentType: "application/json",

    @body body: DaysOfWeekExtensibleEnum,
  ): void;

  @scenario
  @scenarioDoc("Expect to handle an unknown value. Mock api expect to receive 'Weekend'")
  @put
  @route("/unknown-value")
  putUnknownValue(
    @header
    contentType: "application/json",

    @body body: DaysOfWeekExtensibleEnum,
  ): void;
}

@route("/api-version")
interface ApiVersion {
  @scenario
  @scenarioDoc("Expect to handle a known value. Mock api will return '2020-01-01'")
  @get
  @route("/known-value")
  getKnownValue(): {
    @header
    contentType: "application/json";

    @body body: ApiVersionExtensibleEnum;
  };

  @scenario
  @scenarioDoc("Expect to handle an unknown value. Mock api will return '2022-01-01'")
  @get
  @route("/unknown-value")
  getUnknownValue(): {
    @header
    contentType: "application/json";

    @body body: ApiVersionExtensibleEnum;
  };

  @scenario
  @scenarioDoc("Expect to send a known value. Mock api expects to receive '2020-01-01'")
  @put
  @route("/known-value")
  putKnownValue(
    @header
    contentType: "application/json",

    @body body: ApiVersionExtensibleEnum,
  ): void;

  @scenario
  @scenarioDoc("Expect to send an unknown value. Mock api expects to receive '2022-01-01'")
  @put
  @route("/unknown-value")
  putUnknownValue(
    @header
    contentType: "application/json",

    @body body: ApiVersionExtensibleEnum,
  ): void;
}
