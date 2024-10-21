import "@typespec/http";
import "@typespec/spector";

using Http;
using Spector;

@doc("Tests for additional properties of models")
@scenarioService("/type/property/additionalProperties")
namespace Type.Property.AdditionalProperties;

@doc("Template to have models operations")
interface ModelOperations<TModel, TDoc extends valueof string> {
  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  @scenario
  @scenarioDoc("""
    Expected response body:
    ```json
    ${TDoc}
    ```
    """)
  @get
  @doc("Get call")
  get(): TModel;

  #suppress "@azure-tools/typespec-azure-core/use-standard-operations" "For testing"
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
  @scenario
  @scenarioDoc("""
    Expected input body:
    ```json
    ${TDoc}
    ```
    """)
  @put
  @doc("Put operation")
  put(@body @doc("body") body: TModel): void;
}

// ********************************************** Record<unknown> **********************************************
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model extends from Record<unknown> type.")
model ExtendsUnknownAdditionalProperties extends Record<unknown> {
  @doc("The name property")
  name: string;
}

@route("/extendsRecordUnknown")
interface ExtendsUnknown
  extends ModelOperations<
      ExtendsUnknownAdditionalProperties,
      "{'name': 'ExtendsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}"
    > {}

@doc("The model extends from a type that extends from Record<unknown>.")
model ExtendsUnknownAdditionalPropertiesDerived extends ExtendsUnknownAdditionalProperties {
  @doc("The index property")
  index: int32;

  @doc("The age property")
  age?: float32;
}

@route("/extendsRecordUnknownDerived")
interface ExtendsUnknownDerived
  extends ModelOperations<
      ExtendsUnknownAdditionalPropertiesDerived,
      "{'name': 'ExtendsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}"
    > {}

@doc("The model extends from Record<unknown> with a discriminator.")
@discriminator("kind")
model ExtendsUnknownAdditionalPropertiesDiscriminated extends Record<unknown> {
  @doc("The name property")
  name: string;

  @doc("The discriminator")
  kind: string;
}

@doc("The derived discriminated type")
model ExtendsUnknownAdditionalPropertiesDiscriminatedDerived
  extends ExtendsUnknownAdditionalPropertiesDiscriminated {
  kind: "derived";

  @doc("The index property")
  index: int32;

  @doc("The age property")
  age?: float32;
}

@route("/extendsUnknownDiscriminated")
interface ExtendsUnknownDiscriminated
  extends ModelOperations<
      ExtendsUnknownAdditionalPropertiesDiscriminated,
      "{'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}"
    > {}

#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model is from Record<unknown> type.")
model IsUnknownAdditionalProperties is Record<unknown> {
  @doc("The name property")
  name: string;
}

@route("/isRecordUnknown")
interface IsUnknown
  extends ModelOperations<
      IsUnknownAdditionalProperties,
      "{'name': 'IsUnknownAdditionalProperties', 'prop1': 32, 'prop2': true, 'prop3': 'abc'}"
    > {}

@doc("The model extends from a type that is Record<unknown> type")
model IsUnknownAdditionalPropertiesDerived extends IsUnknownAdditionalProperties {
  @doc("The index property")
  index: int32;

  @doc("The age property")
  age?: float32;
}

@route("/isRecordUnknownDerived")
interface IsUnknownDerived
  extends ModelOperations<
      IsUnknownAdditionalPropertiesDerived,
      "{'name': 'IsUnknownAdditionalProperties', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}"
    > {}

@doc("The model is Record<unknown> with a discriminator.")
@discriminator("kind")
model IsUnknownAdditionalPropertiesDiscriminated is Record<unknown> {
  @doc("The name property")
  name: string;

  @doc("The discriminator")
  kind: string;
}

@doc("The derived discriminated type")
model IsUnknownAdditionalPropertiesDiscriminatedDerived
  extends IsUnknownAdditionalPropertiesDiscriminated {
  kind: "derived";

  @doc("The index property")
  index: int32;

  @doc("The age property")
  age?: float32;
}

@route("/isUnknownDiscriminated")
interface IsUnknownDiscriminated
  extends ModelOperations<
      IsUnknownAdditionalPropertiesDiscriminated,
      "{'kind': 'derived', 'name': 'Derived', 'index': 314, 'age': 2.71875, 'prop1': 32, 'prop2': true, 'prop3': 'abc'}"
    > {}

