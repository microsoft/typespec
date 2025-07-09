// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public class ConstructorInitializerTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public async Task CustomConstructorWithThisInitializerShouldHaveInitializerPopulated()
        {
            // Arrange
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var testClassSymbol = compilation.GetTypeByMetadataName("Sample.Models.TestClass");
            var provider = new NamedTypeSymbolProvider(testClassSymbol!);

            // Act
            var constructors = provider.Constructors;

            // Assert
            Assert.AreEqual(2, constructors.Count);

            var constructorWithInitializer = constructors.FirstOrDefault(c => c.Signature.Parameters.Count == 1);
            Assert.IsNotNull(constructorWithInitializer, "Constructor with single parameter should exist");
            
            // This should pass after the fix - currently fails because Initializer is null
            Assert.IsNotNull(constructorWithInitializer!.Signature.Initializer, "Constructor initializer should be populated");
            Assert.IsFalse(constructorWithInitializer.Signature.Initializer!.IsBase, "Should be 'this' initializer, not 'base'");
            Assert.AreEqual(2, constructorWithInitializer.Signature.Initializer.Arguments.Count, "Should have 2 arguments in initializer");
        }

        [Test]
        public async Task CustomConstructorWithBaseInitializerShouldHaveInitializerPopulated()
        {
            // Arrange
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var testClassSymbol = compilation.GetTypeByMetadataName("Sample.Models.TestClass");
            var provider = new NamedTypeSymbolProvider(testClassSymbol!);

            // Act
            var constructors = provider.Constructors;

            // Assert
            Assert.AreEqual(1, constructors.Count);

            var constructorWithInitializer = constructors.First();
            
            // This should pass after the fix - currently fails because Initializer is null
            Assert.IsNotNull(constructorWithInitializer.Signature.Initializer, "Constructor initializer should be populated");
            Assert.IsTrue(constructorWithInitializer.Signature.Initializer!.IsBase, "Should be 'base' initializer");
            Assert.AreEqual(1, constructorWithInitializer.Signature.Initializer.Arguments.Count, "Should have 1 argument in initializer");
        }

        [Test]
        public async Task CustomConstructorWithoutInitializerShouldHaveNullInitializer()
        {
            // Arrange
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var testClassSymbol = compilation.GetTypeByMetadataName("Sample.Models.TestClass");
            var provider = new NamedTypeSymbolProvider(testClassSymbol!);

            // Act
            var constructors = provider.Constructors;

            // Assert
            Assert.AreEqual(1, constructors.Count);

            var constructor = constructors.First();
            Assert.IsNull(constructor.Signature.Initializer, "Constructor without initializer should have null Initializer");
        }
    }
}