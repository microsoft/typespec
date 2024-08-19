// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    public class InputLibraryVisitorTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private Mock<ClientModelPlugin> _mockPlugin;
        private Mock<ScmLibraryVisitor> _mockVisitor;
        private Mock<InputLibrary> _mockInputLibrary;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _mockInputLibrary = new Mock<InputLibrary>();
            _mockPlugin = MockHelpers.LoadMockPlugin(createInputLibrary: () => _mockInputLibrary.Object);
            _mockVisitor = new Mock<ScmLibraryVisitor> { CallBase = true };
        }

        [Test]
        public void PreVisitsMethods()
        {
            _mockPlugin.Object.AddVisitor(_mockVisitor.Object);
            var inputModelProperty = InputFactory.Property("prop1", InputPrimitiveType.Any, isRequired: true, isReadOnly: true);
            var inputModel = InputFactory.Model("foo", access: "internal", usage: InputModelTypeUsage.Input, properties: [inputModelProperty]);

            var param = InputFactory.Parameter("param", InputFactory.Literal.String("bar"), location: RequestLocation.Header, isRequired: true, isResourceParameter: true);
            var inputOperation = InputFactory.Operation("testOperation", parameters: [param], responses: [InputFactory.OperationResponse(bodytype: InputPrimitiveType.Any)]);
            var inputClient = InputFactory.Client("fooClient", operations: [inputOperation], parameters: [param]);
            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace(
                "test library",
                models: [inputModel],
                clients: [InputFactory.Client("fooClient", operations: [inputOperation], parameters: [param])]));

            var mockClientProvider = new Mock<ClientProvider>(inputClient) { CallBase = true };
            _ = mockClientProvider.Object.Methods;

            _mockVisitor.Protected().Verify<MethodProviderCollection>("Visit", Times.Once(), inputOperation, ItExpr.IsAny<TypeProvider>(), ItExpr.IsAny<MethodProviderCollection>());
        }
    }
}
