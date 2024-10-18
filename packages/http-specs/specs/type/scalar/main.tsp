import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@scenarioService("/type/scalar")
namespace Type.Scalar;

@route("/string")
interface String {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle a string value. Mock api will return 'test'")
  @get
  @doc("get string value")
  get(): string;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to send a string value. Mock api expect to receive 'test'")
  @put
  @doc("put string value")
  put(@body @doc("_") body: string): void;
}

@route("/boolean")
interface Boolean {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle a boolean value. Mock api will return true ")
  @get
  @doc("get boolean value")
  get(): boolean;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to send a boolean value. Mock api expect to receive 'true'")
  @put
  @doc("put boolean value")
  put(@body @doc("_") body: boolean): void;
}

@route("/unknown")
interface Unknown {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to handle a unknown type value. Mock api will return 'test'")
  @get
  @doc("get unknown value")
  get(): unknown;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("Expect to send a string value. Mock api expect to receive 'test'")
  @put
  @doc("put unknown value")
  put(@body @doc("_") body: unknown): void;
}

@doc("Template to have scalar types operations")
interface ScalarTypesOperations<T, TDoc extends valueof string> {
  @scenario
  @scenarioDoc("""
    Expected response body:
    ```json
    ${TDoc}
    ```
    """)
  @get
  @route("/response_body")
  responseBody(): T;

  @scenario
  @scenarioDoc("""
    Expected input body:
    ```json
    ${TDoc}
    ```
    """)
  @put
  @route("/resquest_body")
  requestBody(@body body: T): void;

  @scenario
  @scenarioDoc("""
    Expected request parameter:
    value=${TDoc}
    """)
  @get
  @route("/request_parameter")
  requestParameter(@query value: T): void;
}

@doc("Decimal type")
@route("/decimal")
interface DecimalType extends ScalarTypesOperations<decimal, "0.33333"> {}

@doc("Decimal128 type")
@route("/decimal128")
interface Decimal128Type extends ScalarTypesOperations<decimal128, "0.33333"> {}

@doc("Template to verify number types")
interface NumberTypesVerifyOperations<
  T,
  VerifyValues extends valueof string,
  ResultValue extends valueof string
> {
  @scenario
  @scenarioDoc("""
    Get verify values:
    ${VerifyValues}
    """)
  @get
  @route("/prepare_verify")
  prepareVerify(): T[];

  @scenario
  @scenarioDoc("""
    Expected input body:
    ```json
    ${ResultValue}
    ```
    """)
  @post
  @route("/verify")
  verify(@body body: T): void;
}

@doc("Decimal type verification")
@route("/decimal")
interface DecimalVerify extends NumberTypesVerifyOperations<decimal, "[0.1, 0.1, 0.1]", "0.3"> {}

@doc("Decimal128 type verification")
@route("/decimal128")
interface Decimal128Verify extends NumberTypesVerifyOperations<decimal, "[0.1, 0.1, 0.1]", "0.3"> {}
