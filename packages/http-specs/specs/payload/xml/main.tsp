import "@typespec/http";
import "@typespec/xml";
import "@typespec/spector";

using Http;
using Spector;
using TypeSpec.Xml;

/** Sends and receives bodies in XML format. */
@scenarioService("/payload/xml")
namespace Payload.Xml;

// ────────────────────────────────────────────────────────────────────────────
// Shared types
// ────────────────────────────────────────────────────────────────────────────

/** §1.1 — Contains fields of primitive types. */
model SimpleModel {
  name: string;
  age: int32;
}

@nsDeclarations
enum Namespaces {
  smp: "http://example.com/schema",
  ns2: "http://example.com/ns2",
}

/** Template for XML operations */
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

// ────────────────────────────────────────────────────────────────────────────
// §1 — Primitive properties
// ────────────────────────────────────────────────────────────────────────────

/** §1.1 — Operations for the SimpleModel type. */
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

/** §1.2 — Contains a scalar property with a custom XML name. */
model ModelWithRenamedProperty {
  @name("renamedTitle")
  title: string;

  author: string;
}

/** §1.2 — Operations for the ModelWithRenamedProperty type. */
@route("/modelWithRenamedProperty")
interface ModelWithRenamedPropertyValue
  extends XmlOperations<
      ModelWithRenamedProperty,
      """
        <ModelWithRenamedProperty>
          <renamedTitle>foo</renamedTitle>
          <author>bar</author>
        </ModelWithRenamedProperty>
        """
    > {}

/** §1.3, §2.3 — Contains fields of the same type that have different XML representation. */
@name("ModelWithRenamedFieldsSrc")
model ModelWithRenamedFields {
  @name("InputData") inputData: SimpleModel;
  @name("OutputData") outputData: SimpleModel;
}

/** §1.3, §2.3 — Operations for the ModelWithRenamedFields type. */
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

// ────────────────────────────────────────────────────────────────────────────
// §2 — Nested models
// ────────────────────────────────────────────────────────────────────────────

/** §2.1 — Contains a property that references another model. */
model ModelWithNestedModel {
  nested: SimpleModel;
}

/** §2.1 — Operations for the ModelWithNestedModel type. */
@route("/modelWithNestedModel")
interface ModelWithNestedModelValue
  extends XmlOperations<
      ModelWithNestedModel,
      """
        <ModelWithNestedModel>
          <nested>
            <name>foo</name>
            <age>123</age>
          </nested>
        </ModelWithNestedModel>
        """
    > {}

/** Author model with a custom XML name. */
@name("XmlAuthor")
model Author {
  name: string;
}

/** §2.2 — Contains a property whose type has @Xml.name. The property name takes precedence. */
model ModelWithRenamedNestedModel {
  author: Author;
}

/** §2.2 — Operations for the ModelWithRenamedNestedModel type. */
@route("/modelWithRenamedNestedModel")
interface ModelWithRenamedNestedModelValue
  extends XmlOperations<
      ModelWithRenamedNestedModel,
      """
        <ModelWithRenamedNestedModel>
          <author>
            <name>foo</name>
          </author>
        </ModelWithRenamedNestedModel>
        """
    > {}

// ────────────────────────────────────────────────────────────────────────────
// §3 — Array of primitive types
// ────────────────────────────────────────────────────────────────────────────

/** §3.1 — Contains fields of arrays of primitive types. */
model ModelWithSimpleArrays {
  colors: string[];
  counts: int32[];
}

/** §3.1 — Operations for the ModelWithSimpleArrays type. */
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

/** §3.2 — Contains fields of wrapped and unwrapped arrays of primitive types. */
model ModelWithUnwrappedArray {
  @unwrapped colors: string[];
  counts: int32[];
}

/** §3.2 — Operations for the ModelWithUnwrappedArray type. */
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

/** §3.3, §3.4 — Contains fields of wrapped and unwrapped arrays of primitive types that have different XML representations. */
model ModelWithRenamedArrays {
  @name("Colors") @unwrapped colors: string[];
  @name("Counts") counts: int32[];
}

/** §3.3, §3.4 — Operations for the ModelWithRenamedArrays type. */
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

/** Custom scalar with a custom XML item name. */
@name("ItemName")
scalar tag extends string;

/** §3.5 — Contains a wrapped primitive array with custom wrapper and item names. */
model ModelWithWrappedPrimitiveCustomItemNames {
  @name("ItemsTags")
  tags: tag[];
}

