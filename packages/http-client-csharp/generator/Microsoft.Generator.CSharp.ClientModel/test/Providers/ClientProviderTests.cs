// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class ClientProviderTests
    {
        [OneTimeSetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockPlugin();
        }

        [TestCaseSource(nameof(BuildFieldsTestCases))]
        public void TestBuildFields(List<InputParameter> inputParameters)
        {
            var client = new InputClient("TestClient", "TestClient description", [], inputParameters, null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            // validate the fields
            var fields = clientProvider.Fields;
            Assert.IsTrue(fields.Count > 0);
            // there should be client.Parameters.Count + auth fields (auth header constant, api key credential) + pipeline
            Assert.AreEqual(client.Parameters.Count + 3, fields.Count);
            foreach (var inputParameter in inputParameters)
            {
                Assert.IsTrue(fields.Any(f => f.Name == "_" + inputParameter.Name));
            }
            Assert.IsTrue(fields.Any(f => f == clientProvider.PipelineField));

            // validate the endpoint field
            if (inputParameters.Any(p => p.IsEndpoint))
            {
                var endpointField = fields.FirstOrDefault(f => f.Name == "_endpoint");
                Assert.IsNotNull(endpointField);
                Assert.AreEqual(new CSharpType(typeof(Uri)), endpointField?.Type);
            }
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        public void TestBuildConstructors_PrimaryConstructor(List<InputParameter> inputParameters, bool containsEndpointParam)
        {
            var client = new InputClient("TestClient", "TestClient description", [], inputParameters, null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;
            Assert.AreEqual(3, constructors.Count);

            var primaryPublicConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            ValidatePrimaryConstructor(primaryPublicConstructor, inputParameters, containsEndpointParam);
        }

        [TestCaseSource(nameof(BuildConstructorsTestCases))]
        public void TestBuildConstructors_SecondaryConstructor(List<InputParameter> inputParameters, bool containsEndpointParam)
        {
            var client = new InputClient("TestClient", "TestClient description", [], inputParameters, null);
            var clientProvider = new ClientProvider(client);

            Assert.IsNotNull(clientProvider);

            var constructors = clientProvider.Constructors;

            Assert.AreEqual(3, constructors.Count);
            var primaryPublicConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Initializer == null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);

            Assert.IsNotNull(primaryPublicConstructor);

            var secondaryPublicConstructor = constructors.FirstOrDefault(
                c => c.Signature?.Initializer != null && c.Signature?.Modifiers == MethodSignatureModifiers.Public);
            ValidateSecondaryConstructor(primaryPublicConstructor, secondaryPublicConstructor, inputParameters, containsEndpointParam);
        }

        private void ValidatePrimaryConstructor(
            ConstructorProvider? primaryPublicConstructor,
            List<InputParameter> inputParameters,
            bool containsEndpointParam)
        {
            Assert.IsNotNull(primaryPublicConstructor);

            var primaryCtorParams = primaryPublicConstructor?.Signature?.Parameters;
            var clientOptionsParameter = primaryCtorParams?.FirstOrDefault(p => p.Name == "options");
            var credentialParameter = primaryCtorParams?.FirstOrDefault(p => p.Name == "credential");

            Assert.IsNotNull(clientOptionsParameter);
            Assert.IsNotNull(credentialParameter);
            var expectedPrimaryCtorParamCount = inputParameters.Count + 2;

            // validate the order of the parameters (endpoint, credential, required, optional)
            var requiredParams = inputParameters.Where(p => p.IsRequired && !p.IsEndpoint).ToList();
            var optionalParams = inputParameters.Where(p => !p.IsRequired && !p.IsEndpoint).ToList();
            var expectedParams = new List<InputParameter>();
            if (containsEndpointParam)
            {
                Assert.AreEqual("endpoint", primaryCtorParams?[0].Name);
                Assert.AreEqual("credential", primaryCtorParams?[1].Name);
            }
            expectedParams.AddRange(requiredParams);
            expectedParams.AddRange(optionalParams);

            // validate the remaining param ordering
            Assert.AreEqual(expectedPrimaryCtorParamCount, primaryCtorParams?.Count);
            for (var i = 0; i < expectedParams.Count; i++)
            {
                var primaryCtorParam = containsEndpointParam ? primaryCtorParams?[i + 2] : primaryCtorParams?[i + 1];
                Assert.AreEqual(expectedParams[i].Name, primaryCtorParam?.Name);
                if (expectedParams[i].DefaultValue != null)
                {
                    var parsedValue = expectedParams[i].DefaultValue?.Value;
                    Assert.AreEqual(Snippet.Literal(parsedValue), primaryCtorParam?.InitializationValue);
                }
            }

            // validate the options param is last
            Assert.AreEqual("options", primaryCtorParams?[primaryCtorParams.Count - 1].Name);

            // validate the body of the primary ctor
            var primaryCtorBody = primaryPublicConstructor?.BodyStatements;
            Assert.IsNotNull(primaryCtorBody);
        }

        private void ValidateSecondaryConstructor(
            ConstructorProvider? primaryConstructor,
            ConstructorProvider? secondaryPublicConstructor,
            List<InputParameter> inputParameters,
            bool containsEndpointParam)
        {
            Assert.IsNotNull(secondaryPublicConstructor);
            var ctorParams = secondaryPublicConstructor?.Signature?.Parameters;

            // secondary ctor should consist of all required parameters + auth parameter
            var requiredParams = inputParameters.Where(p => p.IsRequired && !p.IsEndpoint).ToList();
            Assert.AreEqual(requiredParams.Count + 1, ctorParams?.Count);
            var endpointParam = ctorParams?.FirstOrDefault(p => p.Name == "endpoint");
            bool endpointParamIsRequired = false;

            if (containsEndpointParam && endpointParam?.InitializationValue != null)
            {
                // endpoint should be the first parameter if it's required
                Assert.AreEqual("endpoint", ctorParams?[0].Name);
                endpointParamIsRequired = true;
            }

            // validate the remaining param ordering
            for (var i = 0; i < requiredParams.Count; i++)
            {
                var ctorParam = endpointParamIsRequired ? ctorParams?[i + 2] : ctorParams?[i + 1];
                Assert.AreEqual(requiredParams[i].Name, ctorParam?.Name);
                if (requiredParams[i].DefaultValue != null)
                {
                    var parsedValue = requiredParams[i].DefaultValue?.Value;
                    Assert.AreEqual(Snippet.Literal(parsedValue), ctorParam?.InitializationValue);
                }
            }

            Assert.AreEqual(MethodBodyStatement.Empty, secondaryPublicConstructor?.BodyStatements);

            // validate the initializer
            var initializer = secondaryPublicConstructor?.Signature?.Initializer;
            Assert.AreEqual(primaryConstructor?.Signature?.Parameters?.Count, initializer?.Arguments?.Count);
        }

        public static IEnumerable<TestCaseData> BuildFieldsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "requiredParam1",
                        "requiredParam1 description",
                        "requiredParam1",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "requiredParam2",
                        "requiredParam2 description",
                        "requiredParam2",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null)
                });
                // scenario with endpoint parameter
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "requiredParam1",
                        "requiredParam1 description",
                        "requiredParam1",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        "endpoint",
                        "endpoint description",
                        "endpoint",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, isEndpoint: true, false, false, null, null)
                });
            }
        }

        public static IEnumerable<TestCaseData> BuildConstructorsTestCases
        {
            get
            {
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "requiredParam1",
                        "requiredParam1 description",
                        "requiredParam1",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "requiredParam2",
                        "requiredParam2 description",
                        "requiredParam2",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null)
                }, false);
                // scenario with endpoint parameter
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "requiredParam1",
                        "requiredParam1 description",
                        "requiredParam1",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        "endpoint",
                        "endpoint description",
                        "endpoint",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, isEndpoint: true, false, false, null, null)
                }, true);
                // scenario with mixed ordering and endpoint parameter
                yield return new TestCaseData(new List<InputParameter>
                {
                    new(
                        "requiredParam1",
                        "requiredParam1 description",
                        "requiredParam1",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam",
                        "optionalParam description",
                        "optionalParam",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        "requiredParam2",
                        "requiredParam2 description",
                        "requiredParam2",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: true, false, false, false, false, false, false, null, null),
                    new(
                        "optionalParam2",
                        "optionalParam2 description",
                        "optionalParam2",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: null,
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, false, false, false, null, null),
                    new(
                        "endpoint",
                        "endpoint description",
                        "endpoint",
                        new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        RequestLocation.None,
                        defaultValue: new InputConstant("someValue", InputPrimitiveType.String),
                        InputOperationParameterKind.Client,
                        isRequired: false, false, false, false, isEndpoint: true, false, false, null, null)
                }, true);
            }
        }
    }
}
