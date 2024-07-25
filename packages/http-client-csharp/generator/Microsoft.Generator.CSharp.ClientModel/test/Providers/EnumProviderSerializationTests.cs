// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
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

        private TypeProvider? CreateEnumSerializationProvider(string a, int b, string c, int d)
        {
            IReadOnlyList<InputEnumTypeValue> values = new List<InputEnumTypeValue>
            {
                new InputEnumTypeValue(a, b, null),
                new InputEnumTypeValue(c, d, null)
            };
            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Int32), values, false);
            TypeProvider enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(input);
            return enumType.SerializationProviders.FirstOrDefault();
        }

        [TestCaseSource(nameof(ValidateTestCases))]
        public void ValidateToSerial(string a, int b, string c, int d)
        {
            var serialization = CreateEnumSerializationProvider(a, b, c, d);
            MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("ToSerial")).FirstOrDefault();
            // Cast method.BodyExpression to SwitchCaseExpression
            if (method!.BodyExpression is SwitchExpression switchExpression)
            {
                // Verify that the switch case expression has the correct number of cases (values + 1 for throw)
                Assert.AreEqual(3, switchExpression.Cases.Count());
                Assert.IsTrue(switchExpression.Cases[2].Expression.ToString().Contains("ArgumentOutOfRangeException"));
            }
        }

        [TestCaseSource(nameof(ValidateTestCases))]
        public void ValidateToEnum(string a, int b, string c, int d)
        {
            var serialization = CreateEnumSerializationProvider(a, b, c, d);
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
