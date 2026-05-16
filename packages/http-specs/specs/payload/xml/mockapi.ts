import {
  match,
  type MockBody,
  passOnCode,
  passOnSuccess,
  ScenarioMockApi,
  xml,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// ────────────────────────────────────────────────────────────────────────────
// §1 — Primitive properties
// ────────────────────────────────────────────────────────────────────────────

export const simpleModel = `
<SimpleModel>
  <name>foo</name>
  <age>123</age>
</SimpleModel>
`;

export const modelWithRenamedProperty = `
<ModelWithRenamedProperty>
  <renamedTitle>foo</renamedTitle>
  <author>bar</author>
</ModelWithRenamedProperty>
`;

export const modelWithRenamedFields = `
<ModelWithRenamedFieldsSrc>
  <InputData>
    <name>foo</name>
    <age>123</age>
  </InputData>
  <OutputData>
    <name>bar</name>
    <age>456</age>
  </OutputData>
</ModelWithRenamedFieldsSrc>
`;

// ────────────────────────────────────────────────────────────────────────────
// §2 — Nested models
// ────────────────────────────────────────────────────────────────────────────

export const modelWithNestedModel = `
<ModelWithNestedModel>
  <nested>
    <name>foo</name>
    <age>123</age>
  </nested>
</ModelWithNestedModel>
`;

export const modelWithRenamedNestedModel = `
<ModelWithRenamedNestedModel>
  <author>
    <name>foo</name>
  </author>
</ModelWithRenamedNestedModel>
`;

// ────────────────────────────────────────────────────────────────────────────
// §3 — Array of primitive types
// ────────────────────────────────────────────────────────────────────────────

export const modelWithSimpleArrays = `
<ModelWithSimpleArrays>
  <colors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithSimpleArrays>
`;

export const modelWithUnwrappedArray = `
<ModelWithUnwrappedArray>
  <colors>red</colors>
  <colors>green</colors>
  <colors>blue</colors>
  <counts>
    <int32>1</int32>
    <int32>2</int32>
  </counts>
</ModelWithUnwrappedArray>
`;

export const modelWithRenamedArrays = `
<ModelWithRenamedArrays>
  <Colors>red</Colors>
  <Colors>green</Colors>
  <Colors>blue</Colors>
  <Counts>
    <int32>1</int32>
    <int32>2</int32>
  </Counts>
</ModelWithRenamedArrays>
`;

export const modelWithWrappedPrimitiveCustomItemNames = `
<ModelWithWrappedPrimitiveCustomItemNames>
  <ItemsTags>
    <ItemName>fiction</ItemName>
    <ItemName>classic</ItemName>
  </ItemsTags>
</ModelWithWrappedPrimitiveCustomItemNames>
`;

// ────────────────────────────────────────────────────────────────────────────
// §4 — Array of complex types
// ────────────────────────────────────────────────────────────────────────────

export const modelWithArrayOfModel = `
<ModelWithArrayOfModel>
  <items>
    <SimpleModel>
      <name>foo</name>
      <age>123</age>
    </SimpleModel>
    <SimpleModel>
      <name>bar</name>
      <age>456</age>
    </SimpleModel>
  </items>
</ModelWithArrayOfModel>
`;

export const modelWithUnwrappedModelArray = `
<ModelWithUnwrappedModelArray>
  <items>
    <name>foo</name>
    <age>123</age>
  </items>
  <items>
    <name>bar</name>
    <age>456</age>
  </items>
</ModelWithUnwrappedModelArray>
`;

export const modelWithRenamedWrappedModelArray = `
<ModelWithRenamedWrappedModelArray>
  <AllItems>
    <SimpleModel>
      <name>foo</name>
      <age>123</age>
    </SimpleModel>
    <SimpleModel>
      <name>bar</name>
      <age>456</age>
    </SimpleModel>
  </AllItems>
</ModelWithRenamedWrappedModelArray>
`;

export const modelWithRenamedUnwrappedModelArray = `
<ModelWithRenamedUnwrappedModelArray>
  <ModelItem>
    <name>foo</name>
    <age>123</age>
  </ModelItem>
  <ModelItem>
    <name>bar</name>
    <age>456</age>
  </ModelItem>
</ModelWithRenamedUnwrappedModelArray>
`;

export const modelWithRenamedWrappedAndItemModelArray = `
<ModelWithRenamedWrappedAndItemModelArray>
  <AllBooks>
    <XmlBook>
      <title>The Great Gatsby</title>
    </XmlBook>
    <XmlBook>
      <title>Les Miserables</title>
    </XmlBook>
  </AllBooks>
</ModelWithRenamedWrappedAndItemModelArray>
`;

// ────────────────────────────────────────────────────────────────────────────
// §5 — Attributes
// ────────────────────────────────────────────────────────────────────────────

export const modelWithAttributes = `
<ModelWithAttributes id1="123" id2="foo">
  <enabled>true</enabled>
</ModelWithAttributes>
`;

export const modelWithRenamedAttribute = `
<ModelWithRenamedAttribute xml-id="123">
  <title>The Great Gatsby</title>
  <author>F. Scott Fitzgerald</author>
</ModelWithRenamedAttribute>
`;

// ────────────────────────────────────────────────────────────────────────────
// §6/§7 — Namespace and prefix
// ────────────────────────────────────────────────────────────────────────────

export const modelWithNamespace = `
<smp:ModelWithNamespace xmlns:smp="http://example.com/schema">
  <id>123</id>
  <title>The Great Gatsby</title>
</smp:ModelWithNamespace>
`;

export const modelWithNamespaceOnProperties = `
<smp:ModelWithNamespaceOnProperties xmlns:smp="http://example.com/schema" xmlns:ns2="http://example.com/ns2">
  <id>123</id>
  <smp:title>The Great Gatsby</smp:title>
  <ns2:author>F. Scott Fitzgerald</ns2:author>
</smp:ModelWithNamespaceOnProperties>
`;

// ────────────────────────────────────────────────────────────────────────────
// §8 — Text content
// ────────────────────────────────────────────────────────────────────────────

export const modelWithText = `
<ModelWithText language="foo">
  This is some text.
</ModelWithText>
`;

// ────────────────────────────────────────────────────────────────────────────
// Additional scenarios (not in the guide)
// ────────────────────────────────────────────────────────────────────────────

export const modelWithOptionalField = `
<ModelWithOptionalField>
  <item>widget</item>
</ModelWithOptionalField>
`;

export const modelWithEmptyArray = `
<ModelWithEmptyArray>
  <items />
</ModelWithEmptyArray>
`;

export const modelWithDictionary = `
<ModelWithDictionary>
  <metadata>
    <Color>blue</Color>
    <Count>123</Count>
    <Enabled>false</Enabled>
  </metadata>
</ModelWithDictionary>
`;

export const modelWithEncodedNames = `
<ModelWithEncodedNamesSrc>
  <SimpleModelData>
    <name>foo</name>
    <age>123</age>
  </SimpleModelData>
  <PossibleColors>
    <string>red</string>
    <string>green</string>
    <string>blue</string>
  </PossibleColors>
</ModelWithEncodedNamesSrc>
`;

export const modelWithEnum = `
<ModelWithEnum>
  <status>success</status>
</ModelWithEnum>
`;

export const modelWithDatetime = xml`
<ModelWithDatetime>
  <rfc3339>${match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z")}</rfc3339>
  <rfc7231>${match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT")}</rfc7231>
</ModelWithDatetime>
`;

const Payload_Xml_ModelWithDatetime = createServerTests(
  "/payload/xml/modelWithDatetime",
  modelWithDatetime,
);
Scenarios.Payload_Xml_ModelWithDatetimeValue_get = Payload_Xml_ModelWithDatetime.get;
Scenarios.Payload_Xml_ModelWithDatetimeValue_put = Payload_Xml_ModelWithDatetime.put;

export const xmlError = `
<XmlErrorBody>
  <message>Something went wrong</message>
  <code>400</code>
</XmlErrorBody>
`;

// ────────────────────────────────────────────────────────────────────────────
// Scenario registrations
// ────────────────────────────────────────────────────────────────────────────

function isMockBody(data: any): data is MockBody {
  return typeof data === "object" && data !== null && "contentType" in data;
}

function createServerTests(uri: string, data?: any) {
  const body = isMockBody(data) ? data : xml(data);
  return {
    get: passOnSuccess({
      uri,
      method: "get",
      request: {},
      response: {
        status: 200,
        body,
      },
      kind: "MockApiDefinition",
    }),
    put: passOnSuccess({
      uri,
      method: "put",
      request: {
        body,
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition",
    }),
  };
}

// §1 — Primitive properties

const Payload_Xml_SimpleModel = createServerTests("/payload/xml/simpleModel", simpleModel);
Scenarios.Payload_Xml_SimpleModelValue_get = Payload_Xml_SimpleModel.get;
Scenarios.Payload_Xml_SimpleModelValue_put = Payload_Xml_SimpleModel.put;

const Payload_Xml_ModelWithRenamedProperty = createServerTests(
  "/payload/xml/modelWithRenamedProperty",
  modelWithRenamedProperty,
);
Scenarios.Payload_Xml_ModelWithRenamedPropertyValue_get = Payload_Xml_ModelWithRenamedProperty.get;
Scenarios.Payload_Xml_ModelWithRenamedPropertyValue_put = Payload_Xml_ModelWithRenamedProperty.put;

const Payload_Xml_ModelWithRenamedFields = createServerTests(
  "/payload/xml/modelWithRenamedFields",
  modelWithRenamedFields,
);
Scenarios.Payload_Xml_ModelWithRenamedFieldsValue_get = Payload_Xml_ModelWithRenamedFields.get;
Scenarios.Payload_Xml_ModelWithRenamedFieldsValue_put = Payload_Xml_ModelWithRenamedFields.put;

// §2 — Nested models

const Payload_Xml_ModelWithNestedModel = createServerTests(
  "/payload/xml/modelWithNestedModel",
  modelWithNestedModel,
);
Scenarios.Payload_Xml_ModelWithNestedModelValue_get = Payload_Xml_ModelWithNestedModel.get;
Scenarios.Payload_Xml_ModelWithNestedModelValue_put = Payload_Xml_ModelWithNestedModel.put;

const Payload_Xml_ModelWithRenamedNestedModel = createServerTests(
  "/payload/xml/modelWithRenamedNestedModel",
  modelWithRenamedNestedModel,
);
Scenarios.Payload_Xml_ModelWithRenamedNestedModelValue_get =
  Payload_Xml_ModelWithRenamedNestedModel.get;
Scenarios.Payload_Xml_ModelWithRenamedNestedModelValue_put =
  Payload_Xml_ModelWithRenamedNestedModel.put;

// §3 — Array of primitive types

const Payload_Xml_ModelWithSimpleArrays = createServerTests(
  "/payload/xml/modelWithSimpleArrays",
  modelWithSimpleArrays,
);
Scenarios.Payload_Xml_ModelWithSimpleArraysValue_get = Payload_Xml_ModelWithSimpleArrays.get;
Scenarios.Payload_Xml_ModelWithSimpleArraysValue_put = Payload_Xml_ModelWithSimpleArrays.put;

const Payload_Xml_ModelWithUnwrappedArray = createServerTests(
  "/payload/xml/modelWithUnwrappedArray",
  modelWithUnwrappedArray,
);
Scenarios.Payload_Xml_ModelWithUnwrappedArrayValue_get = Payload_Xml_ModelWithUnwrappedArray.get;
Scenarios.Payload_Xml_ModelWithUnwrappedArrayValue_put = Payload_Xml_ModelWithUnwrappedArray.put;

const Payload_Xml_ModelWithRenamedArrays = createServerTests(
  "/payload/xml/modelWithRenamedArrays",
  modelWithRenamedArrays,
);
Scenarios.Payload_Xml_ModelWithRenamedArraysValue_get = Payload_Xml_ModelWithRenamedArrays.get;
Scenarios.Payload_Xml_ModelWithRenamedArraysValue_put = Payload_Xml_ModelWithRenamedArrays.put;

const Payload_Xml_ModelWithWrappedPrimitiveCustomItemNames = createServerTests(
  "/payload/xml/modelWithWrappedPrimitiveCustomItemNames",
  modelWithWrappedPrimitiveCustomItemNames,
);
Scenarios.Payload_Xml_ModelWithWrappedPrimitiveCustomItemNamesValue_get =
  Payload_Xml_ModelWithWrappedPrimitiveCustomItemNames.get;
Scenarios.Payload_Xml_ModelWithWrappedPrimitiveCustomItemNamesValue_put =
  Payload_Xml_ModelWithWrappedPrimitiveCustomItemNames.put;

// §4 — Array of complex types

const Payload_Xml_ModelWithArrayOfModel = createServerTests(
  "/payload/xml/modelWithArrayOfModel",
  modelWithArrayOfModel,
);
Scenarios.Payload_Xml_ModelWithArrayOfModelValue_get = Payload_Xml_ModelWithArrayOfModel.get;
Scenarios.Payload_Xml_ModelWithArrayOfModelValue_put = Payload_Xml_ModelWithArrayOfModel.put;

const Payload_Xml_ModelWithUnwrappedModelArray = createServerTests(
  "/payload/xml/modelWithUnwrappedModelArray",
  modelWithUnwrappedModelArray,
);
Scenarios.Payload_Xml_ModelWithUnwrappedModelArrayValue_get =
  Payload_Xml_ModelWithUnwrappedModelArray.get;
Scenarios.Payload_Xml_ModelWithUnwrappedModelArrayValue_put =
  Payload_Xml_ModelWithUnwrappedModelArray.put;

const Payload_Xml_ModelWithRenamedWrappedModelArray = createServerTests(
  "/payload/xml/modelWithRenamedWrappedModelArray",
  modelWithRenamedWrappedModelArray,
);
Scenarios.Payload_Xml_ModelWithRenamedWrappedModelArrayValue_get =
  Payload_Xml_ModelWithRenamedWrappedModelArray.get;
Scenarios.Payload_Xml_ModelWithRenamedWrappedModelArrayValue_put =
  Payload_Xml_ModelWithRenamedWrappedModelArray.put;

const Payload_Xml_ModelWithRenamedUnwrappedModelArray = createServerTests(
  "/payload/xml/modelWithRenamedUnwrappedModelArray",
  modelWithRenamedUnwrappedModelArray,
);
Scenarios.Payload_Xml_ModelWithRenamedUnwrappedModelArrayValue_get =
  Payload_Xml_ModelWithRenamedUnwrappedModelArray.get;
Scenarios.Payload_Xml_ModelWithRenamedUnwrappedModelArrayValue_put =
  Payload_Xml_ModelWithRenamedUnwrappedModelArray.put;

const Payload_Xml_ModelWithRenamedWrappedAndItemModelArray = createServerTests(
  "/payload/xml/modelWithRenamedWrappedAndItemModelArray",
  modelWithRenamedWrappedAndItemModelArray,
);
Scenarios.Payload_Xml_ModelWithRenamedWrappedAndItemModelArrayValue_get =
  Payload_Xml_ModelWithRenamedWrappedAndItemModelArray.get;
Scenarios.Payload_Xml_ModelWithRenamedWrappedAndItemModelArrayValue_put =
  Payload_Xml_ModelWithRenamedWrappedAndItemModelArray.put;

// §5 — Attributes

const Payload_Xml_ModelWithAttributes = createServerTests(
  "/payload/xml/modelWithAttributes",
  modelWithAttributes,
);
Scenarios.Payload_Xml_ModelWithAttributesValue_get = Payload_Xml_ModelWithAttributes.get;
Scenarios.Payload_Xml_ModelWithAttributesValue_put = Payload_Xml_ModelWithAttributes.put;

const Payload_Xml_ModelWithRenamedAttribute = createServerTests(
  "/payload/xml/modelWithRenamedAttribute",
  modelWithRenamedAttribute,
);
Scenarios.Payload_Xml_ModelWithRenamedAttributeValue_get =
  Payload_Xml_ModelWithRenamedAttribute.get;
Scenarios.Payload_Xml_ModelWithRenamedAttributeValue_put =
  Payload_Xml_ModelWithRenamedAttribute.put;

// §6/§7 — Namespace and prefix

const Payload_Xml_ModelWithNamespace = createServerTests(
  "/payload/xml/modelWithNamespace",
  modelWithNamespace,
);
Scenarios.Payload_Xml_ModelWithNamespaceValue_get = Payload_Xml_ModelWithNamespace.get;
Scenarios.Payload_Xml_ModelWithNamespaceValue_put = Payload_Xml_ModelWithNamespace.put;

const Payload_Xml_ModelWithNamespaceOnProperties = createServerTests(
  "/payload/xml/modelWithNamespaceOnProperties",
  modelWithNamespaceOnProperties,
);
Scenarios.Payload_Xml_ModelWithNamespaceOnPropertiesValue_get =
  Payload_Xml_ModelWithNamespaceOnProperties.get;
Scenarios.Payload_Xml_ModelWithNamespaceOnPropertiesValue_put =
  Payload_Xml_ModelWithNamespaceOnProperties.put;

// §8 — Text content

const Payload_Xml_ModelWithText = createServerTests("/payload/xml/modelWithText", modelWithText);
Scenarios.Payload_Xml_ModelWithTextValue_get = Payload_Xml_ModelWithText.get;
Scenarios.Payload_Xml_ModelWithTextValue_put = Payload_Xml_ModelWithText.put;

// Additional scenarios

const Payload_Xml_ModelWithOptionalField = createServerTests(
  "/payload/xml/modelWithOptionalField",
  modelWithOptionalField,
);
Scenarios.Payload_Xml_ModelWithOptionalFieldValue_get = Payload_Xml_ModelWithOptionalField.get;
Scenarios.Payload_Xml_ModelWithOptionalFieldValue_put = Payload_Xml_ModelWithOptionalField.put;

const Payload_Xml_ModelWithEmptyArray = createServerTests(
  "/payload/xml/modelWithEmptyArray",
  modelWithEmptyArray,
);
Scenarios.Payload_Xml_ModelWithEmptyArrayValue_get = Payload_Xml_ModelWithEmptyArray.get;
Scenarios.Payload_Xml_ModelWithEmptyArrayValue_put = Payload_Xml_ModelWithEmptyArray.put;

const Payload_Xml_ModelWithDictionary = createServerTests(
  "/payload/xml/modelWithDictionary",
  modelWithDictionary,
);
Scenarios.Payload_Xml_ModelWithDictionaryValue_get = Payload_Xml_ModelWithDictionary.get;
Scenarios.Payload_Xml_ModelWithDictionaryValue_put = Payload_Xml_ModelWithDictionary.put;

const Payload_Xml_ModelWithEncodedNames = createServerTests(
  "/payload/xml/modelWithEncodedNames",
  modelWithEncodedNames,
);
Scenarios.Payload_Xml_ModelWithEncodedNamesValue_get = Payload_Xml_ModelWithEncodedNames.get;
Scenarios.Payload_Xml_ModelWithEncodedNamesValue_put = Payload_Xml_ModelWithEncodedNames.put;

const Payload_Xml_ModelWithEnum = createServerTests("/payload/xml/modelWithEnum", modelWithEnum);
Scenarios.Payload_Xml_ModelWithEnumValue_get = Payload_Xml_ModelWithEnum.get;
Scenarios.Payload_Xml_ModelWithEnumValue_put = Payload_Xml_ModelWithEnum.put;

Scenarios.Payload_Xml_XmlErrorValue_get = passOnCode(400, {
  uri: "/payload/xml/error",
  method: "get",
  request: {},
  response: {
    status: 400,
    body: xml(xmlError),
  },
  kind: "MockApiDefinition",
});
