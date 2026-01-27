import "@typespec/http";
import "@typespec/xml";

using Http;
using TypeSpec.Xml;

@doc("Sends and receives bodies in XML format.")
@service(#{ title: "hello world" })
@doc("This is a sample typespec project.")
@server(
  "{sampleTypeSpecUrl}",
  "Endpoint Service",
  {
    sampleTypeSpecUrl: url,
  }
)
namespace Payload.Xml;

@nsDeclarations
enum XmlNamespaces {
  ns1: "https://example.com/ns1",
  ns2: "https://example.com/ns2",
}

@doc("Contains fields of primitive types.")
@ns("http://www.contoso.com/books.dtd", "mymodel")
model ModelWithNs {
  @attribute
  @ns(XmlNamespaces.ns1)
  name: string;

  @ns(XmlNamespaces.ns2)
  age: int32;

  @ns("http://www.contoso.com/anotherbook.dtd", "foo")
  items: string[];

  @ns("http://www.contoso.com/anothermodel.dtd", "bar")
  anotherModel: SimpleModel;

  moreModels: AnotherModelWithNs[];

  @unwrapped
  unwrappedModels: AnotherModelWithNs[];
}

@ns("http://www.example.com/namespace", "ns1")
model AnotherModelWithNs {
  foo: string;
}

@ns("http://www.example.com/namespace", "newNs")
model ExtendingModelWithNs extends AnotherModelWithNs {
  bar: int32;
}


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

@doc("An error response body in XML format.")
@error
model XmlError {
  @statusCode _: 400;
  @header("content-type") contentType: "application/xml";
  @body body: XmlErrorBody;
}

@doc("The body of an XML error response.")
model XmlErrorBody {
  message: string;
  code: int32;
}

@doc("Template for XML operations")
interface XmlOperations<TModel, TDoc extends valueof string> {
  @get
  get(): {
    @header("content-type") contentType: "application/xml";
    @body body: TModel;
  };

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

@doc("Operations for the ModelWithNs type.")
@route("/modelWithNs")
interface ModelWithNsValue
  extends XmlOperations<
      ModelWithNs,
      """
        <ModelWithNs xmlns:mymodel="http://www.contoso.com/books.dtd>
          <name>foo</name>
          <age>123</age>
        </ModelWithNs>
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

@doc("Operations that return an error response in XML format.")
@route("/error")
interface XmlErrorValue {
  @get
  get(): {
    @header("content-type") contentType: "application/xml";
    @body body: SimpleModel;
  } | XmlError;
}
