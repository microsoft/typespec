// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders;

public class ClientProviderVisitorsTests
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
        public void DoVisitLibrary(OutputLibrary library)
        {
            VisitLibrary(library);
        }

        protected internal override ScmMethodProvider? VisitMethod(ScmMethodProvider method)
        {
            // modify the parameter names in-place
            foreach (var parameter in method.Signature.Parameters)
            {
                if (parameter.Name == "queryParam")
                {
                    // modify the parameter name
                    parameter.Update(name: "queryParam_modified");
                }
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
