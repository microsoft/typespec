import "@typespec/http";
import "@typespec/xml";
import "@typespec/spector";

using Http;
using Spector;
using TypeSpec.Xml;

@doc("Sends and receives bodies in XML format.")
@scenarioService("/payload/xml")
namespace Payload.Xml;

@doc("Contains fields of primitive types.")
model SimpleModel {
  name: string;
  age: int32;
}

@doc("Contains fields of arrays of primitive types.")
model ModelWithSimpleArrays {
  colors: string[];
  counts: int32[];
}

@doc("Contains an array of models.")
model ModelWithArrayOfModel {
  items: SimpleModel[];
}

@doc("Contains an optional field.")
model ModelWithOptionalField {
  item: string;
  value?: int32;
}

@doc("Contains fields that are XML attributes.")
model ModelWithAttributes {
  @attribute id1: int32;
  @attribute id2: string;
  enabled: boolean;
}

@doc("Contains fields of wrapped and unwrapped arrays of primitive types.")
model ModelWithUnwrappedArray {
  @unwrapped colors: string[];
  counts: int32[];
}

@doc("Contains fields of wrapped and unwrapped arrays of primitive types that have different XML representations.")
model ModelWithRenamedArrays {
  @name("Colors") @unwrapped colors: string[];
  @name("Counts") counts: int32[];
}

@doc("Contains fields of the same type that have different XML representation.")
@name("ModelWithRenamedFieldsSrc")
model ModelWithRenamedFields {
  @name("InputData") inputData: SimpleModel;
  @name("OutputData") outputData: SimpleModel;
}

@doc("Contains an array of models that's supposed to be sent/received as an empty XML element.")
model ModelWithEmptyArray {
  items: SimpleModel[];
}

@doc("Contains an attribute and text.")
model ModelWithText {
  @attribute language: string;
  @unwrapped content: string;
}

@doc("Contains a dictionary of key value pairs.")
model ModelWithDictionary {
  metadata: Record<string>;
}

@doc("Uses encodedName instead of Xml.Name which is functionally equivalent.")
@encodedName("application/xml", "ModelWithEncodedNamesSrc")
model ModelWithEncodedNames {
  @encodedName("application/xml", "SimpleModelData") modelData: SimpleModel;
  @encodedName("application/xml", "PossibleColors") colors: string[];
}

@doc("Template for XML operations")
interface XmlOperations<TModel, TDoc extends valueof string> {
  @scenario
  @scenarioDoc("""
    Expected response body:
    ```xml
    ${TDoc}
    ```
    """)
  @get
  get(): {
    @header("content-type") contentType: "application/xml";
    @body body: TModel;
  };

  @scenario
  @scenarioDoc("""
    Expected request body:
    ```xml
    ${TDoc}
    ```
    """)
  @put
  put(@header("content-type") contentType: "application/xml", @body input: TModel): void;
}

@doc("Operations for the SimpleModel type.")
@route("/simpleModel")
interface SimpleModelValue
  extends XmlOperations<
      SimpleModel,
      """
        <SimpleModel>
          <name>foo</name>
          <age>123</age>
        </SimpleModel>
        """
    > {}

@doc("Operations for the ModelWithSimpleArrays type.")
@route("/modelWithSimpleArrays")
interface ModelWithSimpleArraysValue
  extends XmlOperations<
      ModelWithSimpleArrays,
      """
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
        """
    > {}

@doc("Operations for the ModelWithArrayOfModel type.")
@route("/modelWithArrayOfModel")
interface ModelWithArrayOfModelValue
  extends XmlOperations<
      ModelWithArrayOfModel,
      """
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
        """
    > {}

@doc("Operations for the ModelWithOptionalField type.")
@route("/modelWithOptionalField")
interface ModelWithOptionalFieldValue
  extends XmlOperations<
      ModelWithOptionalField,
      """
        <ModelWithOptionalField>
          <item>widget</item>
        </ModelWithOptionalField>
        """
    > {}

@doc("Operations for the ModelWithAttributes type.")
@route("/modelWithAttributes")
interface ModelWithAttributesValue
  extends XmlOperations<
      ModelWithAttributes,
      """
        <ModelWithAttributes id1="123" id2="foo">
          <enabled>true</enabled>
        </ModelWithAttributes>
        """
    > {}

@doc("Operations for the ModelWithUnwrappedArray type.")
@route("/modelWithUnwrappedArray")
interface ModelWithUnwrappedArrayValue
  extends XmlOperations<
      ModelWithUnwrappedArray,
      """
        <ModelWithUnwrappedArray>
          <colors>red</colors>
          <colors>green</colors>
          <colors>blue</colors>
          <counts>
            <int32>1</int32>
            <int32>2</int32>
          </counts>
        </ModelWithUnwrappedArray>
        """
    > {}

@doc("Operations for the ModelWithRenamedArrays type.")
@route("/modelWithRenamedArrays")
interface ModelWithRenamedArraysValue
  extends XmlOperations<
      ModelWithRenamedArrays,
      """
        <ModelWithRenamedArrays>
          <Colors>red</Colors>
          <Colors>green</Colors>
          <Colors>blue</Colors>
          <Counts>
            <int32>1</int32>
            <int32>2</int32>
          </Counts>
        </ModelWithRenamedArrays>
        """
    > {}

@doc("Operations for the ModelWithRenamedFields type.")
@route("/modelWithRenamedFields")
interface ModelWithRenamedFieldsValue
  extends XmlOperations<
      ModelWithRenamedFields,
      """
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
        """
    > {}

@doc("Operations for the ModelWithEmptyArray type.")
@route("/modelWithEmptyArray")
interface ModelWithEmptyArrayValue
  extends XmlOperations<
      ModelWithEmptyArray,
      """
        <ModelWithEmptyArray>
          <items />
        </ModelWithEmptyArray>
        """
    > {}

@doc("Operations for the ModelWithText type.")
@route("/modelWithText")
interface ModelWithTextValue
  extends XmlOperations<
      ModelWithText,
      """
        <ModelWithText language="foo">
          This is some text.
        </ModelWithText>
        """
    > {}

@doc("Operations for the ModelWithDictionary type.")
@route("/modelWithDictionary")
interface ModelWithDictionaryValue
  extends XmlOperations<
      ModelWithDictionary,
      """
        <ModelWithDictionary>
          <metadata>
            <Color>blue</Color>
            <Count>123</Count>
            <Enabled>false</Enabled>
          </metadata>
        </ModelWithDictionary>
        """
    > {}

@doc("Operations for the ModelWithEncodedNames type.")
@route("/modelWithEncodedNames")
interface ModelWithEncodedNamesValue
  extends XmlOperations<
      ModelWithEncodedNames,
      """
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
        """
    > {}
