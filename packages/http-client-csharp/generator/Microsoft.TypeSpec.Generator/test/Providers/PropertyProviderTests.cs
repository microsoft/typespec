// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class PropertyProviderTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestSnakeCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("snake_case", InputPrimitiveType.String, wireName: "snake_case", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("SnakeCase", property.Name);
            Assert.AreEqual("snake_case", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for snake_case", property.Description!.ToString());
        }

        [Test]
        public void TestPascalCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("PascalCase", InputPrimitiveType.String, wireName: "PascalCase", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("PascalCase", property.Name);
            Assert.AreEqual("PascalCase", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for PascalCase", property.Description!.ToString());
        }

        [Test]
        public void TestCamelCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("camelCase", InputPrimitiveType.String, wireName: "camelCase", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);
            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("CamelCase", property.Name);
            Assert.AreEqual("camelCase", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for camelCase", property.Description!.ToString());
        }

        [Test]
        public void TestKebabCaseProperty()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("kebab-case", InputPrimitiveType.String, wireName: "kebab-case", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());

            Assert.AreEqual("KebabCase", property.Name);
            Assert.AreEqual("kebab-case", property.WireInfo?.SerializedName);
            Assert.IsNotNull(property.Description);
            Assert.AreEqual("Description for kebab-case", property.Description!.ToString());
        }

        [TestCaseSource(nameof(CollectionPropertyTestCases))]
        public void CollectionProperty(CSharpType coreType, InputModelProperty collectionProperty, CSharpType expectedType)
        {
            InputFactory.Model("TestModel", properties: [collectionProperty]);
            var property = new PropertyProvider(collectionProperty, new TestTypeProvider());

            Assert.AreEqual(collectionProperty.Name.ToIdentifierName(), property.Name);
            Assert.AreEqual(expectedType, property.Type);

            // validate the parameter conversion
            var propertyAsParam = property.AsParameter;
            Assert.IsNotNull(propertyAsParam);
            Assert.AreEqual(collectionProperty.Name.ToVariableName(), propertyAsParam.Name);
            Assert.AreEqual(expectedType, propertyAsParam.Type);
        }

        [TestCaseSource(nameof(BodyHasSetterTestCases))]
        public void BodyHasSetterValidation(string name, InputModelType inputModel, bool expectedHasSetter, TypeSignatureModifiers? typeSignatureModifiers = null)
        {
            var collectionProperty = inputModel.Properties.Single();
            var property = new PropertyProvider(collectionProperty, new TestTypeProvider(declarationModifiers: typeSignatureModifiers));

            Assert.AreEqual(expectedHasSetter, property.Body.HasSetter);
        }

        [Test]
        public void AsParameterRespectsChangesToPropertyType()
        {
            InputModelProperty inputModelProperty = InputFactory.Property("prop", InputPrimitiveType.String, wireName: "prop", isRequired: true);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, new TestTypeProvider());
            property.Type = new CSharpType(typeof(int));
            var parameter = property.AsParameter;

            Assert.IsTrue(parameter.Type.Equals(typeof(int)));
        }

        [Test]
        public void TestSpecialWords()
        {
            var testTypeProvider = new TestTypeProvider();
            var inputPropertyName = testTypeProvider.Name;
            InputModelProperty inputModelProperty = InputFactory.Property(inputPropertyName, InputPrimitiveType.String);
            InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var property = new PropertyProvider(inputModelProperty, testTypeProvider);
            Assert.AreEqual(inputPropertyName.ToIdentifierName() + "Property", property.Name);
        }

        [Test]
        public void CanUpdatePropertyProvider()
        {
            var propertyProvider = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
                type: new CSharpType(typeof(string)),
                name: "name",
                body: new AutoPropertyBody(HasSetter: false),
                enclosingType: new TestTypeProvider());

            Assert.IsFalse(propertyProvider.Body.HasSetter);
            Assert.AreEqual("name", propertyProvider.Name);
            Assert.AreEqual("Gets the name.", propertyProvider.Description!.ToString());
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, propertyProvider.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(string)), propertyProvider.Type);

            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };

            propertyProvider.Update(
                modifiers: propertyProvider.Modifiers &~ MethodSignatureModifiers.Virtual,
                type: new CSharpType(typeof(int)),
                name: "newName",
                body: new AutoPropertyBody(HasSetter: true),
                enclosingType: new TestTypeProvider(),
                attributes: attributes);

            Assert.IsTrue(propertyProvider.Body.HasSetter);
            Assert.AreEqual("newName", propertyProvider.Name);
            // Even though description was not provided, it should still be recalculated
            Assert.AreEqual("Gets or sets the newName.", propertyProvider.Description!.ToString());
            Assert.AreEqual(MethodSignatureModifiers.Public, propertyProvider.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(int)), propertyProvider.Type);

            propertyProvider.Update(description: $"new description");
            Assert.AreEqual("new description", propertyProvider.Description.ToString());

            Assert.IsNotNull(propertyProvider.Attributes);
            Assert.AreEqual(attributes.Count, propertyProvider.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, propertyProvider.Attributes[i].Type);
                Assert.IsTrue(propertyProvider.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }
        }

        [Test]
        public void TestAttributes()
        {
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };
            var property = new PropertyProvider(
               description: null,
               modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual,
               type: new CSharpType(typeof(string)),
               name: "Name",
               body: new AutoPropertyBody(HasSetter: false),
               enclosingType: new TestTypeProvider(),
               attributes: attributes);

            Assert.IsNotNull(property.Attributes);
            Assert.AreEqual(attributes.Count, property.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, property.Attributes[i].Type);
                Assert.IsTrue(property.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            // validate the attributes are written correctly
            using var writer = new CodeWriter();
            writer.WriteProperty(property);
            var expectedPropertyString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "public virtual string Name { get; }\n";
            Assert.AreEqual(expectedPropertyString, writer.ToString(false));
        }

        private static IEnumerable<TestCaseData> CollectionPropertyTestCases()
        {
            // List<string> -> IReadOnlyList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                InputFactory.Property("readOnlyCollection", InputFactory.Array(InputPrimitiveType.String), isRequired: true, isReadOnly: true),
                new CSharpType(typeof(IReadOnlyList<>), typeof(string)));
            // List<string> -> IList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                InputFactory.Property("Collection", InputFactory.Array(InputPrimitiveType.String), isRequired: true, isReadOnly: false),
                new CSharpType(typeof(IList<>), typeof(string)));
            // Dictionary<string, int> -> IReadOnlyDictionary<string, int>
            yield return new TestCaseData(
                new CSharpType(typeof(IDictionary<,>), typeof(string), typeof(int)),
                InputFactory.Property("readOnlyDictionary", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true, isReadOnly: true),
                new CSharpType(typeof(IReadOnlyDictionary<,>), typeof(string), typeof(int)));
            // string -> string
            yield return new TestCaseData(
                new CSharpType(typeof(string)),
                InputFactory.Property("stringProperty", InputPrimitiveType.String, isRequired: true, isReadOnly: true),
                new CSharpType(typeof(string)));
        }

        private static IEnumerable<TestCaseData> BodyHasSetterTestCases()
        {
            yield return new TestCaseData(
                "readOnlyString",
                InputFactory.Model("TestModel", properties: [InputFactory.Property("readOnlyString", InputPrimitiveType.String, isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyStringOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("readOnlyString", InputPrimitiveType.Int32, isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "intOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: false)]),
                true,
                null);
            yield return new TestCaseData(
                "intOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: false)]),
                false,
                null);
            yield return new TestCaseData(
                "intOnNoUsageModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.None, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: false)]),
                false,
                null);
            yield return new TestCaseData(
                "requiredIntOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("intProperty", InputPrimitiveType.Int32, isRequired: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyCollectionOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("readOnlyCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyCollectionOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties: [InputFactory.Property("readOnlyCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: true)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableCollectionOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableCollectionOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nullableCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableCollectionOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableCollection", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                true,
                null);
            yield return new TestCaseData(
                "readOnlyDictionaryOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("readOnlyDictionary", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true)]),
                false,
                null);
            yield return new TestCaseData(
                "readOnlyDictionaryOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output | InputModelTypeUsage.Input, properties: [InputFactory.Property("readOnlyDictionary", InputFactory.Dictionary(InputPrimitiveType.Int32), isRequired: true)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableDictionaryOnOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableDictionary", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableDictionaryOnInputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nullableDictionary", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                false,
                null);
            yield return new TestCaseData(
                "nullableDictionaryOnInputOutputModel",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output, properties: [InputFactory.Property("nullableDictionary", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)), isRequired: true, isReadOnly: false)]),
                true,
                null);
            yield return new TestCaseData(
                "nonReadOnlyStringPropOnStruct",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nonReadOnlyString", InputPrimitiveType.String)], modelAsStruct: true),
                true,
                TypeSignatureModifiers.Struct);
            yield return new TestCaseData(
                "requiredReadOnlyStringPropOnStruct",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("readOnlyString", InputPrimitiveType.String, isReadOnly: true, isRequired: true)], modelAsStruct: true),
                false,
                TypeSignatureModifiers.Struct);
            yield return new TestCaseData(
                "propInReadOnlyStruct",
                InputFactory.Model("TestModel", usage: InputModelTypeUsage.Input, properties: [InputFactory.Property("nonReadOnlyString", InputPrimitiveType.String)], modelAsStruct: true),
                false,
                TypeSignatureModifiers.Struct | TypeSignatureModifiers.ReadOnly);
        }
    }
}
