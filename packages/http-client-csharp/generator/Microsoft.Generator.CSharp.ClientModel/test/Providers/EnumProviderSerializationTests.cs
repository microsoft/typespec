// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
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

        private static object[] ValidateTypes(bool isExtensible)
        {
            var intValues = new List<InputEnumTypeValue>
            {
                InputFactory.EnumMember.Int32("One", 1),
                InputFactory.EnumMember.Int32("Two", 2)
            };
            var intType = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Int32, isExtensible: isExtensible, values: intValues);

            var floatValues = new List<InputEnumTypeValue>
            {
                InputFactory.EnumMember.Float32("One", 1f),
                InputFactory.EnumMember.Float32("Two", 2f)
            };
            var floatType = InputFactory.Enum("mockInputEnum", InputPrimitiveType.Float32, isExtensible: isExtensible, values: floatValues);

            var stringValues = new List<InputEnumTypeValue>
            {
                InputFactory.EnumMember.String("One", "1"),
                InputFactory.EnumMember.String("Two", "2")
            };
            var stringType = InputFactory.Enum("mockInputEnum", InputPrimitiveType.String, isExtensible: isExtensible, values: stringValues);

            return [intType, floatType, stringType];
        }

        [TestCaseSource(nameof(ValidateTypes), [false])]
        public void ValidateToEnumMethodsFixed(InputEnumType inputEnum)
        {
            TypeProvider? enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            Assert.NotNull(enumType);
            var serialization = enumType!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
            MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("Enum")).FirstOrDefault();
            // Cast method.BodyExpression to SwitchCaseExpression
            if (method!.BodyStatements is MethodBodyStatements methodBodyStatements)
            {
                // Verify that there are the correct number of cases (values + 1 for throw)
                Assert.AreEqual(inputEnum.Values.Count + 1, methodBodyStatements.Statements.Count());
            }
        }

        [TestCaseSource(nameof(ValidateTypes), [false])]
        public void ValidateToSerialMethodsFixed(InputEnumType inputEnum)
        {
            TypeProvider? enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            Assert.NotNull(enumType);
            var serialization = enumType!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serialization);
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
                    Assert.AreEqual(inputEnum.Values.Count + 1, switchExpression.Cases.Count());

                    // Third case should be a throw
                    var caseExpression = switchExpression.Cases[2].Expression as KeywordExpression;
                    Assert.IsNotNull(caseExpression);
                    Assert.AreEqual("throw", caseExpression!.Keyword);
                    Assert.IsTrue(caseExpression!.Expression!.ToString().Contains("ArgumentOutOfRangeException"));
                }
            }
        }

        [TestCaseSource(nameof(ValidateTypes), [true])]
        public void ValidateToEnumMethodsExtensible(InputEnumType inputEnum)
        {
            TypeProvider? enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            Assert.NotNull(enumType);
            var serialization = enumType!.SerializationProviders.FirstOrDefault();

            // if inputEnum.ValueType is string, there should be no serialization provider
            if (inputEnum.ValueType == InputPrimitiveType.String)
            {
                Assert.IsNull(serialization);
            }
            else
            {
                // if inputEnum.ValueType is not string, there should be no Enum serialization method
                MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("Enum")).FirstOrDefault();
                Assert.IsNull(method);
            }
        }

        [TestCaseSource(nameof(ValidateTypes), [true])]
        public void ValidateToSerialMethodsExtensible(InputEnumType inputEnum)
        {
            TypeProvider? enumType = ClientModelPlugin.Instance.TypeFactory.CreateEnum(inputEnum);
            Assert.NotNull(enumType);
            TypeProvider? serialization = enumType!.SerializationProviders.FirstOrDefault();

            // if inputEnum.ValueType is string, there should be no serialization provider
            if (inputEnum.ValueType == InputPrimitiveType.String)
            {
                Assert.IsNull(serialization);
            }
            else
            {
                Assert.IsNotNull(serialization);
                MethodProvider? method = serialization!.Methods.Where(m => m.Signature.Name.Contains("ToSerial")).FirstOrDefault();
                // Cast method.BodyExpression to MemberExpression
                if (method!.BodyExpression is MemberExpression memberExpression)
                {
                    Assert.AreEqual("_value", memberExpression.MemberName);
                }
            }
        }
    }
}
