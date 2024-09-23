import { passOnSuccess, mockapi, xml } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

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

Scenarios.Payload_Xml_SimpleModelValue_get = passOnSuccess(
  mockapi.get("/payload/xml/simpleModel", (req) => {
    return {
      status: 200,
      body: xml(simpleModel),
    };
  }),
);

Scenarios.Payload_Xml_SimpleModelValue_put = passOnSuccess(
  mockapi.put("/payload/xml/simpleModel", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(simpleModel);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithSimpleArraysValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithSimpleArrays", (req) => {
    return {
      status: 200,
      body: xml(modelWithSimpleArrays),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithSimpleArraysValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithSimpleArrays", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithSimpleArrays);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithArrayOfModelValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithArrayOfModel", (req) => {
    return {
      status: 200,
      body: xml(modelWithArrayOfModel),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithArrayOfModelValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithArrayOfModel", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithArrayOfModel);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithOptionalFieldValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithOptionalField", (req) => {
    return {
      status: 200,
      body: xml(modelWithOptionalField),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithOptionalFieldValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithOptionalField", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithOptionalField);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithAttributesValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithAttributes", (req) => {
    return {
      status: 200,
      body: xml(modelWithAttributes),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithAttributesValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithAttributes", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithAttributes);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithUnwrappedArrayValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithUnwrappedArray", (req) => {
    return {
      status: 200,
      body: xml(modelWithUnwrappedArray),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithUnwrappedArrayValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithUnwrappedArray", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithUnwrappedArray);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithRenamedArraysValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithRenamedArrays", (req) => {
    return {
      status: 200,
      body: xml(modelWithRenamedArrays),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithRenamedArraysValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithRenamedArrays", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithRenamedArrays);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithRenamedFieldsValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithRenamedFields", (req) => {
    return {
      status: 200,
      body: xml(modelWithRenamedFields),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithRenamedFieldsValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithRenamedFields", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithRenamedFields);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithEmptyArrayValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithEmptyArray", (req) => {
    return {
      status: 200,
      body: xml(modelWithEmptyArray),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithEmptyArrayValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithEmptyArray", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithEmptyArray);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithTextValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithText", (req) => {
    return {
      status: 200,
      body: xml(modelWithText),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithTextValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithText", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithText);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithDictionaryValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithDictionary", (req) => {
    return {
      status: 200,
      body: xml(modelWithDictionary),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithDictionaryValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithDictionary", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithDictionary);
    return {
      status: 204,
    };
  }),
);

Scenarios.Payload_Xml_ModelWithEncodedNamesValue_get = passOnSuccess(
  mockapi.get("/payload/xml/modelWithEncodedNames", (req) => {
    return {
      status: 200,
      body: xml(modelWithEncodedNames),
    };
  }),
);

Scenarios.Payload_Xml_ModelWithEncodedNamesValue_put = passOnSuccess(
  mockapi.put("/payload/xml/modelWithEncodedNames", (req) => {
    req.expect.containsHeader("content-type", "application/xml");
    req.expect.xmlBodyEquals(modelWithEncodedNames);
    return {
      status: 204,
    };
  }),
);

function createServerTests(uri: string, data?: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 200,
          data: xml(data),
        },
      },
      {
        method: "put",
        request: {
          body: data,
          config: {
            headers: {
              "content-type": "application/xml",
            },
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Payload_Xml_SimpleModel = createServerTests("/payload/xml/simpleModel", simpleModel);
Scenarios.Payload_Xml_ModelWithSimpleArrays = createServerTests(
  "/payload/xml/modelWithSimpleArrays",
  modelWithSimpleArrays,
);
Scenarios.Payload_Xml_ModelWithArrayOfModel = createServerTests(
  "/payload/xml/modelWithArrayOfModel",
  modelWithArrayOfModel,
);
Scenarios.Payload_Xml_ModelWithOptionalField = createServerTests(
  "/payload/xml/modelWithOptionalField",
  modelWithOptionalField,
);
Scenarios.Payload_Xml_ModelWithAttributes = createServerTests("/payload/xml/modelWithAttributes", modelWithAttributes);
Scenarios.Payload_Xml_ModelWithUnwrappedArray = createServerTests(
  "/payload/xml/modelWithUnwrappedArray",
  modelWithUnwrappedArray,
);
Scenarios.Payload_Xml_ModelWithRenamedArrays = createServerTests(
  "/payload/xml/modelWithRenamedArrays",
  modelWithRenamedArrays,
);
Scenarios.Payload_Xml_ModelWithRenamedFields = createServerTests(
  "/payload/xml/modelWithRenamedFields",
  modelWithRenamedFields,
);
Scenarios.Payload_Xml_ModelWithEmptyArray = createServerTests("/payload/xml/modelWithEmptyArray", modelWithEmptyArray);
Scenarios.Payload_Xml_ModelWithText = createServerTests("/payload/xml/modelWithText", modelWithText);
Scenarios.Payload_Xml_ModelWithDictionary = createServerTests("/payload/xml/modelWithDictionary", modelWithDictionary);
Scenarios.Payload_Xml_ModelWithEncodedNames = createServerTests(
  "/payload/xml/modelWithEncodedNames",
  modelWithEncodedNames,
);
