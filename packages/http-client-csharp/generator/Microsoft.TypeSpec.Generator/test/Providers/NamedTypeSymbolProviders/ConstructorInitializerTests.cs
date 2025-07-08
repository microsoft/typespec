// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
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

        private static Compilation CreateCompilationFromSource(string source)
        {
            var syntaxTree = CSharpSyntaxTree.ParseText(source);
            return CSharpCompilation.Create(
                assemblyName: "TestAssembly",
                syntaxTrees: [syntaxTree],
                references: [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
        }

        [Test]
        public void CustomConstructorWithThisInitializerShouldHaveInitializerPopulated()
        {
            // Arrange
            var customCode = @"
using System;

namespace Sample.Models
{
    public class TestClass
    {
        public TestClass(int bar) : this(bar, ""default"")
        {
        }
        
        public TestClass(int bar, string name)
        {
        }
    }
}";

            var compilation = CreateCompilationFromSource(customCode);
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
        public void CustomConstructorWithBaseInitializerShouldHaveInitializerPopulated()
        {
            // Arrange
            var customCode = @"
using System;

namespace Sample.Models
{
    public class BaseClass
    {
        public BaseClass(string name) { }
    }

    public class TestClass : BaseClass
    {
        public TestClass(string value) : base(value)
        {
        }
    }
}";

            var compilation = CreateCompilationFromSource(customCode);
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
        public void CustomConstructorWithoutInitializerShouldHaveNullInitializer()
        {
            // Arrange
            var customCode = @"
using System;

namespace Sample.Models
{
    public class TestClass
    {
        public TestClass()
        {
        }
    }
}";

            var compilation = CreateCompilationFromSource(customCode);
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