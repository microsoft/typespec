// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
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
    }
}
