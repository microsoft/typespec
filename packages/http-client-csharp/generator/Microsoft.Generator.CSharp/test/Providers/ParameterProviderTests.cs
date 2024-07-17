// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ParameterProviderTests
    {
        [OneTimeSetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void Equals_SameInstance_ReturnsTrue()
        {
            // Arrange
            var parameter = new ParameterProvider("name", $"Description", new CSharpType(typeof(string)));

            // Act
            var result = parameter.Equals(parameter);

            // Assert
            Assert.True(result);
        }

        [TestCaseSource(nameof(NotEqualsTestCases))]
        public void Equals(ParameterProvider p1, ParameterProvider? p2, bool areEqual)
        {
            var result = p1.Equals(p2);
            Assert.AreEqual(areEqual, result);
        }

        [TestCaseSource(nameof(InitializationValueTestCases))]
        public void InitializationValue(InputParameter inputParameter, bool isCollectionType)
        {
            var provider = new ParameterProvider(inputParameter);
            var parsedValue = inputParameter.DefaultValue?.Value;

            if (parsedValue?.GetType() == typeof(object))
            {
                Assert.IsNull(provider.InitializationValue);
            }
            else if (isCollectionType)
            {
                CSharpType valueType = CodeModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParameter.DefaultValue!.Type);
                Assert.AreEqual(New.Instance(valueType), provider.InitializationValue);
            }
            else
            {
                Assert.AreEqual(Literal(parsedValue), provider.InitializationValue);
            }
        }

        private static IEnumerable<TestCaseData> NotEqualsTestCases()
        {
            yield return new TestCaseData(
                new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
                null,
                false);
            yield return new TestCaseData(
                new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
                new ParameterProvider("name", $"Description", new CSharpType(typeof(int))),
                false);
            yield return new TestCaseData(
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
               true);
            yield return new TestCaseData(
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string))),
               new ParameterProvider("name1", $"Description", new CSharpType(typeof(string))),
               false);
            yield return new TestCaseData(
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string)), attributes: [new(new CSharpType(typeof(int)), [])]),
               new ParameterProvider("name1", $"Description", new CSharpType(typeof(string)), attributes: [new(new CSharpType(typeof(string)), [])]),
               false);
        }

        private static IEnumerable<TestCaseData> InitializationValueTestCases()
        {
            // int primitive type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    new InputPrimitiveType(InputPrimitiveTypeKind.Int32),
                    RequestLocation.None,
                    defaultValue: new InputConstant(1, InputPrimitiveType.Int32),
                    InputOperationParameterKind.Client,
                    isRequired: true, false, false, false, false, false, false, null, null), false);
            // string primitive type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    new InputPrimitiveType(InputPrimitiveTypeKind.String),
                    RequestLocation.None,
                    defaultValue: new InputConstant("mockValue", InputPrimitiveType.String),
                    InputOperationParameterKind.Client,
                    isRequired: true, false, false, false, false, false, false, null, null), false);
            // char primitive type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    new InputPrimitiveType(InputPrimitiveTypeKind.Char),
                    RequestLocation.None,
                    defaultValue: new InputConstant('a', InputPrimitiveType.Char),
                    InputOperationParameterKind.Client,
                    isRequired: true, false, false, false, false, false, false, null, null), false);
            // bool primitive type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    new InputPrimitiveType(InputPrimitiveTypeKind.Boolean),
                    RequestLocation.None,
                    defaultValue: new InputConstant(true, InputPrimitiveType.Boolean),
                    InputOperationParameterKind.Client,
                    isRequired: true, false, false, false, false, false, false, null, null), false);
            // list of string type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    new InputArrayType("test", "test", new InputPrimitiveType(InputPrimitiveTypeKind.String)),
                    RequestLocation.None,
                    defaultValue: new InputConstant(null, new InputArrayType("test", "test", new InputPrimitiveType(InputPrimitiveTypeKind.String))),
                    InputOperationParameterKind.Client,
                    isRequired: true, false, false, false, false, false, false, null, null), true);
            // unknown type
            yield return new TestCaseData(
                new InputParameter(
                    "param",
                    "param description",
                    "param",
                    new InputPrimitiveType(InputPrimitiveTypeKind.Any),
                    RequestLocation.None,
                    defaultValue: new InputConstant(new object(), new InputPrimitiveType(InputPrimitiveTypeKind.Any)),
                    InputOperationParameterKind.Client,
                    isRequired: true, false, false, false, false, false, false, null, null), false);
        }
    }
}
