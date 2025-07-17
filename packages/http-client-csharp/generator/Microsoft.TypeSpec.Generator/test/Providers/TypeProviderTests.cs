// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class TypeProviderTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestUpdateCanonicalView()
        {
            var typeProvider = new TestTypeProvider();
            var methodProvider = new MethodProvider(
                new MethodSignature("Test", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), typeProvider);

            typeProvider.Update(methods: [methodProvider]);
            var updatedMethods = typeProvider.CanonicalView.Methods;
            Assert.IsNotNull(updatedMethods);
            Assert.AreEqual(1, updatedMethods!.Count);
            Assert.AreEqual(methodProvider, updatedMethods[0]);
        }

        [Test]
        public async Task TestLoadLastContractView()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var typeProvider = new TestTypeProvider(name: "TestLoadLastContractView");
            var lastContractView = typeProvider.LastContractView;

            Assert.IsNotNull(lastContractView);
            Assert.AreEqual("TestLoadLastContractView", lastContractView!.Name);

            var methods = lastContractView.Methods;
            Assert.AreEqual(1, methods.Count);

            var signature = methods[0].Signature;
            Assert.AreEqual("Foo", signature.Name);
            Assert.AreEqual("p1", signature.Parameters[0].Name);
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task TestCustomizeNestedTypes(bool isNestedTypeAnEnum)
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            TypeProvider nestedType;
            if (isNestedTypeAnEnum)
            {
                var inputEnum = InputFactory.Int32Enum("TestEnum", [("Value1", 0), ("Value2", 1), ("Value3", 2)], clientNamespace: "Test");
                nestedType = EnumProvider.Create(inputEnum, new TestTypeProvider(name: "TestCustomizeNestedTypes"));
            }
            else
            {
                nestedType = new TestTypeProvider(name: "NestedType");
            }

            var typeProvider = new TestTypeProvider(name: "TestCustomizeNestedTypes");
            typeProvider.NestedTypesInternal = [nestedType];
            Assert.IsNotNull(typeProvider.CustomCodeView);

            var nestedTypes = typeProvider.NestedTypes;
            var expectedCount = isNestedTypeAnEnum ? 0 : 1;
            Assert.AreEqual(expectedCount, nestedTypes.Count);
        }

        [Test]
        public async Task CanCustomizeNestedTypesWithRenamedDeclaringType()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            TypeProvider nestedType;
            var inputEnum = InputFactory.Int32Enum("TestEnum", [("Value1", 0), ("Value2", 1), ("Value3", 2)], clientNamespace: "Test");
            nestedType = EnumProvider.Create(inputEnum, new TestTypeProvider(name: "TestCustomizeNestedTypes"));

            var typeProvider = new TestTypeProvider(name: "TestCustomizeNestedTypes");
            typeProvider.NestedTypesInternal = [nestedType];
            Assert.IsNotNull(typeProvider.CustomCodeView);
            Assert.AreEqual("RenamedType", typeProvider.Name);

            var nestedTypes = typeProvider.NestedTypes;
            Assert.AreEqual(0, nestedTypes.Count);
        }

        [Test]
        public void CanUpdateTypeProvider()
        {
            var typeProvider = new TestTypeProvider(name: "OriginalName",
                methods: [new MethodProvider(
                new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), new TestTypeProvider())]);
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };
            typeProvider.Update(name: "UpdatedName", methods: [], attributes: attributes);
            Assert.AreEqual("UpdatedName", typeProvider.Name);
            Assert.AreEqual(0, typeProvider.Methods.Count);

            // Check that the attributes are updated correctly
            Assert.IsNotNull(typeProvider.Attributes);
            Assert.AreEqual(attributes.Count, typeProvider.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, typeProvider.Attributes[i].Type);
                Assert.IsTrue(typeProvider.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }


            typeProvider.Reset();

            // The BuildX methods should be called again, which will return the original state.
            Assert.AreEqual("OriginalName", typeProvider.Name);
            Assert.AreEqual(1, typeProvider.Methods.Count);
        }

        [Test]
        public void CanResetTypeProvider()
        {
            var typeProvider = new TestTypeProvider(name: "OriginalName",
                methods: [new MethodProvider(
                new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), new TestTypeProvider())]);
            typeProvider.Update(name: "UpdatedName", methods: []);
            Assert.AreEqual("UpdatedName", typeProvider.Name);
            Assert.AreEqual(0, typeProvider.Methods.Count);

            typeProvider.Reset();

            // The BuildX methods should be called again, which will return the original state.
            Assert.AreEqual("OriginalName", typeProvider.Name);
            Assert.AreEqual(1, typeProvider.Methods.Count);
        }

        [Test]
        public void CanUpdateWithReset()
        {
            var typeProvider = new TestTypeProvider(name: "OriginalName",
                methods: [new MethodProvider(
                    new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"", []),
                    Snippet.Throw(Snippet.Null), new TestTypeProvider())]);
            typeProvider.Update(methods: []);
            Assert.AreEqual(0, typeProvider.Methods.Count);

            typeProvider.Update(name: "UpdatedName", reset: true);
            Assert.AreEqual("UpdatedName", typeProvider.Name);
            // The BuildX methods should be called again, which will return the original state.
            Assert.AreEqual(1, typeProvider.Methods.Count);
        }
    }
}
