// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.OutputTypes
{
    public class TypeFactoryTests
    {
        private CustomTypeFactory? _customFactory;

        [SetUp]
        public void Setup()
        {
            _customFactory = new CustomTypeFactory();
        }

        /// <summary>
        /// Validates that the factory method for creating a <see cref="CSharpType"/> based on an input type <paramref name="input"/> works as expected.
        /// </summary>
        /// <param name="inputType">The input type to convert.</param>
        /// <param name="expectedType">The expected <see cref="CSharpType"/>.</param>
        [TestCaseSource("CreateTypeTestCases")]
        public void TestCreateType(InputType inputType, CSharpType? expectedType, bool expectedError)
        {
            if (expectedError)
            {
                Assert.Throws<NotImplementedException>(() => _customFactory?.CreateCSharpType(inputType));
                return;
            }
            else
            {
                Assert.IsNotNull(inputType);
                Assert.IsNotNull(expectedType);

                var actual = _customFactory?.CreateCSharpType(inputType);

                Assert.IsNotNull(actual);

                expectedType!.Equals(actual!);
            }
        }

        public static IEnumerable<TestCaseData> CreateTypeTestCases
        {
            get
            {
                yield return new TestCaseData(new InputListType("sampleType", new InputPrimitiveType(InputPrimitiveTypeKind.Boolean), false), new CSharpType(typeof(InputListType), isNullable: false), false);
                yield return new TestCaseData(new InputDictionaryType("sampleType", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.Int32)), new CSharpType(typeof(InputDictionaryType), isNullable: false), false);
                yield return new TestCaseData(new InputPrimitiveType(InputPrimitiveTypeKind.String), new CSharpType(typeof(InputPrimitiveType), isNullable: false), false);
                yield return new TestCaseData(new InputLiteralType(new InputPrimitiveType(InputPrimitiveTypeKind.String), "literal"), null, true);
            }
        }

        internal class CustomTypeFactory : TypeFactory
        {
            public override ParameterProvider CreateCSharpParam(InputParameter parameter)
            {
                throw new NotImplementedException();
            }

            public override MethodProviderCollection? CreateMethodProviders(InputOperation operation, TypeProvider enclosingType)
            {
                throw new NotImplementedException();
            }

            public override CSharpType CreateCSharpType(InputType input)
            {
                switch (input)
                {
                    case InputListType:
                        return new CSharpType(typeof(InputListType), isNullable: false);
                    case InputDictionaryType:
                        return new CSharpType(typeof(InputDictionaryType), isNullable: false);
                    case InputPrimitiveType:
                        return new CSharpType(typeof(InputPrimitiveType), isNullable: false);
                    default:
                        throw new NotImplementedException("Unknown input type");
                }
            }
        }
    }
}
