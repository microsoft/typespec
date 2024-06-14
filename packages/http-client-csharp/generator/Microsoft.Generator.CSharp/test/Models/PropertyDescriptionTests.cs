// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using NUnit.Framework;
using System.Collections.Generic;
using System;
using System.Linq;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class PropertyDescriptionTests
    {
        // Validates that the property description string is constructed correctly based on the property type
        [TestCaseSource(nameof(BuildPropertyDescriptionTestCases))]
        public void BuildPropertyDescription(InputModelProperty inputModelProperty, CSharpType type)
        {
            IReadOnlyList<FormattableString> propertyDescription = PropertyDescriptionBuilder.BuildPropertyDescription(inputModelProperty, type, SerializationFormat.Default, false);
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

            IReadOnlyList<FormattableString> descriptions = PropertyDescriptionBuilder.GetUnionTypesDescriptions(unionItems);

            Assert.AreEqual(7, descriptions.Count);

            using var codeWriter = new CodeWriter();
            codeWriter.AppendXmlDocumentation($"<test>", $"</test>", descriptions);
            var actual = codeWriter.ToString(false);

            var expected = string.Join("\n",
                "/// <test>",
                "/// <description><see cref=\"bool\"/></description>",
                "/// <description><see cref=\"int\"/></description>",
                "/// <description><see cref=\"global::System.Collections.Generic.IDictionary{TKey,TValue}\"/> where <c>TKey</c> is of type <see cref=\"string\"/>, where <c>TValue</c> is of type <see cref=\"int\"/></description>",
                "/// <description>21</description>",
                "/// <description>\"test\"</description>",
                "/// <description>True</description>",
                $"/// <description>{dateTime}</description>",
                "/// </test>") + "\n";

            Assert.AreEqual(expected, actual);
        }

        public static IEnumerable<TestCaseData> BuildPropertyDescriptionTestCases
        {
            get
            {
                // list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputListType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false), false, false, false),
                    new CSharpType(typeof(IList<string>)));
                // list of binary data property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputListType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.Any, false), false, false), false, true, false),
                    new CSharpType(typeof(IReadOnlyList<BinaryData>)));
                // dictionary property with binary data value
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), new InputPrimitiveType(InputPrimitiveTypeKind.Any, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, BinaryData>)));
                // nullable dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>), true));
                // primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false, false),
                    new CSharpType(typeof(string)));
                // binary data property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputPrimitiveTypeKind.Any, false), false, true, false),
                    new CSharpType(typeof(BinaryData)));
            }
        }
    }
}
