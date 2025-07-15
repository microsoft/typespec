// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class XmlDocProviderTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private Mock<CodeModelGenerator> _mockGenerator;
        private Mock<LibraryVisitor> _mockVisitor;
        private Mock<InputLibrary> _mockInputLibrary;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        [SetUp]
        public void Setup()
        {
            _mockGenerator = MockHelpers.LoadMockGenerator(
                createModelCore: inputModelType => new ModelProvider(inputModelType),
                createEnumCore: (inputEnumType, _) => EnumProvider.Create(inputEnumType));
            _mockVisitor = new Mock<LibraryVisitor> { CallBase = true };
            _mockInputLibrary = new Mock<InputLibrary>();
            _mockGenerator.Setup(p => p.InputLibrary).Returns(_mockInputLibrary.Object);
        }

        [Test]
        public void ValidateXmlDocShouldChangeFromVisitors()
        {
            _mockGenerator.Object.AddVisitor(new TestVisitor());

            // visit the library
            foreach (var visitor in _mockGenerator.Object.Visitors)
            {
                visitor.VisitLibrary(_mockGenerator.Object.OutputLibrary);
            }

            // check if the parameter names in xml docs are changed accordingly.
        }

        private class TestVisitor : LibraryVisitor
        {
            protected internal override MethodProvider? VisitMethod(MethodProvider method)
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
