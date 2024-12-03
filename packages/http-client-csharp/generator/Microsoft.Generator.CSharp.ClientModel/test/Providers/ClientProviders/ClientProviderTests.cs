// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderTests
    {
        private const string TestClientName = "TestClient";
        private static readonly InputModelType _spreadModel = InputFactory.Model(
            "spreadModel",
            usage: InputModelTypeUsage.Spread,
            properties:
            [
                InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true),
            ]);

        [TestCase(true)]
        [TestCase(false)]
        public void TestGetClientOptions(bool isSubClient)
        {
            string? parentClientName = null;
            if (isSubClient)
            {
                parentClientName = "parent";
            }

            var client = InputFactory.Client(TestClientName, parent: parentClientName);
            var clientProvider = new ClientProvider(client);

            if (isSubClient)
            {
                Assert.IsNull(clientProvider?.ClientOptions);
            }
            else
            {
                Assert.IsNotNull(clientProvider?.ClientOptions);
            }
        }

        [Test]
        public void ValidateQueryParamDiff()
        {
            MockHelpers.LoadMockPlugin();

            //protocol and convenience methods should have a different type for enum query parameters
            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(GetEnumQueryParamClient());
            Assert.IsNotNull(clientProvider);
            var methods = clientProvider.Methods;
            //4 methods, sync / async + protocol / convenience
            Assert.AreEqual(4, methods.Count);
            //two methods need to have the query parameter as an enum
            Assert.AreEqual(2, methods.Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.Name == "InputEnum")).Count());
            //two methods need to have the query parameter as an string
            Assert.AreEqual(2, methods.Where(m => m.Signature.Parameters.Any(p => p.Name == "queryParam" && p.Type.IsFrameworkType && p.Type.FrameworkType == typeof(string))).Count());
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateQueryParamWriterDiff(bool isAsync)
        {
            MockHelpers.LoadMockPlugin(
                createClientCore: (client) => new ValidateQueryParamDiffClientProvider(client, isAsync));

            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(GetEnumQueryParamClient());

            TypeProviderWriter writer = new(clientProvider);
            var codeFile = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(isAsync.ToString()), codeFile.Content);
        }

        [Test]
        public void ValidateMethodSignatureUsesIEnumerable()
        {
            MockHelpers.LoadMockPlugin();

            var inputClient = InputFactory.Client(
                TestClientName,
                operations:
                [
                    InputFactory.Operation(
                        "Foo",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "arrayParam",
                                InputFactory.Array(
                                    InputPrimitiveType.String))
                        ])
                ]);
            var clientProvider = ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient);
            var convenienceMethod = clientProvider.Methods.FirstOrDefault(
                m => m.Signature.Name == "Foo" &&
                     !m.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))));
            Assert.IsNotNull(convenienceMethod);
            Assert.AreEqual(new CSharpType(typeof(IEnumerable<string>)), convenienceMethod!.Signature.Parameters[0].Type);
        }

        [TestCaseSource(nameof(ValidateClientWithSpreadTestCases))]
        public void ValidateClientWithSpread(InputClient inputClient)
        {
            var clientProvider = new ClientProvider(inputClient);
            var methods = clientProvider.Methods;

            Assert.AreEqual(4, methods.Count);

            var protocolMethods = methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Equals(typeof(BinaryContent)))).ToList();
            Assert.AreEqual(2, protocolMethods.Count);
            Assert.AreEqual(2, protocolMethods[0].Signature.Parameters.Count);
            Assert.AreEqual(2, protocolMethods[1].Signature.Parameters.Count);

            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), protocolMethods[0].Signature.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(RequestOptions), true), protocolMethods[0].Signature.Parameters[1].Type);
            Assert.AreEqual(new CSharpType(typeof(BinaryContent)), protocolMethods[1].Signature.Parameters[0].Type);
            Assert.AreEqual(new CSharpType(typeof(RequestOptions), true), protocolMethods[1].Signature.Parameters[1].Type);

            var convenienceMethods = methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Equals(typeof(string)))).ToList();
            Assert.AreEqual(2, convenienceMethods.Count);
            Assert.AreEqual(1, convenienceMethods[0].Signature.Parameters.Count);

            Assert.AreEqual(new CSharpType(typeof(string)), convenienceMethods[0].Signature.Parameters[0].Type);
            Assert.AreEqual("p1", convenienceMethods[0].Signature.Parameters[0].Name);
        }

        [TestCaseSource(nameof(RequestOptionsParameterInSignatureTestCases))]
        public void TestRequestOptionsParameterInSignature(InputOperation inputOperation, bool shouldBeOptional, bool hasOptionalParameter)
        {
            var client = InputFactory.Client(TestClientName, operations: [inputOperation]);
            var clientProvider = new ClientProvider(client);
            var protocolMethods = clientProvider.Methods.Where(m => m.Signature.Parameters.Any(p => p.Type.Name == "RequestOptions")).ToList();
            var syncMethod = protocolMethods.FirstOrDefault(m => !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));
            Assert.IsNotNull(syncMethod);

            var requestOptionsParameterInSyncMethod = syncMethod!.Signature.Parameters.FirstOrDefault(p => p.Type.Name == "RequestOptions");
            Assert.IsNotNull(requestOptionsParameterInSyncMethod);
            Assert.AreEqual(shouldBeOptional, requestOptionsParameterInSyncMethod!.Type.IsNullable);

            var asyncMethod = protocolMethods.FirstOrDefault(m => m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));
            Assert.IsNotNull(asyncMethod);

            var requestOptionsParameterInAsyncMethod = asyncMethod!.Signature.Parameters.FirstOrDefault(p => p.Type.Name == "RequestOptions");
            Assert.IsNotNull(requestOptionsParameterInAsyncMethod);
            Assert.AreEqual(shouldBeOptional, requestOptionsParameterInAsyncMethod!.Type.IsNullable);

            // request options should always be last parameter
            Assert.AreEqual("RequestOptions", syncMethod.Signature.Parameters[^1].Type.Name);
            Assert.AreEqual("RequestOptions", asyncMethod.Signature.Parameters[^1].Type.Name);

            if (shouldBeOptional)
            {
                Assert.IsNotNull(requestOptionsParameterInSyncMethod.DefaultValue);
                Assert.IsNotNull(requestOptionsParameterInAsyncMethod.DefaultValue);
            }

            if (shouldBeOptional && hasOptionalParameter)
            {
                var optionalParameter = syncMethod.Signature.Parameters[^2];
                // The optional parameter should be required in protocol method
                Assert.IsNull(optionalParameter.DefaultValue);
                // It should also be nullable for value types
                if (optionalParameter.Type.IsValueType)
                {
                    Assert.IsTrue(optionalParameter.Type.IsNullable);
                }
            }
        }

        [Test]
        public void TestApiVersionOfClient()
        {
            List<string> apiVersions = ["1.0", "2.0"];
            var enumValues = apiVersions.Select(a => InputFactory.EnumMember.String(a, a));
            var inputEnum = InputFactory.Enum("ServiceVersion", InputPrimitiveType.Int64, values: [.. enumValues], usage: InputModelTypeUsage.ApiVersionEnum);

            MockHelpers.LoadMockPlugin(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum]);
            var client = InputFactory.Client(TestClientName,
                operations: [
                    InputFactory.Operation("OperationWithApiVersion",
                            parameters: [InputFactory.Parameter("apiVersion", InputPrimitiveType.String, isRequired: true, location: RequestLocation.Query, kind: InputOperationParameterKind.Client, isApiVersion: true)])
                    ]);
            var clientProvider = new ClientProvider(client);
            Assert.IsNotNull(clientProvider);

            /* verify that the client has apiVersion field */
            Assert.IsNotNull(clientProvider.Fields.FirstOrDefault(f => f.Name.Equals("_apiVersion")));

            /* verify that there is no apiVersion parameter in constructor. */
            var apiVersionParameter = clientProvider.Constructors.Select(c => c.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion"))).FirstOrDefault();
            Assert.IsNull(apiVersionParameter);

            /* verify the apiVersion assignment in constructor body */
            var primaryConstructor = clientProvider.Constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            Assert.IsNotNull(primaryConstructor);
            var bodyStatements = primaryConstructor?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            Assert.IsTrue(bodyStatements!.Statements.Any(s => s.ToDisplayString().IndexOf("_apiVersion = options.Version;\n") != -1));

            var method = clientProvider.Methods.FirstOrDefault(m => m.Signature.Name.Equals("OperationWithApiVersion"));
            Assert.IsNotNull(method);
            /* verify that the method does not have apiVersion parameter */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
        }

        [TestCaseSource(nameof(ValidateApiVersionPathParameterTestCases))]
        public void TestApiVersionPathParameterOfClient(InputClient inputClient)
        {
            List<string> apiVersions = ["value1", "value2"];
            var enumValues = apiVersions.Select(a => InputFactory.EnumMember.String(a, a));
            var inputEnum = InputFactory.Enum("ServiceVersion", InputPrimitiveType.Int64, values: [.. enumValues], usage: InputModelTypeUsage.ApiVersionEnum);
            MockHelpers.LoadMockPlugin(
                apiVersions: () => apiVersions,
                inputEnums: () => [inputEnum]);

            var clientProvider = new ClientProvider(inputClient);
            Assert.IsNotNull(clientProvider);

            /* verify that the client has apiVersion field */
            var apiVersionField = clientProvider.Fields.FirstOrDefault(f => f.Name.Equals("_apiVersion"));
            Assert.IsNotNull(apiVersionField);
            Assert.AreEqual(new CSharpType(typeof(string)), apiVersionField?.Type);

            /* verify that there is no apiVersion parameter in constructor. */
            var apiVersionParameter = clientProvider.Constructors.Select(c => c.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion"))).FirstOrDefault();
            Assert.IsNull(apiVersionParameter);

            /* verify the apiVersion assignment in constructor body */
            var primaryConstructor = clientProvider.Constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            Assert.IsNotNull(primaryConstructor);
            var bodyStatements = primaryConstructor?.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(bodyStatements);
            Assert.IsTrue(bodyStatements!.Statements.Any(s => s.ToDisplayString().IndexOf("_apiVersion = options.Version;\n") != -1));

            var method = clientProvider.Methods.FirstOrDefault(m => m.Signature.Name.Equals("TestOperation"));
            Assert.IsNotNull(method);
            /* verify that the method does not have apiVersion parameter */
            Assert.IsNull(method?.Signature.Parameters.FirstOrDefault(p => p.Name.Equals("apiVersion")));
        }

        private static InputClient GetEnumQueryParamClient()
            => InputFactory.Client(
                TestClientName,
                operations:
                [
                    InputFactory.Operation(
                        "Operation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "queryParam",
                                InputFactory.Enum(
                                    "InputEnum",
                                    InputPrimitiveType.String,
                                    usage: InputModelTypeUsage.Input,
                                    isExtensible: true,
                                    values:
                                    [
                                        InputFactory.EnumMember.String("value1", "value1"),
                                        InputFactory.EnumMember.String("value2", "value2")
                                    ]),
                                isRequired: true,
                                location: RequestLocation.Query)
                        ])
                ]);

        private class ValidateQueryParamDiffClientProvider : ClientProvider
        {
            private readonly bool _isAsync;

            public ValidateQueryParamDiffClientProvider(InputClient client, bool isAsync = false)
                : base(client)
            {
                _isAsync = isAsync;
            }

            protected override MethodProvider[] BuildMethods()
            {
                var method = base.BuildMethods().First(m => m.Signature.Parameters.Any(p =>
                    p is { Name: "queryParam", Type.Name: "InputEnum" } &&
                    ((_isAsync && m.Signature.Name.EndsWith("Async")) || (!_isAsync && !m.Signature.Name.EndsWith("Async")))));
                method.Update(xmlDocProvider: new XmlDocProvider()); // null out the docs
                return [method];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
            protected override PropertyProvider[] BuildProperties() => [];
        }

        public static IEnumerable<TestCaseData> ValidateClientWithSpreadTestCases
        {
            get
            {
                yield return new TestCaseData(InputFactory.Client(
                    TestClientName,
                    operations:
                    [
                        InputFactory.Operation(
                        "CreateMessage",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "spread",
                                _spreadModel,
                                location: RequestLocation.Body,
                                isRequired: true,
                                kind: InputOperationParameterKind.Spread),
                        ])
                    ]));
            }
        }

        public static IEnumerable<TestCaseData> RequestOptionsParameterInSignatureTestCases
        {
            get
            {
                // Protocol & convenience methods will have the same parameters, so RequestOptions should be required.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: RequestLocation.None,
                                isRequired: true),
                            InputFactory.Parameter(
                                "p2",
                                InputPrimitiveType.Int64,
                                location: RequestLocation.None,
                                isRequired: true),
                        ]), false, false);

                // Protocol & convenience methods will have the same parameters.
                // One of the parameter is optional, so it should be made required in the protocol method.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: RequestLocation.None,
                                isRequired: false),
                            InputFactory.Parameter(
                                "p2",
                                InputPrimitiveType.Int64,
                                location: RequestLocation.None,
                                isRequired: true),
                        ]), false, true);

                // Protocol & convenience methods will have the same parameters.
                // One of the parameter is optional value type, so it should be made nullable required in the protocol method, and RequestOptions can be optional.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.Int32,
                                location: RequestLocation.None,
                                isRequired: false),
                            InputFactory.Parameter(
                                "p2",
                                InputPrimitiveType.Int64,
                                location: RequestLocation.None,
                                isRequired: true),
                        ]), false, true);

                // convenience method only has a body param, so RequestOptions should be optional in protocol method.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                             InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: RequestLocation.Body),
                        ]), true, false);

                // Protocol & convenience methods will have different parameters since there is a model body param, so RequestOptions should be optional.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: RequestLocation.None,
                                isRequired: true),
                            InputFactory.Parameter(
                                "p2",
                                InputFactory.Model("SampleModel"),
                                location: RequestLocation.Body,
                                isRequired: true),
                        ]), true, false);

                // Protocol & convenience methods will have different parameters since there is a model body param, so RequestOptions should be optional.
                // One parameter is optional
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "p1",
                                InputPrimitiveType.String,
                                location: RequestLocation.None,
                                isRequired: true),
                            InputFactory.Parameter(
                                "p2",
                                InputFactory.Model("SampleModel"),
                                location: RequestLocation.Body,
                                isRequired: false),
                        ]), true, true);

                // Convenience method has no parameters, RequestOptions should be required in protocol method.
                yield return new TestCaseData(
                    InputFactory.Operation(
                        "TestOperation",
                        responses: [InputFactory.OperationResponse([201], InputFactory.Model("testModel"))],
                        parameters: []),
                    false, false);
            }
        }

        private static IEnumerable<TestCaseData> ValidateApiVersionPathParameterTestCases
        {
            get
            {
                InputParameter endpointParameter = InputFactory.Parameter(
                    "endpoint",
                    InputPrimitiveType.String,
                    location: RequestLocation.Uri,
                    isRequired: true,
                    kind: InputOperationParameterKind.Client,
                    isEndpoint: true,
                    isApiVersion: false);

                InputParameter stringApiVersionParameter = InputFactory.Parameter(
                    "apiVersion",
                    InputPrimitiveType.String,
                    location: RequestLocation.Uri,
                    isRequired: true,
                    kind: InputOperationParameterKind.Client,
                    isApiVersion: true);

                InputParameter enumApiVersionParameter = InputFactory.Parameter(
                    "apiVersion",
                    InputFactory.Enum(
                        "InputEnum",
                        InputPrimitiveType.String,
                        usage: InputModelTypeUsage.Input,
                        isExtensible: true,
                        values:
                        [
                            InputFactory.EnumMember.String("value1", "value1"),
                        InputFactory.EnumMember.String("value2", "value2")
                        ]),
                    location: RequestLocation.Uri,
                    isRequired: true,
                    kind: InputOperationParameterKind.Client,
                    isApiVersion: true);

                yield return new TestCaseData(
                    InputFactory.Client(
                        "TestClient",
                        operations:
                        [
                            InputFactory.Operation(
                            "TestOperation",
                            uri: "{endpoint}/{apiVersion}")
                        ],
                        parameters: [
                            endpointParameter,
                        stringApiVersionParameter
                        ]));

                yield return new TestCaseData(
                    InputFactory.Client(
                        "TestClient",
                        operations:
                        [
                            InputFactory.Operation(
                        "TestOperation",
                        uri: "{endpoint}/{apiVersion}")
                        ],
                        parameters: [
                            endpointParameter,
                        enumApiVersionParameter
                        ]));
            }
        }
    }
}
