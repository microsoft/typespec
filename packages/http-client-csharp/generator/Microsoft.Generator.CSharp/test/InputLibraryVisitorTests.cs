// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class InputLibraryVisitorTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private Mock<CodeModelPlugin> _mockPlugin;
        private Mock<LibraryVisitor> _mockVisitor;
        private Mock<InputLibrary> _mockInputLibrary;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _mockPlugin = MockHelpers.LoadMockPlugin();
            _mockVisitor = new Mock<LibraryVisitor> { CallBase = true };
            _mockPlugin.Object.AddVisitor(_mockVisitor.Object);
            _mockInputLibrary = new Mock<InputLibrary>();
            _mockPlugin.Setup(p => p.InputLibrary).Returns(_mockInputLibrary.Object);
            _mockPlugin.Object.AddVisitor(_mockVisitor.Object);
        }

        [Test]
        public void PreVisitsProperties()
        {
            var inputModelProperty =
                new InputModelProperty("prop1", "prop1", "string", new InputPrimitiveType(InputPrimitiveTypeKind.Any), true, true, false);
            var inputModel = new InputModelType("foo", "id", "desc", "internal", "description",
                InputModelTypeUsage.Input, new[] { inputModelProperty }, null, [], null, null, new Dictionary<string, InputModelType>(), null, false);

            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(new InputNamespace(
                "test library",
                new List<string>(),
                new List<InputEnumType>(),
                new List<InputModelType> {inputModel},
                new List<InputClient>(),
                new InputAuth()));

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputModel, ItExpr.IsNull<TypeProvider>());
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Once(), inputModelProperty, ItExpr.IsNull<PropertyProvider>());
        }

        [Test]
        public void PreVisitsEnum()
        {
            var inputEnum = new InputEnumType("enum", "id", "desc", null, "description", InputModelTypeUsage.Input, InputPrimitiveType.Int32, new[]
            {
                new InputEnumTypeValue("value", 1, "desc")
            }, false);
            var inputModelProperty =
                new InputModelProperty("prop1", "prop1", "string", inputEnum, true, true, false);
            var inputModel = new InputModelType("foo", "id", "desc", "internal", "description",
                InputModelTypeUsage.Input, new[] { inputModelProperty }, null, [], null, null, new Dictionary<string, InputModelType>(), null, false);

            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(new InputNamespace(
                "test library",
                new List<string>(),
                new List<InputEnumType>(),
                new List<InputModelType> {inputModel},
                new List<InputClient>(),
                new InputAuth()));

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputModel, ItExpr.IsNull<TypeProvider>());

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputEnum, ItExpr.IsNull<TypeProvider>());
        }

        [Test]
        [Ignore("This should probably move to SCM tests if CreateMethods moves there. https://github.com/microsoft/typespec/issues/4066")]
        public void PreVisitsMethods()
        {
            var inputModelProperty =
                new InputModelProperty("prop1", "prop1", "string", new InputPrimitiveType(InputPrimitiveTypeKind.Any), true, true, false);
            var inputModel = new InputModelType("foo", "id", "desc", "internal", "description",
                InputModelTypeUsage.Input, new[] { inputModelProperty }, null, [], null, null, new Dictionary<string, InputModelType>(), null, false);

            var param = new InputParameter("param", "name", "desc",
                new InputLiteralType(new InputPrimitiveType(InputPrimitiveTypeKind.String), "bar"),
                RequestLocation.Header, null, InputOperationParameterKind.Client, true, false, true, false, false,
                false, false, null, null);
            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(new InputNamespace(
                "test library",
                new List<string>(),
                new List<InputEnumType>(),
                new List<InputModelType> {inputModel},
                new List<InputClient>
                {
                    new InputClient("fooClient", "desc", new[]
                    {
                        new InputOperation("testoperation", "name", "desc", null, null, new[]
                        {
                            param
                        }, Array.Empty<OperationResponse>(), "GET", BodyMediaType.Json, "http://example.com", "baz", null, null, true, null, null, true, true)
                    }, new []{param}, null)
                },
                new InputAuth()));

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputModel, ItExpr.IsNull<TypeProvider>());
            _mockVisitor.Protected().Verify<MethodProvider>("Visit", Times.Once(), inputModelProperty, ItExpr.IsNull<PropertyProvider>());
        }
    }
}
