// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Input.InputTypes;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class EnumProviderSerializationTests
    {
        [OneTimeSetUp]
        public void Setup()
        {
            MockHelpers.LoadMockPlugin();
        }

        public static object[] ValidateTestCases =
        {
            new object[] {"One", 1, "Two", 2}
        };

        private TypeProvider? CreateEnumSerializationProvider(string stringA, int intA, string stringB, int intB)
        {
            IReadOnlyList<InputEnumTypeValue> values = new List<InputEnumTypeValue>
            {
                new InputEnumTypeValue(stringA, intA, null),
                new InputEnumTypeValue(stringB, intB, null)
            };
            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.Input | InputModelTypeUsage.Output, InputPrimitiveType.Int32, values, false, []);
            TypeProvider? enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(input);
            return enumType!.SerializationProviders.FirstOrDefault();
        }

        [TestCaseSource(nameof(ValidateTestCases))]
        public void ValidateToSerial(string stringA, int intA, string stringB, int intB)
        {
            var serialization = CreateEnumSerializationProvider(stringA, intA, stringB, intB);
            MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("ToSerial")).FirstOrDefault();
            // Cast method.BodyExpression to SwitchCaseExpression
            Assert.IsNull(method);
        }

        [TestCaseSource(nameof(ValidateTestCases))]
        public void ValidateToEnum(string stringA, int intA, string stringB, int intB)
        {
            var serialization = CreateEnumSerializationProvider(stringA, intA, stringB, intB);
            MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("Enum")).FirstOrDefault();
            // Cast method.BodyExpression to SwitchCaseExpression
            if (method!.BodyStatements is MethodBodyStatements methodBodyStatements)
            {
                // Verify that the switch case expression has the correct number of cases (values + 1 for throw)
                Assert.AreEqual(3, methodBodyStatements.Statements.Count());
            }
        }
    }
}
