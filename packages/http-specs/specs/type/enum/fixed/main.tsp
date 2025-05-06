import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/type/enum/fixed")
namespace Type.Enum.Fixed;

#suppress "@azure-tools/typespec-azure-core/use-extensible-enum" "For testing"
@doc("Days of the week")
enum DaysOfWeekEnum {
  @doc("Monday.")
  Monday,

  @doc("Tuesday.")
  Tuesday,

  @doc("Wednesday.")
  Wednesday,

  @doc("Thursday.")
  Thursday,

  @doc("Friday.")
  Friday,

  @doc("Saturday.")
  Saturday,

  @doc("Sunday.")
  Sunday,
}

@route("/string")
interface String {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle a known value. Mock api will return 'Monday'")
  @get
  @route("/known-value")
  @doc("getKnownValue")
  getKnownValue(): {
    @header
    contentType: "application/json";

    @body
    body: DaysOfWeekEnum;
  };

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to send a known value. Mock api expect to receive 'Monday'")
  @put
  @route("/known-value")
  @doc("putKnownValue")
  putKnownValue(
    @header contentType: "application/json",
    @body @doc("_") body: DaysOfWeekEnum,
  ): void;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle an unknown value. Mock api expect to receive 'Weekend'")
  @put
  @route("/unknown-value")
  @doc("putUnknownValue")
  putUnknownValue(
    @header contentType: "application/json",
    @body @doc("_") body: DaysOfWeekEnum,
  ): void;
}
