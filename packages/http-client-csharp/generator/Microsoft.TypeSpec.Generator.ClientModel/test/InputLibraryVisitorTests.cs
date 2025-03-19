// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public class InputLibraryVisitorTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private Mock<ScmCodeModelGenerator> _mockGenerator;
        private Mock<ScmLibraryVisitor> _mockVisitor;
        private Mock<InputLibrary> _mockInputLibrary;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _mockInputLibrary = new Mock<InputLibrary>();
            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace("Sample"));
            _mockGenerator = MockHelpers.LoadMockGenerator(
                createInputLibrary: () => _mockInputLibrary.Object,
                createClientCore: inputClient => new ClientProvider(inputClient));
            _mockVisitor = new Mock<ScmLibraryVisitor> { CallBase = true };
        }

        [Test]
        public void PreVisitsMethods()
        {
            _mockGenerator.Object.AddVisitor(_mockVisitor.Object);
            var inputModelProperty = InputFactory.Property("prop1", InputPrimitiveType.Any, isRequired: true, isReadOnly: true);
            var inputModel = InputFactory.Model("foo", access: "internal", usage: InputModelTypeUsage.Input, properties: [inputModelProperty]);

            var param = InputFactory.Parameter("param", InputFactory.Literal.String("bar"), location: InputRequestLocation.Header, isRequired: true, isResourceParameter: true);
            var inputOperation = InputFactory.Operation("testOperation", parameters: [param], responses: [InputFactory.OperationResponse(bodytype: InputPrimitiveType.Any)]);
            var inputClient = InputFactory.Client("fooClient", operations: [inputOperation], parameters: [param]);
            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace(
                "Sample",
                models: [inputModel],
                clients: [inputClient]));

            var mockClientProvider = new Mock<ClientProvider>(inputClient) { CallBase = true };
            _ = mockClientProvider.Object.Methods;

            _mockVisitor.Protected().Verify<MethodProviderCollection>("Visit", Times.Once(), inputOperation, ItExpr.IsAny<TypeProvider>(), ItExpr.IsAny<MethodProviderCollection>());
        }

        [Test]
        public void PreVisitsClients()
        {
            _mockGenerator.Object.AddVisitor(_mockVisitor.Object);

            var inputClient = InputFactory.Client("fooClient");
            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace(
                "Sample",
                clients: [inputClient]));

            var mockOutputLibrary = new Mock<ScmOutputLibrary> { CallBase = true };
            _ = mockOutputLibrary.Object.TypeProviders;

            _mockVisitor.Protected().Verify<ClientProvider?>("Visit", Times.Once(), inputClient, ItExpr.IsAny<ClientProvider?>());
        }
    }
}
