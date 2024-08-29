// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
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
            _mockInputLibrary = new Mock<InputLibrary>();
            _mockPlugin.Setup(p => p.InputLibrary).Returns(_mockInputLibrary.Object);
        }

        [Test]
        public void PreVisitsProperties()
        {
            _mockPlugin.Object.AddVisitor(_mockVisitor.Object);
            var inputModelProperty = InputFactory.Property("prop1", InputPrimitiveType.Any, true, true);
            var inputModel = InputFactory.Model("foo", "internal", usage: InputModelTypeUsage.Input, properties: [inputModelProperty]);

            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace("test library", models: [inputModel]));

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputModel, ItExpr.Is<ModelProvider>(m => m.Name == new ModelProvider(inputModel).Name));
            _mockVisitor.Protected().Verify<PropertyProvider>("Visit", Times.Once(), inputModelProperty, ItExpr.Is<PropertyProvider>(m => m.Name == new PropertyProvider(inputModelProperty, new TestTypeProvider()).Name));
        }

        [Test]
        public void PreVisitsEnum()
        {
            _mockPlugin.Object.AddVisitor(_mockVisitor.Object);
            var inputEnum = InputFactory.Enum("enum", InputPrimitiveType.Int32, usage: InputModelTypeUsage.Input, values: [InputFactory.EnumMember.Int32("value", 1)]);
            var inputModelProperty = InputFactory.Property("prop1", inputEnum, true, true);
            var inputModel = InputFactory.Model("foo", "internal", usage: InputModelTypeUsage.Input, properties: [inputModelProperty]);

            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace("test library", models: [inputModel]));

            _mockVisitor.Object.Visit(_mockPlugin.Object.OutputLibrary);

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputModel, ItExpr.Is<ModelProvider>(m => m.Name == new ModelProvider(inputModel).Name));

            _mockVisitor.Protected().Verify<TypeProvider>("Visit", Times.Once(), inputEnum, ItExpr.Is<EnumProvider>(m => m.Name == EnumProvider.Create(inputEnum, null).Name));
        }

        [Test]
        public void RemovedInputModelCausesExceptionWhenReferencedInDifferentModel()
        {
            var inputModel1Property = InputFactory.Property("prop1", InputPrimitiveType.Any, true, true);
            var inputModel1 = InputFactory.Model("Model1", "internal", usage: InputModelTypeUsage.Input, properties: [inputModel1Property]);

            var inputModel2Property = InputFactory.Property("prop2", inputModel1, true, true);

            var inputModel2 = InputFactory.Model("Model2", "internal", usage: InputModelTypeUsage.Input, properties: [inputModel2Property]);

            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace("test library", models: [inputModel1, inputModel2]));

            var visitor = new PreVisitor();
            _mockPlugin.Object.AddVisitor(visitor);
            Assert.Throws<InvalidOperationException>(() => visitor.Visit(_mockPlugin.Object.OutputLibrary));
        }

        [Test]
        public void CanCleanUpRemovedReferencesToRemovedModels()
        {
            var inputModel1Property = InputFactory.Property("prop1", InputPrimitiveType.Any, true, true);
            var inputModel1 = InputFactory.Model("Model1", "internal", usage: InputModelTypeUsage.Input, properties: [inputModel1Property]);

            var inputModel2Property = InputFactory.Property("prop2", inputModel1, true, true);

            var inputModel2 = InputFactory.Model("Model2", "internal", usage: InputModelTypeUsage.Input, properties: [inputModel2Property]);

            _mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace("test library", models: [inputModel1, inputModel2]));

            var visitor = new PreVisitor(true);
            _mockPlugin.Object.AddVisitor(visitor);
            Assert.DoesNotThrow(() => visitor.Visit(_mockPlugin.Object.OutputLibrary));
        }

        private class PreVisitor : LibraryVisitor
        {
            private readonly bool _cleanupReference;

            public PreVisitor(bool cleanupReference = false)
            {
                _cleanupReference = cleanupReference;
            }
            protected internal override ModelProvider? Visit(InputModelType inputModel, ModelProvider? typeProvider)
            {
                if (inputModel.Name == "Model1")
                {
                    return null;
                }
                return base.Visit(inputModel, typeProvider);
            }

            protected internal override PropertyProvider? Visit(InputModelProperty inputModelProperty, PropertyProvider? propertyProvider)
            {
                if (_cleanupReference && inputModelProperty.Type.Name == "Model1")
                {
                    return null;
                }
                return new PropertyProvider(inputModelProperty, new TestTypeProvider());
            }
        }
    }
}
