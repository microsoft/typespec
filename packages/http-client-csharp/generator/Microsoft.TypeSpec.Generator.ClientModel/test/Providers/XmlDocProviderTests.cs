// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Tests;
using Microsoft.TypeSpec.Generator.Input;
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
                    "test",
                    InputFactory.Operation(
                        "Operation",
                        parameters:
                        [
                            InputFactory.Parameter(
                                "queryParam",
                                InputFactory.StringEnum(
                                    "InputEnum",
                                    [
                                        ("value1", "value1"),
                                        ("value2", "value2")
                                    ],
                                    usage: InputModelTypeUsage.Input,
                                    isExtensible: true),
                                isRequired: true,
                                location: InputRequestLocation.Query)
                        ]))]);

        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator(clients: () => [_testClient]);
        }

        [Test]
        public void ValidateXmlDocShouldChangeFromVisitors()
        {
            var testVisitor = new TestVisitor();
            ScmCodeModelGenerator.Instance.AddVisitor(testVisitor);

            // visit the library
            testVisitor.DoVisitLibrary(CodeModelGenerator.Instance.OutputLibrary);

            // check if the parameter names in xml docs are changed accordingly.
        }

        private class TestVisitor : ScmLibraryVisitor
        {
            public void DoVisitLibrary(OutputLibrary library)
            {
                VisitLibrary(library);
            }

            protected internal override ScmMethodProvider? VisitMethod(ScmMethodProvider method)
            {
                // modify the parameter names in-placely
                foreach (var parameter in method.Signature.Parameters)
                {
                    // modify the parameter name
                    parameter.Update(name: parameter.Name + "_modified");
                }
                return method;
            }
        }
    }
}
