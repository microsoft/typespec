// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
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
                yield return new TestCaseData(new InputList("sampleType", new InputPrimitiveType(InputTypeKind.Boolean, false), false, false), new CSharpType(typeof(InputList), isNullable: false), false);
                yield return new TestCaseData(new InputDictionary("sampleType", new InputPrimitiveType(InputTypeKind.String, false), new InputPrimitiveType(InputTypeKind.Int32, false), false), new CSharpType(typeof(InputDictionary), isNullable: false), false);
                yield return new TestCaseData(new InputPrimitiveType(InputTypeKind.String, false), new CSharpType(typeof(InputPrimitiveType), isNullable: false), false);
                yield return new TestCaseData(new InputLiteralType("literalType", new InputPrimitiveType(InputTypeKind.String, false), "literal", false), null, true);
            }
        }

        internal class CustomTypeFactory : TypeFactory
        {

            public override CSharpType RequestConditionsType()
            {
                throw new NotImplementedException();
            }

            public override CSharpType TokenCredentialType()
            {
                throw new NotImplementedException();
            }

            public override CSharpType MatchConditionsType()
            {
                throw new NotImplementedException();
            }

            public override CSharpType PageResponseType()
            {
                throw new NotImplementedException();
            }

            public override Parameter CreateCSharpParam(InputParameter parameter)
            {
                throw new NotImplementedException();
            }

            public override CSharpMethodCollection? CreateCSharpMethodCollection(InputOperation operation)
            {
                throw new NotImplementedException();
            }

            public override SerializationInterfaces GetSerializationInterfaces(TypeProvider typeProvider, bool hasJson, bool hasXml)
            {
                throw new NotImplementedException();
            }

            public override CSharpType CreateCSharpType(InputType input)
            {
                switch (input)
                {
                    case InputList:
                        return new CSharpType(typeof(InputList), isNullable: false);
                    case InputDictionary:
                        return new CSharpType(typeof(InputDictionary), isNullable: false);
                    case InputPrimitiveType:
                        return new CSharpType(typeof(InputPrimitiveType), isNullable: false);
                    default:
                        throw new NotImplementedException("Unknown input type");
                }
            }
        }
    }
}