// ***************** Known properties type is the same with additional properties type **************************
// ********************************************** Record<string> **********************************************
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model extends from Record<string> type.")
model ExtendsStringAdditionalProperties extends Record<string> {
  @doc("The name property")
  name: string;
}

@route("/extendsRecordString")
interface ExtendsString
  extends ModelOperations<
      ExtendsStringAdditionalProperties,
      "{'name': 'ExtendsStringAdditionalProperties', 'prop': 'abc'}"
    > {}

#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model is from Record<string> type.")
model IsStringAdditionalProperties is Record<string> {
  @doc("The name property")
  name: string;
}

@route("/isRecordstring")
interface IsString
  extends ModelOperations<
      IsStringAdditionalProperties,
      "{'name': 'IsStringAdditionalProperties', 'prop': 'abc'}"
    > {}

@doc("The model spread Record<string> with the same known property type")
model SpreadStringRecord {
  @doc("The name property")
  name: string;

  ...Record<string>;
}

@route("/spreadRecordString")
interface SpreadString
  extends ModelOperations<SpreadStringRecord, "{'name': 'SpreadSpringRecord', 'prop': 'abc'}"> {}

// ********************************************** Record<float32> **********************************************
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model extends from Record<float32> type.")
model ExtendsFloatAdditionalProperties extends Record<float32> {
  @doc("The id property")
  id: float32;
}

@route("/extendsRecordFloat")
interface ExtendsFloat
  extends ModelOperations<ExtendsFloatAdditionalProperties, "{'id': 43.125, 'prop': 43.125}"> {}

#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model is from Record<float32> type.")
model IsFloatAdditionalProperties is Record<float32> {
  @doc("The id property")
  id: float32;
}

@route("/isRecordFloat")
interface IsFloat
  extends ModelOperations<IsFloatAdditionalProperties, "{'id': 43.125, 'prop': 43.125}"> {}

@doc("The model spread Record<float32> with the same known property type")
model SpreadFloatRecord {
  @doc("The id property")
  id: float32;

  ...Record<float32>;
}

@route("/spreadRecordFloat")
interface SpreadFloat
  extends ModelOperations<SpreadFloatRecord, "{'id': 43.125, 'prop': 43.125}"> {}

// ********************************************** Record<Model> **********************************************
@doc("model for record")
model ModelForRecord {
  @doc("The state property")
  state: string;
}

#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model extends from Record<ModelForRecord> type.")
model ExtendsModelAdditionalProperties extends Record<ModelForRecord> {
  knownProp: ModelForRecord;
}

@route("/extendsRecordModel")
interface ExtendsModel
  extends ModelOperations<
      ExtendsModelAdditionalProperties,
      "{'knownProp': {'state': 'ok'}, 'prop': {'state': 'ok'}}"
    > {}

#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model is from Record<ModelForRecord> type.")
model IsModelAdditionalProperties is Record<ModelForRecord> {
  knownProp: ModelForRecord;
}

@route("/isRecordModel")
interface IsModel
  extends ModelOperations<
      IsModelAdditionalProperties,
      "{'knownProp': {'state': 'ok'}, 'prop': {'state': 'ok'}}"
    > {}

@doc("The model spread Record<ModelForRecord> with the same known property type")
model SpreadModelRecord {
  knownProp: ModelForRecord;
  ...Record<ModelForRecord>;
}

@route("/spreadRecordModel")
interface SpreadModel
  extends ModelOperations<
      SpreadModelRecord,
      "{'knownProp': {'state': 'ok'}, 'prop': {'state': 'ok'}}"
    > {}

// ********************************************** Record<Model[]> **********************************************
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model extends from Record<ModelForRecord[]> type.")
model ExtendsModelArrayAdditionalProperties extends Record<ModelForRecord[]> {
  knownProp: ModelForRecord[];
}

@route("/extendsRecordModelArray")
interface ExtendsModelArray
  extends ModelOperations<
      ExtendsModelArrayAdditionalProperties,
      "{'knownProp': [{'state': 'ok'}, {'state': 'ok'}], 'prop': [{'state': 'ok'}, {'state': 'ok'}]}"
    > {}

#suppress "@azure-tools/typespec-azure-core/bad-record-type" "For testing"
@doc("The model is from Record<ModelForRecord[]> type.")
model IsModelArrayAdditionalProperties is Record<ModelForRecord[]> {
  knownProp: ModelForRecord[];
}

