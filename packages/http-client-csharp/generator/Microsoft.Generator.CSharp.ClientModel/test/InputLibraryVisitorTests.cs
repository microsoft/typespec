// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
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
            var inputModel = new InputModelType("foo", "id", "desc", "internal", "description",
                InputModelTypeUsage.Input, [], null, [], null, null, new Dictionary<string, InputModelType>(), null, false);
            var inputModelProperty =
                new InputModelProperty("prop1", "prop1", "string", new InputPrimitiveType(InputPrimitiveTypeKind.Any, "foo", "bar"), true, true, false, inputModel);
            inputModel.Properties = new[] { inputModelProperty };

            var param = new InputParameter("param", "name", "desc",
                new InputLiteralType(new InputPrimitiveType(InputPrimitiveTypeKind.String, "foo", "bar"), "bar"),
                RequestLocation.Header, null, InputOperationParameterKind.Method, true, false, true, false, false,
                false, false, null, null);
            var inputOperation = new InputOperation("testoperation", "name", "desc", null, null, [param], new[] { new OperationResponse([200], new InputLiteralType(InputPrimitiveType.Any, "foo"), BodyMediaType.Json, [], false, []) },
                "GET", BodyMediaType.Json, "http://example.com", "baz", null, null, true, null, null, true, true, "foo");
            var inputClient = new InputClient(
                "fooClient",
                "desc",
                [inputOperation],
                [param],
                null);
            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(new InputNamespace(
                "test library",
                new List<string>(),
                new List<InputEnumType>(),
                new List<InputModelType> { inputModel },
                new List<InputClient>
                {
                    new InputClient(
                        "fooClient",
                        "desc",
                        new[]
                        {
                            inputOperation
                        },
                        [param],
                        null)
                },
                new InputAuth()));

            var mockClientProvider = new Mock<ClientProvider>(inputClient) { CallBase = true };
            _ = mockClientProvider.Object.Methods;

            _mockVisitor.Protected().Verify<MethodProviderCollection>("Visit", Times.Once(), inputOperation, ItExpr.IsAny<TypeProvider>(), ItExpr.IsAny<MethodProviderCollection>());
        }
    }
}