/** §3.5 — Operations for the ModelWithWrappedPrimitiveCustomItemNames type. */
@route("/modelWithWrappedPrimitiveCustomItemNames")
interface ModelWithWrappedPrimitiveCustomItemNamesValue
  extends XmlOperations<
      ModelWithWrappedPrimitiveCustomItemNames,
      """
        <ModelWithWrappedPrimitiveCustomItemNames>
          <ItemsTags>
            <ItemName>fiction</ItemName>
            <ItemName>classic</ItemName>
          </ItemsTags>
        </ModelWithWrappedPrimitiveCustomItemNames>
        """
    > {}

// ────────────────────────────────────────────────────────────────────────────
// §4 — Array of complex types
// ────────────────────────────────────────────────────────────────────────────

/** §4.1 — Contains an array of models. */
model ModelWithArrayOfModel {
  items: SimpleModel[];
}

/** §4.1 — Operations for the ModelWithArrayOfModel type. */
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

/** §4.2 — Contains an unwrapped array of models. */
model ModelWithUnwrappedModelArray {
  @unwrapped
  items: SimpleModel[];
}

/** §4.2 — Operations for the ModelWithUnwrappedModelArray type. */
@route("/modelWithUnwrappedModelArray")
interface ModelWithUnwrappedModelArrayValue
  extends XmlOperations<
      ModelWithUnwrappedModelArray,
      """
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
        """
    > {}

/** §4.3 — Contains a wrapped array of models with a custom wrapper name. */
model ModelWithRenamedWrappedModelArray {
  @name("AllItems")
  items: SimpleModel[];
}

/** §4.3 — Operations for the ModelWithRenamedWrappedModelArray type. */
@route("/modelWithRenamedWrappedModelArray")
interface ModelWithRenamedWrappedModelArrayValue
  extends XmlOperations<
      ModelWithRenamedWrappedModelArray,
      """
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
        """
    > {}

/** §4.4 — Contains an unwrapped array of models with a custom item name. */
model ModelWithRenamedUnwrappedModelArray {
  @name("ModelItem")
  @unwrapped
  items: SimpleModel[];
}

/** §4.4 — Operations for the ModelWithRenamedUnwrappedModelArray type. */
@route("/modelWithRenamedUnwrappedModelArray")
interface ModelWithRenamedUnwrappedModelArrayValue
  extends XmlOperations<
      ModelWithRenamedUnwrappedModelArray,
      """
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
        """
    > {}

/** Book model with a custom XML name. */
@name("XmlBook")
model Book {
  title: string;
}

/** §4.5 — Contains a wrapped array of models with custom wrapper and item names. */
model ModelWithRenamedWrappedAndItemModelArray {
  @name("AllBooks")
  books: Book[];
}

/** §4.5 — Operations for the ModelWithRenamedWrappedAndItemModelArray type. */
@route("/modelWithRenamedWrappedAndItemModelArray")
interface ModelWithRenamedWrappedAndItemModelArrayValue
  extends XmlOperations<
      ModelWithRenamedWrappedAndItemModelArray,
      """
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
        """
    > {}

// ────────────────────────────────────────────────────────────────────────────
// §5 — Attributes
// ────────────────────────────────────────────────────────────────────────────

/** §5.1 — Contains fields that are XML attributes. */
model ModelWithAttributes {
  @attribute id1: int32;
  @attribute id2: string;
  enabled: boolean;
}

/** §5.1 — Operations for the ModelWithAttributes type. */
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

/** §5.2 — Contains a renamed XML attribute. */
model ModelWithRenamedAttribute {
  @attribute
  @name("xml-id")
  id: int32;

  title: string;
  author: string;
}

/** §5.2 — Operations for the ModelWithRenamedAttribute type. */
@route("/modelWithRenamedAttribute")
interface ModelWithRenamedAttributeValue
  extends XmlOperations<
      ModelWithRenamedAttribute,
      """
        <ModelWithRenamedAttribute xml-id="123">
          <title>The Great Gatsby</title>
          <author>F. Scott Fitzgerald</author>
        </ModelWithRenamedAttribute>
        """
    > {}

// ────────────────────────────────────────────────────────────────────────────
// §6/§7 — Namespace and prefix
// ────────────────────────────────────────────────────────────────────────────

/** §6.1, §7.1 — Contains fields with XML namespace on the model. */
@ns(Namespaces.smp)
model ModelWithNamespace {
  id: int32;
  title: string;
}

/** §6.1, §7.1 — Operations for the ModelWithNamespace type. */
@route("/modelWithNamespace")
interface ModelWithNamespaceValue
  extends XmlOperations<
      ModelWithNamespace,
      """
        <smp:ModelWithNamespace xmlns:smp="http://example.com/schema">
          <id>123</id>
          <title>The Great Gatsby</title>
        </smp:ModelWithNamespace>
        """
    > {}

