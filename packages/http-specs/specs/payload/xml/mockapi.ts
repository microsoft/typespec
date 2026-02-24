import { MockRequest, passOnCode, passOnSuccess, ScenarioMockApi, xml } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

export const simpleModel = `
<SimpleModel>
  <name>foo</name>
  <age>123</age>
</SimpleModel>
`;

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

export const modelWithOptionalField = `
<ModelWithOptionalField>
  <item>widget</item>
</ModelWithOptionalField>
`;

export const modelWithAttributes = `
<ModelWithAttributes id1="123" id2="foo">
  <enabled>true</enabled>
</ModelWithAttributes>
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

export const modelWithEmptyArray = `
<ModelWithEmptyArray>
  <items />
</ModelWithEmptyArray>
`;

export const modelWithText = `
<ModelWithText language="foo">
  This is some text.
</ModelWithText>
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

export const modelWithDatetime = `
<ModelWithDatetime>
  <rfc3339>2022-08-26T18:38:00.000Z</rfc3339>
  <rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231>
</ModelWithDatetime>
`;

function createServerTests(uri: string, data?: any) {
  return {
    get: passOnSuccess({
      uri,
      method: "get",
      request: {},
      response: {
        status: 200,
        body: xml(data),
      },
      kind: "MockApiDefinition",
    }),
    put: passOnSuccess({
      uri,
      method: "put",
      request: {
        body: xml(data),
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("content-type", "application/xml");
        req.expect.xmlBodyEquals(data);
        return {
          status: 204,
        };
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition",
    }),
  };
}

const Payload_Xml_SimpleModel = createServerTests("/payload/xml/simpleModel", simpleModel);
Scenarios.Payload_Xml_SimpleModelValue_get = Payload_Xml_SimpleModel.get;
Scenarios.Payload_Xml_SimpleModelValue_put = Payload_Xml_SimpleModel.put;

const Payload_Xml_ModelWithSimpleArrays = createServerTests(
  "/payload/xml/modelWithSimpleArrays",
  modelWithSimpleArrays,
);
Scenarios.Payload_Xml_ModelWithSimpleArraysValue_get = Payload_Xml_ModelWithSimpleArrays.get;
Scenarios.Payload_Xml_ModelWithSimpleArraysValue_put = Payload_Xml_ModelWithSimpleArrays.put;

const Payload_Xml_ModelWithArrayOfModel = createServerTests(
  "/payload/xml/modelWithArrayOfModel",
  modelWithArrayOfModel,
);
Scenarios.Payload_Xml_ModelWithArrayOfModelValue_get = Payload_Xml_ModelWithArrayOfModel.get;
Scenarios.Payload_Xml_ModelWithArrayOfModelValue_put = Payload_Xml_ModelWithArrayOfModel.put;

const Payload_Xml_ModelWithOptionalField = createServerTests(
  "/payload/xml/modelWithOptionalField",
  modelWithOptionalField,
);
Scenarios.Payload_Xml_ModelWithOptionalFieldValue_get = Payload_Xml_ModelWithOptionalField.get;
Scenarios.Payload_Xml_ModelWithOptionalFieldValue_put = Payload_Xml_ModelWithOptionalField.put;

const Payload_Xml_ModelWithAttributes = createServerTests(
  "/payload/xml/modelWithAttributes",
  modelWithAttributes,
);
Scenarios.Payload_Xml_ModelWithAttributesValue_get = Payload_Xml_ModelWithAttributes.get;
Scenarios.Payload_Xml_ModelWithAttributesValue_put = Payload_Xml_ModelWithAttributes.put;

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

const Payload_Xml_ModelWithRenamedFields = createServerTests(
  "/payload/xml/modelWithRenamedFields",
  modelWithRenamedFields,
);
Scenarios.Payload_Xml_ModelWithRenamedFieldsValue_get = Payload_Xml_ModelWithRenamedFields.get;
Scenarios.Payload_Xml_ModelWithRenamedFieldsValue_put = Payload_Xml_ModelWithRenamedFields.put;

const Payload_Xml_ModelWithEmptyArray = createServerTests(
  "/payload/xml/modelWithEmptyArray",
  modelWithEmptyArray,
);
Scenarios.Payload_Xml_ModelWithEmptyArrayValue_get = Payload_Xml_ModelWithEmptyArray.get;
Scenarios.Payload_Xml_ModelWithEmptyArrayValue_put = Payload_Xml_ModelWithEmptyArray.put;

const Payload_Xml_ModelWithText = createServerTests("/payload/xml/modelWithText", modelWithText);
Scenarios.Payload_Xml_ModelWithTextValue_get = Payload_Xml_ModelWithText.get;
Scenarios.Payload_Xml_ModelWithTextValue_put = Payload_Xml_ModelWithText.put;

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
