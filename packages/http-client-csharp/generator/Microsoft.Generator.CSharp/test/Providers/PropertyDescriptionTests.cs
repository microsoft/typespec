// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    internal class PropertyDescriptionTests
    {
        private static InputModelType _enclosingType = new InputModelType(
            "enclosingType",
            "enclosingType",
            "public",
            null,
            null,
            InputModelTypeUsage.Input,
            [],
            null,
            [],
            null,
            null,
            new Dictionary<string, InputModelType>(),
            null,
            false);

        // Validates that the property description string is constructed correctly based on the property type
        [TestCaseSource(nameof(BuildPropertyDescriptionTestCases))]
        public void BuildPropertyDescription(InputModelProperty inputModelProperty, CSharpType type)
        {
            var propertySummaryStatement = PropertyDescriptionBuilder.BuildPropertyDescription(inputModelProperty, type, SerializationFormat.Default, PropertyDescriptionBuilder.CreateDefaultPropertyDescription(inputModelProperty.Name, false));
            using CodeWriter codeWriter = new CodeWriter();
            propertySummaryStatement.Write(codeWriter);
            string propertyDescription = codeWriter.ToString(false);
            var propertyDescriptionString = string.Join(Environment.NewLine, propertyDescription);
            Assert.IsNotNull(propertyDescription);
            Assert.IsNotEmpty(propertyDescriptionString);

            if (type.ContainsBinaryData)
            {
                Assert.IsTrue(propertyDescriptionString.Contains("Examples:"));
            }
        }

        // Validates that the summary description string is constructed correctly for several types
        [Test]
        public void TestGetUnionTypesDescriptions()
        {
            var dateTime = new DateTimeOffset(1, 2, 3, 4, 5, 6, TimeSpan.Zero);
            var expected = Helpers.GetExpectedFromFile();

            var unionItems = new List<CSharpType>
            {
                new CSharpType(typeof(bool), false),
                new CSharpType(typeof(int), false),
                new CSharpType(typeof(IDictionary<,>), false, typeof(string), new CSharpType(typeof(int))),
                CSharpType.FromLiteral(new CSharpType(typeof(int), false), 21),
                CSharpType.FromLiteral(new CSharpType(typeof(string), false), "test"),
                CSharpType.FromLiteral(new CSharpType(typeof(bool), false), true),
                CSharpType.FromLiteral(new CSharpType(typeof(DateTimeOffset), false), dateTime)
            };

            IReadOnlyList<XmlDocStatement> descriptions = PropertyDescriptionBuilder.GetUnionTypesDescriptions(unionItems);

            Assert.AreEqual(7, descriptions.Count);

            using var codeWriter = new CodeWriter();
            var xmlDoc = new XmlDocStatement("test", [], innerStatements: [.. descriptions]);
            xmlDoc.Write(codeWriter);
            var actual = codeWriter.ToString(false);

            Assert.AreEqual(expected, actual);
        }

        public static IEnumerable<TestCaseData> BuildPropertyDescriptionTestCases
        {
            get
            {
                // list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputArrayType("mockProp", "TypeSpec.Array", InputPrimitiveType.String), false, false, false, _enclosingType),
                    new CSharpType(typeof(IList<string>)));
                // list of binary data property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputArrayType("mockProp", "TypeSpec.Array", InputPrimitiveType.Any), false, true, false, _enclosingType),
                    new CSharpType(typeof(IReadOnlyList<BinaryData>)));
                // dictionary property with binary data value
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", InputPrimitiveType.String, InputPrimitiveType.Any), false, false, false, _enclosingType),
                    new CSharpType(typeof(IDictionary<string, BinaryData>)));
                // nullable dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", InputPrimitiveType.String, InputPrimitiveType.String), false, false, false, _enclosingType),
                    new CSharpType(typeof(IDictionary<string, string>), true));
                // primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", InputPrimitiveType.String, false, false, false, _enclosingType),
                    new CSharpType(typeof(string)));
                // binary data property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", InputPrimitiveType.Any, false, true, false, _enclosingType),
                    new CSharpType(typeof(BinaryData)));
            }
        }
    }
}
