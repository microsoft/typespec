// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Tests;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class XmlDocProviderTests
    {
        private const string TestClientName = "TestClient";
        private static readonly InputClient _testClient = InputFactory.Client(TestClientName,
            methods: [
                InputFactory.BasicServiceMethod(
                    "Operation",
                    InputFactory.Operation(
                        "Operation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "queryParam",
                                InputPrimitiveType.String,
                                isRequired: true,
                                location: InputRequestLocation.Query)
                        ]))]);

        [Test]
        public void ValidateXmlDocShouldChangeFromVisitors()
        {
            MockHelpers.LoadMockGenerator(
                createClientCore: inputClient => new MockClientProvider(inputClient),
                clients: () => [_testClient],
                includeXmlDocs: true
                );
            var testVisitor = new TestVisitor();
            ScmCodeModelGenerator.Instance.AddVisitor(testVisitor);

            // visit the library
            testVisitor.DoVisitLibrary(CodeModelGenerator.Instance.OutputLibrary);

            // check if the parameter names in xml docs are changed accordingly
            // find the client in outputlibrary
            var client = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.OfType<ClientProvider>().FirstOrDefault()!;
            Assert.IsNotNull(client);
            var writer = ScmCodeModelGenerator.Instance.GetWriter(client);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private class TestVisitor : ScmLibraryVisitor
        {
            public TestVisitor()
            {
                // we have the cache here because some parameters are shared between methods, and in the visitor we need to avoid to "duplicatedly" modify the same parameter.
                _visitedParameters = new HashSet<ParameterProvider>();
            }

            public void DoVisitLibrary(OutputLibrary library)
            {
                VisitLibrary(library);
            }

            private readonly HashSet<ParameterProvider> _visitedParameters;

            protected internal override ScmMethodProvider? VisitMethod(ScmMethodProvider method)
            {
                // modify the parameter names in-placely
                foreach (var parameter in method.Signature.Parameters)
                {
                    if (_visitedParameters.Contains(parameter))
                    {
                        // already visited this parameter, skip
                        continue;
                    }
                    _visitedParameters.Add(parameter);
                    // modify the parameter name
                    parameter.Update(name: parameter.Name + "_modified");
                }
                return method;
            }
        }

        private class MockClientProvider : ClientProvider
        {
            public MockClientProvider(InputClient client) : base(client)
            { }

            // ignore all the ctors to make the output more clear
            protected override ConstructorProvider[] BuildConstructors() => [];

            // ignore all the fields to make the output more clear
            protected override FieldProvider[] BuildFields() => [];

            protected override PropertyProvider[] BuildProperties() => [];
        }
    }
}
