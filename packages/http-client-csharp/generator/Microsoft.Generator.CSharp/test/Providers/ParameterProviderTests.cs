// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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

        [Test]
        public void ValidateArrayHandling()
        {
            MockHelpers.LoadMockPlugin();
            var inputType = InputFactory.Parameter("testParam", InputFactory.Array(InputPrimitiveType.String), isRequired: true);
            var parameter = CodeModelPlugin.Instance.TypeFactory.CreateParameter(inputType);
            Assert.IsTrue(parameter.Type.Equals(typeof(IList<string>)));
            Assert.IsTrue(parameter.ToPublicInputParameter().Type.Equals(typeof(IEnumerable<string>)));
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
               new ParameterProvider("name", $"Description", new CSharpType(typeof(string)), attributes: [new(new CSharpType(typeof(int)))]),
               new ParameterProvider("name1", $"Description", new CSharpType(typeof(string)), attributes: [new(new CSharpType(typeof(string)))]),
               false);
        }

        [Test]
        public void ToPublicInputParameterCopiesProperties()
        {
            MockHelpers.LoadMockPlugin();
            var inputType = InputFactory.Parameter("testParam", InputPrimitiveType.Int32, isRequired: true);
            var parameter = CodeModelPlugin.Instance.TypeFactory.CreateParameter(inputType);
            var publicParameter = parameter.ToPublicInputParameter();

            Assert.AreEqual(parameter.AsExpression, publicParameter.AsExpression);
            Assert.AreEqual(parameter.Attributes, publicParameter.Attributes);
            Assert.AreEqual(parameter.DefaultValue, publicParameter.DefaultValue);
            Assert.AreEqual(parameter.Description, publicParameter.Description);
            Assert.AreEqual(parameter.Field, publicParameter.Field);
            Assert.AreEqual(parameter.InitializationValue, publicParameter.InitializationValue);
            Assert.AreEqual(parameter.IsOut, publicParameter.IsOut);
            Assert.AreEqual(parameter.IsRef, publicParameter.IsRef);
            Assert.AreEqual(parameter.Location, publicParameter.Location);
            Assert.AreEqual(parameter.Name, publicParameter.Name);
            Assert.AreEqual(parameter.Property, publicParameter.Property);
            Assert.AreEqual(parameter.Validation, publicParameter.Validation);
            Assert.AreEqual(parameter.WireInfo, publicParameter.WireInfo);

            Assert.AreEqual(parameter.Type.InputType, publicParameter.Type);
        }

        [Test]
        public void WithRefCopiesProperties()
        {
            MockHelpers.LoadMockPlugin();
            var inputType = InputFactory.Parameter("testParam", InputPrimitiveType.Int32, isRequired: true);
            var parameter = CodeModelPlugin.Instance.TypeFactory.CreateParameter(inputType);
            var refParemeter = parameter.WithRef();

            Assert.AreEqual(parameter.AsExpression, refParemeter.AsExpression);
            Assert.AreEqual(parameter.Attributes, refParemeter.Attributes);
            Assert.AreEqual(parameter.DefaultValue, refParemeter.DefaultValue);
            Assert.AreEqual(parameter.Description, refParemeter.Description);
            Assert.AreEqual(parameter.Field, refParemeter.Field);
            Assert.AreEqual(parameter.InitializationValue, refParemeter.InitializationValue);
            Assert.AreEqual(parameter.Location, refParemeter.Location);
            Assert.AreEqual(parameter.Name, refParemeter.Name);
            Assert.AreEqual(parameter.Property, refParemeter.Property);
            Assert.AreEqual(parameter.Type.InputType, refParemeter.Type);
            Assert.AreEqual(parameter.Validation, refParemeter.Validation);
            Assert.AreEqual(parameter.WireInfo, refParemeter.WireInfo);

            Assert.AreEqual(false, refParemeter.IsOut);
            Assert.AreEqual(true, refParemeter.IsRef);
        }
    }
}
