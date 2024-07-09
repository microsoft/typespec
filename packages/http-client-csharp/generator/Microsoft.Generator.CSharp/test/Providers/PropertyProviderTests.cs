// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
            MockCodeModelPlugin.LoadMockPlugin();
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
    }
}