@route("/isRecordModelArray")
interface IsModelArray
  extends ModelOperations<
      IsModelArrayAdditionalProperties,
      "{'knownProp': [{'state': 'ok'}, {'state': 'ok'}], 'prop': [{'state': 'ok'}, {'state': 'ok'}]}"
    > {}

model SpreadModelArrayRecord {
  knownProp: ModelForRecord[];
  ...Record<ModelForRecord[]>;
}

@route("/spreadRecordModelArray")
interface SpreadModelArray
  extends ModelOperations<
      SpreadModelArrayRecord,
      "{'knownProp': [{'state': 'ok'}, {'state': 'ok'}], 'prop': [{'state': 'ok'}, {'state': 'ok'}]}"
    > {}

// ****************** Known properties type is different from additional properties type **************************
// ********************************************** Record<string> **********************************************
@doc("The model spread Record<string> with the different known property type")
model DifferentSpreadStringRecord {
  @doc("The name property")
  id: float32;

  ...Record<string>;
}

@route("/spreadDifferentRecordString")
interface SpreadDifferentString
  extends ModelOperations<DifferentSpreadStringRecord, "{'id': 43.125, 'prop': 'abc'}"> {}

// ********************************************** Record<float32> **********************************************
@doc("The model spread Record<float32> with the different known property type")
model DifferentSpreadFloatRecord {
  @doc("The id property")
  name: string;

  ...Record<float32>;
}

@route("/spreadDifferentRecordFloat")
interface SpreadDifferentFloat
  extends ModelOperations<DifferentSpreadFloatRecord, "{'name': 'abc', 'prop': 43.125}"> {}

// ********************************************** Record<Model> **********************************************
@doc("The model spread Record<ModelForRecord> with the different known property type")
model DifferentSpreadModelRecord {
  knownProp: string;
  ...Record<ModelForRecord>;
}

@route("/spreadDifferentRecordModel")
interface SpreadDifferentModel
  extends ModelOperations<
      DifferentSpreadModelRecord,
      "{'knownProp': 'abc', 'prop': {'state': 'ok'}}"
    > {}

// ********************************************** Record<Model[]> **********************************************
@doc("The model spread Record<ModelForRecord[]> with the different known property type")
model DifferentSpreadModelArrayRecord {
  knownProp: string;
  ...Record<ModelForRecord[]>;
}

@route("/spreadDifferentRecordModelArray")
interface SpreadDifferentModelArray
  extends ModelOperations<
      DifferentSpreadModelArrayRecord,
      "{'knownProp': 'abc', 'prop': [{'state': 'ok'}, {'state': 'ok'}]}"
    > {}

// ****************** extends model has spread Record<string> **************************
@doc("The model extends from a model that spread Record<string> with the different known property type")
model DifferentSpreadStringDerived extends DifferentSpreadStringRecord {
  @doc("The index property")
  derivedProp: string;
}

@route("/extendsDifferentSpreadString")
interface ExtendsDifferentSpreadString
  extends ModelOperations<
      DifferentSpreadStringDerived,
      "{'id': 43.125, 'prop': 'abc', 'derivedProp': 'abc'}"
    > {}

// ****************** extends model has spread Record<float32> **************************
@doc("The model extends from a model that spread Record<float32> with the different known property type")
model DifferentSpreadFloatDerived extends DifferentSpreadFloatRecord {
  @doc("The index property")
  derivedProp: float32;
}

@route("/extendsDifferentSpreadFloat")
interface ExtendsDifferentSpreadFloat
  extends ModelOperations<
      DifferentSpreadFloatDerived,
      "{'name': 'abc', 'prop': 43.125, 'derivedProp': 43.125}"
    > {}

// ****************** extends model has spread Record<Model> **************************

@doc("The model extends from a model that spread Record<ModelForRecord> with the different known property type")
model DifferentSpreadModelDerived extends DifferentSpreadModelRecord {
  @doc("The index property")
  derivedProp: ModelForRecord;
}

@route("/extendsDifferentSpreadModel")
interface ExtendsDifferentSpreadModel
  extends ModelOperations<
      DifferentSpreadModelDerived,
      "{'knownProp': 'abc', 'prop': {'state': 'ok'}, 'derivedProp': {'state': 'ok'}}"
    > {}

