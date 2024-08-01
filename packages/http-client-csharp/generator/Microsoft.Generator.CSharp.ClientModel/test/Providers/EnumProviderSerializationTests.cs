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

        private static object[] ValidateTypes()
        {
            var intValues = new List<InputEnumTypeValue>
            {
                new InputEnumTypeValue("One", 1, null),
                new InputEnumTypeValue("Two", 2, null)
            };
            var intType = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.Input | InputModelTypeUsage.Output, InputPrimitiveType.Int32, intValues, false);

            var floatValues = new List<InputEnumTypeValue>
            {
                new InputEnumTypeValue("One", 1f, null),
                new InputEnumTypeValue("Two", 2f, null)
            };
            var floatType = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.Input | InputModelTypeUsage.Output, InputPrimitiveType.Float32, floatValues, false);

            var stringValues = new List<InputEnumTypeValue>
            {
                new InputEnumTypeValue("One", "1", null),
                new InputEnumTypeValue("Two", "2", null)
            };
            var stringType = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.Input | InputModelTypeUsage.Output, InputPrimitiveType.String, stringValues, false);

            return [intType, floatType, stringType];
        }

        [TestCaseSource(nameof(ValidateTypes))]
        public void ValidateToEnumMethods(InputEnumType inputEnum)
        {
            TypeProvider enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            var serialization = enumType.SerializationProviders.FirstOrDefault();
            MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("Enum")).FirstOrDefault();
            // Cast method.BodyExpression to SwitchCaseExpression
            if (method!.BodyStatements is MethodBodyStatements methodBodyStatements)
            {
                // Verify that there are the correct number of cases (values + 1 for throw)
                Assert.AreEqual(3, methodBodyStatements.Statements.Count());
            }
        }

        [TestCaseSource(nameof(ValidateTypes))]
        public void ValidateToSerialMethods(InputEnumType inputEnum)
        {
            TypeProvider enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            var serialization = enumType.SerializationProviders.FirstOrDefault();
            MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("ToSerial")).FirstOrDefault();
            if (inputEnum.ValueType == InputPrimitiveType.Int32)
            {
                Assert.IsNull(method);
            }
            else
            {
                // Cast method.BodyExpression to SwitchCaseExpression
                if (method!.BodyExpression is SwitchExpression switchExpression)
                {
                    // Verify that the switch case expression has the correct number of cases (values + 1 for throw)
                    Assert.AreEqual(3, switchExpression.Cases.Count());

                    // Third case should be a throw
                    var caseExpression = switchExpression.Cases[2].Expression as KeywordExpression;
                    Assert.IsNotNull(caseExpression);
                    Assert.AreEqual("throw", caseExpression!.Keyword);
                    Assert.IsTrue(caseExpression!.Expression!.ToString().Contains("ArgumentOutOfRangeException"));
                }
            }
        }
    }
}
