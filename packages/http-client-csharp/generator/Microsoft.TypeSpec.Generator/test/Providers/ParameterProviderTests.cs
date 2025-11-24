// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
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
            MockHelpers.LoadMockGenerator();

            var param = InputFactory.BodyParameter("name", InputPrimitiveType.String, scope: InputParameterScope.Spread);
            var paramProvider1 = CodeModelGenerator.Instance.TypeFactory.CreateParameter(param);
            var paramProvider2 = CodeModelGenerator.Instance.TypeFactory.CreateParameter(param);
            Assert.IsFalse(ReferenceEquals(paramProvider1, paramProvider2));
        }

        [TestCaseSource(nameof(ValueInputTypes))]
        public void ValueTypeHasNoValidation(InputType paramType)
        {
            MockHelpers.LoadMockGenerator();
            var inputType = InputFactory.BodyParameter("testParam", paramType, isRequired: true);
            var parameter = CodeModelGenerator.Instance.TypeFactory.CreateParameter(inputType);
            Assert.IsNotNull(parameter);
            Assert.AreEqual(ParameterValidationType.None, parameter!.Validation);
        }

        [Test]
        public void ValidateArrayHandling()
        {
            MockHelpers.LoadMockGenerator();
            var inputType = InputFactory.BodyParameter("testParam", InputFactory.Array(InputPrimitiveType.String), isRequired: true);
            var parameter = CodeModelGenerator.Instance.TypeFactory.CreateParameter(inputType);
            Assert.IsNotNull(parameter);
            Assert.IsTrue(parameter!.Type.Equals(typeof(IList<string>)));
            Assert.IsTrue(parameter.ToPublicInputParameter().Type.Equals(typeof(IEnumerable<string>)));
        }

        private static IEnumerable<InputType> ValueInputTypes()
        {
            yield return InputPrimitiveType.Int32;
            yield return InputPrimitiveType.Float32;
            yield return InputFactory.Int32Enum("inputEnum", [("foo", 1)], isExtensible: true);
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
            MockHelpers.LoadMockGenerator();
            var inputType = InputFactory.BodyParameter("testParam", InputPrimitiveType.Int32, isRequired: true);
            var parameter = CodeModelGenerator.Instance.TypeFactory.CreateParameter(inputType);
            Assert.IsNotNull(parameter);
            var publicParameter = parameter!.ToPublicInputParameter();

            Assert.AreEqual(parameter, publicParameter);
            Assert.AreEqual(parameter.Attributes, publicParameter.Attributes);
            Assert.AreEqual(parameter.DefaultValue, publicParameter.DefaultValue);
            Assert.AreEqual(parameter.Description, publicParameter.Description);
            Assert.AreEqual(parameter.Field, publicParameter.Field);
            Assert.AreEqual(parameter.InitializationValue, publicParameter.InitializationValue);
            Assert.AreEqual(parameter.IsOut, publicParameter.IsOut);
            Assert.AreEqual(parameter.IsRef, publicParameter.IsRef);
            Assert.AreEqual(parameter.IsParams, publicParameter.IsParams);
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
            MockHelpers.LoadMockGenerator();
            var inputType = InputFactory.BodyParameter("testParam", InputPrimitiveType.Int32, isRequired: true);
            var parameter = CodeModelGenerator.Instance.TypeFactory.CreateParameter(inputType);
            Assert.IsNotNull(parameter);
            var refParemeter = parameter!.WithRef();

            Assert.AreEqual(parameter, refParemeter);
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

        [Test]
        public void CanCallInvokeWithTypeArgs()
        {
            var expression = new ParameterProvider("someParam", $"", typeof(object));
            var invokeExpression = expression.Invoke("SomeMethod", [Int(1)], [typeof(string)]);

            Assert.IsNotNull(invokeExpression.TypeArguments);
            Assert.IsTrue(invokeExpression.TypeArguments![0].Equals(typeof(string)));
        }

        [TestCase(InputPrimitiveTypeKind.String, true, ParameterValidationType.AssertNotNullOrEmpty)]
        [TestCase(InputPrimitiveTypeKind.String, false, ParameterValidationType.None)]
        [TestCase(InputPrimitiveTypeKind.Int32, true, ParameterValidationType.None)]
        [TestCase(InputPrimitiveTypeKind.Int32, false, ParameterValidationType.None)]
        [TestCase(InputPrimitiveTypeKind.Url, true, ParameterValidationType.AssertNotNull)]
        [TestCase(InputPrimitiveTypeKind.Url, false, ParameterValidationType.None)]
        public void CorrectValidationIsAppliedToParameter(
            InputPrimitiveTypeKind primitiveType,
            bool isRequired,
            ParameterValidationType expectedValidation)
        {
            MockHelpers.LoadMockGenerator();
            var inputTypeInstance = InputFactory.BodyParameter("testParam", new InputPrimitiveType(primitiveType, "foo", "bar"), isRequired: isRequired);
            var parameter = CodeModelGenerator.Instance.TypeFactory.CreateParameter(inputTypeInstance);

            Assert.IsNotNull(parameter);
            Assert.AreEqual(expectedValidation, parameter!.Validation);
        }

        [TestCase("test-param", "testParam")]
        [TestCase("TestParam", "testParam")]
        [TestCase("test_param", "testParam")]
        [TestCase("test.param", "testParam")]
        [TestCase("test param", "testParam")]
        [TestCase("TESTPARAM", "testparam")]
        [TestCase("test-Param-Name", "testParamName")]
        [TestCase("Test_Param_Name", "testParamName")]
        [TestCase("123param", "_123param")]
        [TestCase("test123param", "test123param")]
        [TestCase("@param", "param")]
        [TestCase("$param", "param")]
        public void NameIsConvertedToValidCamelCaseIdentifier(string inputName, string expectedName)
        {
            MockHelpers.LoadMockGenerator();
            var inputParameter = InputFactory.BodyParameter(inputName, InputPrimitiveType.String, isRequired: true);
            var parameter = CodeModelGenerator.Instance.TypeFactory.CreateParameter(inputParameter);

            Assert.IsNotNull(parameter);
            Assert.AreEqual(expectedName, parameter!.Name);
        }

        [TestCase("test-param", "testParam")]
        [TestCase("TestParam", "testParam")]
        [TestCase("test_param", "testParam")]
        [TestCase("test.param", "testParam")]
        [TestCase("test param", "testParam")]
        [TestCase("TESTPARAM", "testparam")]
        [TestCase("test-Param-Name", "testParamName")]
        [TestCase("Test_Param_Name", "testParamName")]
        [TestCase("123param", "_123param")]
        [TestCase("test123param", "test123param")]
        [TestCase("@param", "param")]
        [TestCase("$param", "param")]
        public void NameIsConvertedToValidCamelCaseIdentifierPublicConstructor(string inputName, string expectedName)
        {
            MockHelpers.LoadMockGenerator();
            var parameter = new ParameterProvider(inputName, $"Description", new CSharpType(typeof(string)));

            Assert.IsNotNull(parameter);
            Assert.AreEqual(expectedName, parameter!.Name);
        }
    }
}
