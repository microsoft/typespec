// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ParameterProviderTests
    {
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

        [Test]
        public void NotSameInstance()
        {
            MockHelpers.LoadMockPlugin();

            var param = InputFactory.Parameter("name", InputPrimitiveType.String, kind: InputOperationParameterKind.Spread);
            var paramProvider1 = CodeModelPlugin.Instance.TypeFactory.CreateParameter(param);
            var paramProvider2 = CodeModelPlugin.Instance.TypeFactory.CreateParameter(param);
            Assert.IsFalse(ReferenceEquals(paramProvider1, paramProvider2));
        }

        [TestCaseSource(nameof(ValueInputTypes))]
        public void ValueTypeHasNoValidation(InputType paramType)
        {
            MockHelpers.LoadMockPlugin();
            var inputType = InputFactory.Parameter("testParam", paramType, isRequired: true);
            var parameter = CodeModelPlugin.Instance.TypeFactory.CreateParameter(inputType);
            Assert.AreEqual(ParameterValidationType.None, parameter.Validation);
        }

        private static IEnumerable<InputType> ValueInputTypes()
        {
            yield return InputPrimitiveType.Int32;
            yield return InputPrimitiveType.Float32;
            yield return InputFactory.Enum("inputEnum", InputPrimitiveType.Int32, isExtensible: true, values: [InputFactory.EnumMember.Int32("foo", 1)]);
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

        [Test]
        public void ToPublicInputParameterUsesSameExpression()
        {
            MockHelpers.LoadMockPlugin();
            var inputType = InputFactory.Parameter("testParam", InputPrimitiveType.Int32, isRequired: true);
            var parameter = CodeModelPlugin.Instance.TypeFactory.CreateParameter(inputType);
            var expected = parameter.AsExpression;
            var publicParameter = parameter.ToPublicInputParameter();
            Assert.AreEqual(expected, publicParameter.AsExpression);
        }
    }
}