/** §6.2, §7.2 — Contains fields with different XML namespaces on individual properties. */
@ns(Namespaces.smp)
model ModelWithNamespaceOnProperties {
  id: int32;

  @ns(Namespaces.smp)
  title: string;

  @ns(Namespaces.ns2)
  author: string;
}

/** §6.2, §7.2 — Operations for the ModelWithNamespaceOnProperties type. */
@route("/modelWithNamespaceOnProperties")
interface ModelWithNamespaceOnPropertiesValue
  extends XmlOperations<
      ModelWithNamespaceOnProperties,
      """
        <smp:ModelWithNamespaceOnProperties xmlns:smp="http://example.com/schema" xmlns:ns2="http://example.com/ns2">
          <id>123</id>
          <smp:title>The Great Gatsby</smp:title>
          <ns2:author>F. Scott Fitzgerald</ns2:author>
        </smp:ModelWithNamespaceOnProperties>
        """
    > {}

// ────────────────────────────────────────────────────────────────────────────
// §8 — Text content
// ────────────────────────────────────────────────────────────────────────────

/** §8.1 — Contains an attribute and text. */
model ModelWithText {
  @attribute language: string;
  @unwrapped content: string;
}

/** §8.1 — Operations for the ModelWithText type. */
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

// ────────────────────────────────────────────────────────────────────────────
// Additional scenarios (not in the guide)
// ────────────────────────────────────────────────────────────────────────────

/** Contains an optional field. */
model ModelWithOptionalField {
  item: string;
  value?: int32;
}

/** Operations for the ModelWithOptionalField type. */
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

/** Contains an array of models that's supposed to be sent/received as an empty XML element. */
model ModelWithEmptyArray {
  items: SimpleModel[];
}

/** Operations for the ModelWithEmptyArray type. */
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

/** Contains a dictionary of key value pairs. */
model ModelWithDictionary {
  metadata: Record<string>;
}

/** Operations for the ModelWithDictionary type. */
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

/** Uses encodedName instead of Xml.Name which is functionally equivalent. */
@encodedName("application/xml", "ModelWithEncodedNamesSrc")
model ModelWithEncodedNames {
  @encodedName("application/xml", "SimpleModelData") modelData: SimpleModel;
  @encodedName("application/xml", "PossibleColors") colors: string[];
}

/** Operations for the ModelWithEncodedNames type. */
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

/** Status values for the model with enum. */
union Status {
  string,

  /** Pending status. */
  pending: "pending",

  /** Success status. */
  success: "success",

  /** Error status. */
  error: "error",
}

/** Contains a single property with an enum value. */
model ModelWithEnum {
  status: Status;
}

/** Operations for the ModelWithEnum type. */
@route("/modelWithEnum")
interface ModelWithEnumValue
  extends XmlOperations<
      ModelWithEnum,
      """
        <ModelWithEnum>
          <status>success</status>
        </ModelWithEnum>
        """
    > {}

/** Contains datetime properties with different encodings. */
model ModelWithDatetime {
  /** DateTime value with rfc3339 encoding. */
  @encode(DateTimeKnownEncoding.rfc3339)
  rfc3339: utcDateTime;

  /** DateTime value with rfc7231 encoding. */
  @encode(DateTimeKnownEncoding.rfc7231)
  rfc7231: utcDateTime;
}

/** Operations for the ModelWithDatetime type. */
@route("/modelWithDatetime")
interface ModelWithDatetimeValue
  extends XmlOperations<
      ModelWithDatetime,
      """
        <ModelWithDatetime>
          <rfc3339>2022-08-26T18:38:00.000Z</rfc3339>
          <rfc7231>Fri, 26 Aug 2022 14:38:00 GMT</rfc7231>
        </ModelWithDatetime>
        """
    > {}

/** An error response body in XML format. */
@error
model XmlError {
  @statusCode _: 400;
  @header("content-type") contentType: "application/xml";
  @body body: XmlErrorBody;
}

/** The body of an XML error response. */
model XmlErrorBody {
  message: string;
  code: int32;
}

/** Operations that return an error response in XML format. */
@route("/error")
interface XmlErrorValue {
  @scenario
  @scenarioDoc("""
    Expected error response body:
    ```xml
    <XmlErrorBody>
      <message>Something went wrong</message>
      <code>400</code>
    </XmlErrorBody>
    ```
    """)
  @get
  get(): {
    @header("content-type") contentType: "application/xml";
    @body body: SimpleModel;
  } | XmlError;
}
