// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class PropertyProviderTests
    {
        public PropertyProviderTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void TestSnakeCaseProperty()
        {
            InputModelProperty inputModelProperty = new InputModelProperty
            (
                "snake_case",
                "snake_case",
                "A property with snake_case name",
                new InputPrimitiveType(InputPrimitiveTypeKind.String, null),
                true,
                false,
                false);

            var property = new PropertyProvider(inputModelProperty);

            Assert.AreEqual("SnakeCase", property.Name);
            Assert.AreEqual("snake_case", property.WireInfo?.SerializedName);
            Assert.AreEqual("A property with snake_case name", property.Description.ToString());
        }

        [Test]
        public void TestPascalCaseProperty()
        {
            InputModelProperty inputModelProperty = new InputModelProperty
            (
                "PascalCase",
                "PascalCase",
                "A property with PascalCase name",
                new InputPrimitiveType(InputPrimitiveTypeKind.String, null),
                true,
                false,
                false);

            var property = new PropertyProvider(inputModelProperty);

            Assert.AreEqual("PascalCase", property.Name);
            Assert.AreEqual("PascalCase", property.WireInfo?.SerializedName);
            Assert.AreEqual("A property with PascalCase name", property.Description.ToString());
        }

        [Test]
        public void TestCamelCaseProperty()
        {
            InputModelProperty inputModelProperty = new InputModelProperty
            (
                "camelCase",
                "camelCase",
                "A property with camelCase name",
                new InputPrimitiveType(InputPrimitiveTypeKind.String, null),
                true,
                false,
                false);

            var property = new PropertyProvider(inputModelProperty);

            Assert.AreEqual("CamelCase", property.Name);
            Assert.AreEqual("camelCase", property.WireInfo?.SerializedName);
            Assert.AreEqual("A property with camelCase name", property.Description.ToString());
        }

        [Test]
        public void TestKebabCaseProperty()
        {
            InputModelProperty inputModelProperty = new InputModelProperty
            (
                "kebab-case",
                "kebab-case",
                "A property with kebab-case name",
                new InputPrimitiveType(InputPrimitiveTypeKind.String, null),
                    true,
                false,
                false);

            var property = new PropertyProvider(inputModelProperty);

            Assert.AreEqual("KebabCase", property.Name);
            Assert.AreEqual("kebab-case", property.WireInfo?.SerializedName);
            Assert.AreEqual("A property with kebab-case name", property.Description.ToString());
        }

        [TestCaseSource(nameof(CollectionPropertyTestCases))]
        public void CollectionProperty(CSharpType coreType, InputModelProperty collectionProperty, CSharpType expectedType)
        {
            var property = new PropertyProvider(collectionProperty);
            Assert.AreEqual(collectionProperty.Name.ToCleanName(), property.Name);
            Assert.AreEqual(expectedType, property.Type);

            // validate the parameter conversion
            var propertyAsParam = property.AsParameter;
            Assert.IsNotNull(propertyAsParam);
            Assert.AreEqual(collectionProperty.Name.ToVariableName(), propertyAsParam.Name);
            Assert.AreEqual(expectedType, propertyAsParam.Type);
        }

        private static IEnumerable<TestCaseData> CollectionPropertyTestCases()
        {
            // List<string> -> IReadOnlyList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                new InputModelProperty("readOnlyCollection", "readOnlyCollection", string.Empty,
                    new InputArrayType("List", "id", new InputPrimitiveType(InputPrimitiveTypeKind.String)),
                    true,
                    true,
                    false),
                new CSharpType(typeof(IReadOnlyList<>), typeof(string)));
            // Dictionary<string, int> -> IReadOnlyDictionary<string, int>
            yield return new TestCaseData(
                new CSharpType(typeof(IDictionary<,>), typeof(string), typeof(int)),
                new InputModelProperty("readOnlyDictionary", "readOnlyDictionary", string.Empty,
                    new InputDictionaryType("Dictionary", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.Int32)),
                    true,
                    true,
                    false),
                new CSharpType(typeof(IReadOnlyDictionary<,>), typeof(string), typeof(int)));
            // string -> string
            yield return new TestCaseData(
                new CSharpType(typeof(string)),
                new InputModelProperty("stringProperty", "stringProperty", string.Empty,
                    new InputPrimitiveType(InputPrimitiveTypeKind.String),
                    true,
                    true,
                    false),
                new CSharpType(typeof(string)));
        }
    }
}
