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

@route("/string")
interface String {
  @scenario
  @scenarioDoc("Expect to handle a known value. Mock api will return 'Monday'")
  @get
  @route("/known-value")
  getKnownValue(): {
    @body body: DaysOfWeekExtensibleEnum;
  };

  @scenario
  @scenarioDoc("Expect to handle an unknown value. Mock api will return 'Weekend'")
  @get
  @route("/unknown-value")
  getUnknownValue(): {
    @body body: DaysOfWeekExtensibleEnum;
  };

  @scenario
  @scenarioDoc("Expect to send a known value. Mock api expect to receive 'Monday'")
  @put
  @route("/known-value")
  putKnownValue(@body body: DaysOfWeekExtensibleEnum): void;

  @scenario
  @scenarioDoc("Expect to handle an unknown value. Mock api expect to receive 'Weekend'")
  @put
  @route("/unknown-value")
  putUnknownValue(@body body: DaysOfWeekExtensibleEnum): void;
}
