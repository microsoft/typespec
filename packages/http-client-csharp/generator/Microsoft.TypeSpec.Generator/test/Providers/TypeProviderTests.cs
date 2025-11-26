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

        [Test]
        public async Task LastContractViewLoadedForRenamedType()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var typeProvider = new TestTypeProvider(name: "TestLoadLastContractView");
            var lastContractView = typeProvider.LastContractView;

            Assert.IsNull(lastContractView);

            typeProvider.Update(name: "RenamedType");
            lastContractView = typeProvider.LastContractView;
            Assert.IsNotNull(lastContractView);

            var methods = lastContractView!.Methods;
            Assert.AreEqual(1, methods.Count);

            var signature = methods[0].Signature;
            Assert.AreEqual("Foo", signature.Name);
            Assert.AreEqual("p1", signature.Parameters[0].Name);
        }

        // This test validates that the last contract view for a type that is renamed via visitor and customization is loaded correctly.
        [Test]
        public async Task LastContractViewLoadedForRenamedVisitedType()
        {
            // load the custom code view and last contract. False => custom code view. True => last contract view.
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "False"),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "True"));
            var typeProvider = new TestTypeProvider(name: "TestType", ns: "SampleTypeSpec");

            var customCodeView = typeProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            Assert.AreEqual("RenamedType", customCodeView!.Name);

            var lastContractView = typeProvider.LastContractView;
            Assert.IsNull(lastContractView);

            typeProvider.Update(name: "RenamedTypeAgain");
            lastContractView = typeProvider.LastContractView;
            Assert.IsNotNull(lastContractView);

            Assert.AreEqual("RenamedTypeAgain", lastContractView!.Name);

            var methods = lastContractView!.Methods;
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

        [Test]
        public void TestCanUpdateAttributes()
        {
            var typeProvider = new TestTypeProvider(name: "OriginalName",
               methods: [new MethodProvider(
                    new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"", []),
                    Snippet.Throw(Snippet.Null), new TestTypeProvider())]);
            typeProvider.Update(attributes: [
                    new(typeof(ObsoleteAttribute))
                ]);

            Assert.IsNotNull(typeProvider.Attributes);
            Assert.AreEqual(1, typeProvider.Attributes.Count);
            Assert.AreEqual(new CSharpType(typeof(ObsoleteAttribute)), typeProvider.Attributes[0].Type);

            // now reset and validate
            typeProvider.Reset();
            Assert.AreEqual(0, typeProvider.Attributes.Count);

            // re-add the attributes
            typeProvider.Update(attributes: [
                new(typeof(ObsoleteAttribute))
            ]);

            Assert.AreEqual(1, typeProvider.Attributes.Count);
            Assert.AreEqual(new CSharpType(typeof(ObsoleteAttribute)), typeProvider.Attributes[0].Type);
        }

        [Test]
        public async Task TestCanCustomizeTypeWithChangedName()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var testTypeProvider = new TestTypeProvider();
            Assert.IsNull(testTypeProvider.CustomCodeView);
            testTypeProvider.Update(name: "RenamedType");
            Assert.IsNotNull(testTypeProvider.CustomCodeView);
            Assert.AreEqual("RenamedType", testTypeProvider.Type.Name);
        }

        [Test]
        public async Task TestCanCustomizeTypeWithChangedNamespace()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var testTypeProvider = new TestTypeProvider();
            Assert.IsNull(testTypeProvider.CustomCodeView);

            testTypeProvider.Update(@namespace: "NewNamespace");
            Assert.IsNotNull(testTypeProvider.CustomCodeView);
            Assert.AreEqual("NewNamespace", testTypeProvider.Type.Namespace);
        }

        [Test]
        public async Task TestCanCustomizePropertyTypeWithChangedNameAndChangedNamespace()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var inputProperty = InputFactory.Property("Prop", InputPrimitiveType.String);
            var inputModel = InputFactory.Model("Test", properties: [inputProperty]);
            var property = new PropertyProvider(inputProperty, new TestTypeProvider());
            var testTypeProvider = new TestTypeProvider(properties: [property]);

            testTypeProvider.Update(@namespace: "NewNamespace");
            testTypeProvider.Update(name: "Foo");
            Assert.IsNotNull(testTypeProvider.CustomCodeView);
            Assert.AreEqual(1, testTypeProvider.CanonicalView.Properties.Count);
            Assert.AreEqual(typeof(System.Int32), testTypeProvider.CanonicalView.Properties[0].Type.FrameworkType);
        }

        [Test]
        public void TestSpecViewReturnsAllProperties()
        {
            var property1 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string), "Prop1",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());
            var property2 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(int), "Prop2",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());
            var property3 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(bool), "Prop3",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());

            var typeProvider = new TestTypeProvider(properties: [property1, property2, property3]);

            // Regular Properties view returns all 3 (no customization)
            Assert.AreEqual(3, typeProvider.Properties.Count);

            // SpecView should also return all 3
            var specView = typeProvider.SpecView;
            Assert.IsNotNull(specView);
            Assert.AreEqual(3, specView.Properties.Count);
            Assert.AreEqual("Prop1", specView.Properties[0].Name);
            Assert.AreEqual("Prop2", specView.Properties[1].Name);
            Assert.AreEqual("Prop3", specView.Properties[2].Name);
        }

        [Test]
        public async Task TestSpecViewReturnsAllPropertiesEvenWhenCustomized()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var property1 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string), "Prop1",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());
            var property2 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(int), "Prop2",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());
            var property3 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(bool), "Prop3",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "TestSpecViewWithCustomization", properties: [property1, property2, property3]);

            // CustomCodeView has Prop1 customized, so regular Properties view should filter it out
            Assert.IsNotNull(typeProvider.CustomCodeView);
            Assert.AreEqual(2, typeProvider.Properties.Count); // Only Prop2 and Prop3
            Assert.AreEqual("Prop2", typeProvider.Properties[0].Name);
            Assert.AreEqual("Prop3", typeProvider.Properties[1].Name);

            // SpecView should return all 3 properties (unfiltered)
            var specView = typeProvider.SpecView;
            Assert.IsNotNull(specView);
            Assert.AreEqual(3, specView.Properties.Count);
            Assert.AreEqual("Prop1", specView.Properties[0].Name);
            Assert.AreEqual("Prop2", specView.Properties[1].Name);
            Assert.AreEqual("Prop3", specView.Properties[2].Name);
        }

        [Test]
        public void TestSpecViewReturnsAllMethods()
        {
            // Create a type provider with 3 methods
            var method1 = new MethodProvider(
                new MethodSignature("Method1", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), new TestTypeProvider());
            var method2 = new MethodProvider(
                new MethodSignature("Method2", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), new TestTypeProvider());
            var method3 = new MethodProvider(
                new MethodSignature("Method3", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), new TestTypeProvider());

            var typeProvider = new TestTypeProvider(methods: [method1, method2, method3]);

            // Regular Methods view returns all 3 (no customization)
            Assert.AreEqual(3, typeProvider.Methods.Count);

            // SpecView should also return all 3
            var specView = typeProvider.SpecView;
            Assert.IsNotNull(specView);
            Assert.AreEqual(3, specView.Methods.Count);
            Assert.AreEqual("Method1", specView.Methods[0].Signature.Name);
            Assert.AreEqual("Method2", specView.Methods[1].Signature.Name);
            Assert.AreEqual("Method3", specView.Methods[2].Signature.Name);
        }

        [Test]
        public async Task TestSpecViewReturnsAllMethodsEvenWhenCustomized()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Create a type provider with 3 methods
            var typeProvider = new TestTypeProvider(name: "TestSpecViewWithCustomization");
            var method1 = new MethodProvider(
                new MethodSignature("Method1", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), typeProvider);
            var method2 = new MethodProvider(
                new MethodSignature("Method2", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), typeProvider);
            var method3 = new MethodProvider(
                new MethodSignature("Method3", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), typeProvider);

            typeProvider = new TestTypeProvider(name: "TestSpecViewWithCustomization", methods: [method1, method2, method3]);

            // CustomCodeView has Method1 customized, so regular Methods view should filter it out
            Assert.IsNotNull(typeProvider.CustomCodeView);
            Assert.AreEqual(2, typeProvider.Methods.Count); // Only Method2 and Method3
            Assert.AreEqual("Method2", typeProvider.Methods[0].Signature.Name);
            Assert.AreEqual("Method3", typeProvider.Methods[1].Signature.Name);

            // SpecView should return all 3 methods (unfiltered)
            var specView = typeProvider.SpecView;
            Assert.IsNotNull(specView);
            Assert.AreEqual(3, specView.Methods.Count);
            Assert.AreEqual("Method1", specView.Methods[0].Signature.Name);
            Assert.AreEqual("Method2", specView.Methods[1].Signature.Name);
            Assert.AreEqual("Method3", specView.Methods[2].Signature.Name);
        }

        [Test]
        public async Task TestSpecViewReturnsAllPropertiesEvenWhenSuppressed()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var property1 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string), "SuppressedProp",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());
            var property2 = new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string), "Prop2",
                new AutoPropertyBody(HasSetter: true), new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "TestSpecViewWithSuppression", properties: [property1, property2]);

            // CustomCodeView has SuppressedProp marked with CodeGenSuppress attribute
            Assert.IsNotNull(typeProvider.CustomCodeView);
            Assert.AreEqual(1, typeProvider.Properties.Count); // Only Prop2
            Assert.AreEqual("Prop2", typeProvider.Properties[0].Name);

            // SpecView should return all 2 properties (unfiltered)
            var specView = typeProvider.SpecView;
            Assert.IsNotNull(specView);
            Assert.AreEqual(2, specView.Properties.Count);
            Assert.AreEqual("SuppressedProp", specView.Properties[0].Name);
            Assert.AreEqual("Prop2", specView.Properties[1].Name);
        }

        [Test]
        public void TestSpecViewIsNotNull()
        {
            var typeProvider = new TestTypeProvider();
            var specView = typeProvider.SpecView;

            Assert.IsNotNull(specView);
            Assert.IsInstanceOf<TypeProvider>(specView);
        }

        [Test]
        public void TestSpecViewDelegatesCorrectly()
        {
            // Create a type provider with properties and methods
            var method = new MethodProvider(
                new MethodSignature("TestMethod", $"", MethodSignatureModifiers.Public, null, $"", []),
                Snippet.Throw(Snippet.Null), new TestTypeProvider());

            var typeProvider = new TestTypeProvider(
                name: "TestType",
                properties: [new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string), "TestProp", new AutoPropertyBody(HasSetter: true), new TestTypeProvider())],
                methods: [method]);

            var specView = typeProvider.SpecView;

            // Verify that SpecView delegates to the underlying provider's Build methods
            Assert.AreEqual(1, specView.Properties.Count);
            Assert.AreEqual(1, specView.Methods.Count);
            Assert.AreEqual("TestProp", specView.Properties[0].Name);
            Assert.AreEqual("TestMethod", specView.Methods[0].Signature.Name);
            Assert.AreEqual("TestType", specView.Name);
        }
    }
}
