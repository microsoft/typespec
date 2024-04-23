// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class TypeFactoryTests
    {
        private CustomTypeFactory? customFactory;

        [SetUp]
        public void Setup()
        {
            customFactory = new CustomTypeFactory();
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
                Assert.Throws<NotImplementedException>(() => customFactory?.CreateType(inputType));
                return;
            }
            else
            {
                Assert.IsNotNull(inputType);
                Assert.IsNotNull(expectedType);

                var actual = customFactory?.CreateType(inputType);

                Assert.IsNotNull(actual);

                expectedType!.Equals(actual!);
            }
        }

        /// <summary>
        /// Validates that the factory method for creating a <see cref="Method"/> based on an input operation <paramref name="operation"/> works as expected.
        /// </summary>
        /// <param name="operation">The input operation to convert.</param>
        /// <param name="expectedMethod">The expected <see cref="Method"/>.</param>
        [TestCaseSource("CreateMethodTestCases")]
        public void TestCreateMethod(InputOperation operation, Method expectedMethod)
        {
            Assert.IsNotNull(operation);
            Assert.IsNotNull(expectedMethod);

            var actual = customFactory?.CreateMethod(operation);

            Assert.IsNotNull(actual);
            string actualType = actual!.Kind;
            Assert.AreEqual(expectedMethod.Kind, actualType);
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

        public static IEnumerable<TestCaseData> CreateMethodTestCases
        {
            get
            {
                yield return new TestCaseData(new InputOperation(),
                    new Method(new MethodSignature(string.Empty, $"{string.Empty}", null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()),
                        Array.Empty<MethodBodyStatement>(),
                        "default"
                    ));
                yield return new TestCaseData(new InputOperation(name: string.Empty,
                    resourceName: null,
                    summary: null,
                    deprecated: null,
                    description: string.Empty,
                    accessibility: null,
                    parameters: Array.Empty<InputParameter>(),
                    responses: Array.Empty<OperationResponse>(),
                    httpMethod: string.Empty,
                    requestBodyMediaType: BodyMediaType.None,
                    uri: string.Empty,
                    path: string.Empty,
                    externalDocsUrl: null,
                    requestMediaTypes: Array.Empty<string>(),
                    bufferResponse: false,
                    longRunning: new OperationLongRunning(),
                    paging: null,
                    generateProtocolMethod: true,
                    generateConvenienceMethod: false),
                    new Method(new MethodSignature(string.Empty, $"{string.Empty}", null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()),
                        Array.Empty<MethodBodyStatement>(),
                        "longRunning"
                    ));
                yield return new TestCaseData(new InputOperation(name: string.Empty,
                    resourceName: null,
                    summary: null,
                    deprecated: null,
                    description: string.Empty,
                    accessibility: null,
                    parameters: Array.Empty<InputParameter>(),
                    responses: Array.Empty<OperationResponse>(),
                    httpMethod: string.Empty,
                    requestBodyMediaType: BodyMediaType.None,
                    uri: string.Empty,
                    path: string.Empty,
                    externalDocsUrl: null,
                    requestMediaTypes: Array.Empty<string>(),
                    bufferResponse: false,
                    longRunning: null,
                    paging: new OperationPaging(),
                    generateProtocolMethod: true,
                    generateConvenienceMethod: false),
                    new Method(new MethodSignature(string.Empty, $"{string.Empty}", null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()),
                        Array.Empty<MethodBodyStatement>(),
                        "paging"
                    ));
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

            public override CSharpType CreateType(InputType input)
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

            public override Method CreateMethod(InputOperation operation, bool returnProtocol = true)
            {
                var methodType = GetMethodType(operation);
                switch (methodType)
                {
                    case "default":
                        return new Method
                        (
                            new MethodSignature(operation.Name, $"{operation?.Summary}", null, MethodSignatureModifiers.Public, null, null, new Parameter[0]),
                            new MethodBodyStatement[0],
                            methodType
                        );
                    case "longRunning":
                        return new Method
                        (
                            new MethodSignature(operation.Name, $"{operation?.Summary}", null, MethodSignatureModifiers.Public, null, null, new Parameter[0]),
                            new MethodBodyStatement[0],
                            methodType
                        );
                    case "paging":
                        return new Method
                        (
                            new MethodSignature(operation.Name, $"{operation?.Summary}", null, MethodSignatureModifiers.Public, null, null, new Parameter[0]),
                            new MethodBodyStatement[0],
                            methodType
                        );
                    default:
                        throw new Exception($"Unknown method type {methodType}");
                }
            }

            private static string GetMethodType(InputOperation operation)
            {
                var defaultMethodType = "default";

                if (operation.LongRunning is not null)
                    return "longRunning";
                if (operation.Paging is not null)
                    return "paging";
                return defaultMethodType;
            }
        }
    }
}