// ****************** extends model has spread Record<Model[]> **************************
@doc("The model extends from a model that spread Record<ModelForRecord[]> with the different known property type")
model DifferentSpreadModelArrayDerived extends DifferentSpreadModelArrayRecord {
  @doc("The index property")
  derivedProp: ModelForRecord[];
}

@route("/extendsDifferentSpreadModelArray")
interface ExtendsDifferentSpreadModelArray
  extends ModelOperations<
      DifferentSpreadModelArrayDerived,
      "{'knownProp': 'abc', 'prop': [{'state': 'ok'}, {'state': 'ok'}], 'derivedProp': [{'state': 'ok'}, {'state': 'ok'}]}"
    > {}

// ****************** multiple spread of records **************************
@doc("The model spread Record<string> and Record<float32>")
model MultipleSpreadRecord {
  @doc("The name property")
  flag: boolean;

  ...Record<string>;
  ...Record<float32>;
}

@route("/multipleSpreadRecord")
interface MultipleSpread
  extends ModelOperations<
      MultipleSpreadRecord,
      "{'flag': true, 'prop1': 'abc', 'prop2': 43.125}"
    > {}

// ****************** spread record of unions **************************
@doc("The model spread Record<string | float32>")
model SpreadRecordForUnion {
  @doc("The name property")
  flag: boolean;

  ...Record<string | float32>;
}

@route("/spreadRecordUnion")
interface SpreadRecordUnion
  extends ModelOperations<
      SpreadRecordForUnion,
      "{'flag': true, 'prop1': 'abc', 'prop2': 43.125}"
    > {}

// ****************** spread record of discriminated unions **************************
@discriminator("kind")
union WidgetData {
  kind0: WidgetData0,
  kind1: WidgetData1,
}

model WidgetData0 {
  kind: "kind0";
  fooProp: string;
}

model WidgetData1 {
  kind: "kind1";
  start: utcDateTime;
  end?: utcDateTime;
}

model WidgetData2 {
  kind: "kind1";
  start: string;
}

@doc("The model spread Record<WidgetData>")
model SpreadRecordForDiscriminatedUnion {
  @doc("The name property")
  name: string;

  ...Record<WidgetData>;
}

@route("/spreadRecordDiscriminatedUnion")
interface SpreadRecordDiscriminatedUnion
  extends ModelOperations<
      SpreadRecordForDiscriminatedUnion,
      "{'name': 'abc', 'prop1': {'kind': 'kind0', 'fooProp': 'abc'}, 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}"
    > {}

// ****************** spread record of non-discriminated unions but could guess a discriminator **************************
@doc("The model spread Record<WidgetData0 | WidgetData1>")
model SpreadRecordForNonDiscriminatedUnion {
  @doc("The name property")
  name: string;

  ...Record<WidgetData0 | WidgetData1>;
}

@route("/spreadRecordNonDiscriminatedUnion")
interface SpreadRecordNonDiscriminatedUnion
  extends ModelOperations<
      SpreadRecordForNonDiscriminatedUnion,
      "{'name': 'abc', 'prop1': {'kind': 'kind0', 'fooProp': 'abc'}, 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}"
    > {}

// ****************** spread record of non-discriminated unions **************************
@doc("The model spread Record<WidgetData2 | WidgetData1>")
model SpreadRecordForNonDiscriminatedUnion2 {
  @doc("The name property")
  name: string;

  ...Record<WidgetData2 | WidgetData1>;
}

@route("/spreadRecordNonDiscriminatedUnion2")
interface SpreadRecordNonDiscriminatedUnion2
  extends ModelOperations<
      SpreadRecordForNonDiscriminatedUnion2,
      "{'name': 'abc', 'prop1': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'}, 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}"
    > {}

// ****************** spread record of non-discriminated unions **************************
@doc("The model spread Record<WidgetData2[] | WidgetData1>")
model SpreadRecordForNonDiscriminatedUnion3 {
  @doc("The name property")
  name: string;

  ...Record<WidgetData2[] | WidgetData1>;
}

@route("/spreadRecordNonDiscriminatedUnion3")
interface SpreadRecordNonDiscriminatedUnion3
  extends ModelOperations<
      SpreadRecordForNonDiscriminatedUnion3,
      "{'name': 'abc', 'prop1': [{'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'}, {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z'], 'prop2': {'kind': 'kind1', 'start': '2021-01-01T00:00:00Z', 'end': '2021-01-02T00:00:00Z'}}"
    > {}
