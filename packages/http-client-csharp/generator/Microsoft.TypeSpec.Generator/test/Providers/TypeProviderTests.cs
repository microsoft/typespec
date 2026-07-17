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
using Microsoft.TypeSpec.Generator.Utilities;
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
        public void BuildAttributesForBackCompatibilityReturnsGeneratedAttributesWhenNoLastContract()
        {
            var provider = CreateAttributeTestProvider(attributes:
            [
                new AttributeStatement(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                new AttributeStatement(typeof(SerializableAttribute)),
            ]);

            // With no last contract to restore attributes from, back-compat processing leaves the generated
            // attributes unchanged.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilityAddsAttributeFromLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract declares [CLSCompliant(true)] which is not present in the generated set, so it
            // should be appended by back-compat processing.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilityDoesNotDuplicateExistingAttribute()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The generated set already contains the same [CLSCompliant(true)] attribute that the last
            // contract declares, so nothing new is added.
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType", attributes:
            [
                new AttributeStatement(typeof(CLSCompliantAttribute), Snippet.Literal(true)),
            ]);

            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilitySkipsAttributesAlreadyInCustomCode()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Custom"),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract declares a mix of attributes: [CLSCompliant(true)] which is also present in
            // the custom code, and [Restorable] which is new. Only the [Restorable] attribute should be
            // restored because the [CLSCompliant(true)] attribute already exists in the custom code.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilitySkipsCodeGenAttributes()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract only declares a CodeGen-specific attribute, which is never restored, so the
            // generated (empty) set is left unchanged.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilitySkipsAllCodeGenPrefixedAttributes()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract declares a mix: a CodeGen-prefixed attribute ([CodeGenModel("Something")])
            // that is not one of the explicitly-known CodeGen attributes, and a [Restorable] attribute. Only
            // [Restorable] should be restored because any CodeGen-prefixed attribute is never restored.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilitySkipsEditorBrowsableAttribute()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract only declares an EditorBrowsable attribute, which generation owns and is
            // never restored, so the generated (empty) set is left unchanged.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilitySkipsExperimentalAttribute()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract only declares an Experimental attribute, which generation owns and is never
            // restored, so the generated (empty) set is left unchanged.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilitySkipsDefaultMemberAttribute()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract declares a mix: a [DefaultMember] attribute (which indicates specific
            // runtime behavior and is never restored) and a [Restorable] attribute. Only [Restorable]
            // should be restored.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilityRestoresAttributeWithIntegralLiteralArguments()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType");

            // The last contract declares an attribute whose arguments use every integral literal kind
            // (byte/sbyte/short/ushort/uint/ulong). These must be rendered without throwing so the
            // attribute can be restored rather than crashing generation.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        private static string Write(TypeProvider provider) =>
            CodeModelGenerator.Instance.GetWriter(provider).Write().Content;

        [Test]
        public async Task BuildAttributesForBackCompatibilityDoesNotRestoreForInternalType()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var provider = CreateAttributeTestProvider(
                name: "BackCompatAttributeType",
                declarationModifiers: TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class);

            // The last contract declares [CLSCompliant(true)], but attribute restoration only applies to
            // externally visible (public or protected) types. Since the generated type is internal, nothing
            // is restored.
            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        [Test]
        public async Task BuildAttributesForBackCompatibilityDeduplicatesAcrossGeneratedCustomAndLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters: "Custom"),
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The type has an attribute in each of the three sources:
            //   - generated:     [Obsolete("This is obsolete")]
            //   - custom code:   [CLSCompliant(true)]
            //   - last contract: [Obsolete("This is obsolete")], [CLSCompliant(true)], [Restorable]
            // Back-compat merging should not produce duplicates: the generated [Obsolete] and the
            // custom-code [CLSCompliant] already cover two of the last-contract attributes, so only the
            // new [Restorable] attribute is restored.
            var provider = CreateAttributeTestProvider(name: "BackCompatAttributeType", attributes:
            [
                new AttributeStatement(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
            ]);

            provider.ProcessTypeForBackCompatibility();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), Write(provider));
        }

        private static TestTypeProvider CreateAttributeTestProvider(
            string? name = null,
            IEnumerable<MethodBodyStatement>? attributes = null,
            TypeSignatureModifiers? declarationModifiers = null) =>
            new TestTypeProvider(
                name: name ?? "TestName",
                declarationModifiers: declarationModifiers ?? (TypeSignatureModifiers.Public | TypeSignatureModifiers.Class),
                attributes: attributes);

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

        // Validates that a custom TypeProvider inherits the parameter-reordering back-compat behavior
        // from the base TypeProvider.
        [Test]
        public async Task CustomTypeProviderInheritsParameterReorderBackCompat()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Current generation declares Foo(second, first) — the reverse of the last contract's
            // Foo(first, second).
            var first = new ParameterProvider("first", $"", new CSharpType(typeof(string)));
            var second = new ParameterProvider("second", $"", new CSharpType(typeof(int)));
            var currentFoo = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [second, first]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "CustomReorderType", ns: "Test", methods: [currentFoo]);

            // The custom type does not override BuildMethodsForBackCompatibility; the base default
            // restores the previous parameter order in place.
            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // Validates that when restoring a previous parameter order, the previously published default
        // value representation is preserved (e.g. a value-type parameter keeps its literal `= 0`
        // rather than flipping to `= default`).
        [Test]
        public async Task CustomTypeProviderReorderPreservesValueTypeDefaults()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Current generation declares Foo(flag, count) with `default`-keyword defaults — the
            // reverse of the last contract's Foo(int count = 0, bool flag = false).
            var flag = new ParameterProvider("flag", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default);
            var count = new ParameterProvider("count", $"", new CSharpType(typeof(int)), defaultValue: Snippet.Default);
            var currentFoo = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [flag, count]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "CustomReorderValueTypeDefaultsType", ns: "Test", methods: [currentFoo]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // Validates that the base BuildMethodsForBackCompatibility default does NOT restore the
        // previous parameter order when that removal has been accepted in the ApiCompat baseline.
        [Test]
        public async Task BuildMethodsForBackCompatibilitySkipsReorderAcceptedInBaseline()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile();

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                apiCompatBaseline: baseline);

            // Current generation declares Foo(second, first) — the reverse of the last contract's
            // Foo(first, second) — but the reorder is an accepted removal in the ApiCompat baseline,
            // so the base default must leave the current order untouched.
            var first = new ParameterProvider("first", $"", new CSharpType(typeof(string)));
            var second = new ParameterProvider("second", $"", new CSharpType(typeof(int)));
            var currentFoo = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [second, first]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "SkipReorderType", ns: "Test", methods: [currentFoo]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // Validates that the base TypeProvider generalizes the non-abstract base model back-compat to
        // any TypeProvider: a type the current generation would declare abstract is kept non-abstract
        // when the last contract published it as a non-abstract class.
        [Test]
        public async Task BuildDeclarationModifiersPreservesNonAbstractFromLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var typeProvider = new TestTypeProvider(
                name: "NonAbstractPreservedType",
                ns: "Test",
                declarationModifiers: TypeSignatureModifiers.Public | TypeSignatureModifiers.Abstract | TypeSignatureModifiers.Class);

            Assert.IsFalse(
                typeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract),
                "Expected the abstract modifier to be removed to match the non-abstract last contract.");
        }

        // Validates the negative case: without a last contract, a type the current generation declares
        // abstract stays abstract (the preservation only applies against a non-abstract last contract).
        [Test]
        public void BuildDeclarationModifiersKeepsAbstractWithoutLastContract()
        {
            var typeProvider = new TestTypeProvider(
                name: "AbstractNoContractType",
                ns: "Test",
                declarationModifiers: TypeSignatureModifiers.Public | TypeSignatureModifiers.Abstract | TypeSignatureModifiers.Class);

            Assert.IsTrue(typeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
        }

        // Validates that the base TypeProvider generalizes the model-constructor back-compat to any
        // abstract TypeProvider: a private-protected constructor is promoted to public when the last
        // contract published a matching public constructor.
        [Test]
        public async Task BuildConstructorsForBackCompatibilityPromotesPrivateProtectedToPublic()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var baseProp = new ParameterProvider("baseProp", $"", new CSharpType(typeof(string)));
            var currentConstructor = new ConstructorProvider(
                new ConstructorSignature(
                    new CSharpType(typeof(object)),
                    $"",
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected,
                    [baseProp]),
                Snippet.ThrowExpression(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(
                name: "PromoteCtorType",
                ns: "Test",
                declarationModifiers: TypeSignatureModifiers.Public | TypeSignatureModifiers.Abstract | TypeSignatureModifiers.Class,
                constructors: [currentConstructor]);

            typeProvider.ProcessTypeForBackCompatibility();

            var promoted = typeProvider.Constructors.Single();
            Assert.IsTrue(promoted.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsFalse(promoted.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Private));
            Assert.IsFalse(promoted.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
        }

        // Validates the negative case: a non-abstract type does not get its private-protected
        // constructor promoted, even with a matching public constructor in the last contract.
        [Test]
        public async Task BuildConstructorsForBackCompatibilityKeepsModifierOnNonAbstractType()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var baseProp = new ParameterProvider("baseProp", $"", new CSharpType(typeof(string)));
            var currentConstructor = new ConstructorProvider(
                new ConstructorSignature(
                    new CSharpType(typeof(object)),
                    $"",
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Protected,
                    [baseProp]),
                Snippet.ThrowExpression(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(
                name: "KeepCtorType",
                ns: "Test",
                declarationModifiers: TypeSignatureModifiers.Public | TypeSignatureModifiers.Class,
                constructors: [currentConstructor]);

            typeProvider.ProcessTypeForBackCompatibility();

            var constructor = typeProvider.Constructors.Single();
            Assert.IsTrue(constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Private));
            Assert.IsTrue(constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsFalse(constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
        }

        // Validates that the base TypeProvider generalizes the new-optional-parameter back-compat to any
        // TypeProvider: a public method that gained an optional non-body parameter relative to the last
        // contract gets a hidden overload matching the previous signature that delegates to the current one.
        [Test]
        public async Task BuildMethodsForBackCompatibilityAddsOverloadForNewOptionalParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published GetData(int param1); the current generation adds an optional
            // non-body parameter param2.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var getData = new MethodProvider(
                new MethodSignature("GetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [param1, param2]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "NewOptionalParamType", ns: "Test", methods: [getData]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: a STATIC method that gained an optional non-body parameter gets a hidden overload
        // whose body delegates through the declaring type (not `this`), since a static method cannot use
        // an instance receiver.
        [Test]
        public async Task BuildMethodsForBackCompatibilityAddsStaticOverloadForNewOptionalParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published static GetData(int param1); the current generation adds an
            // optional non-body parameter param2.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var getData = new MethodProvider(
                new MethodSignature("GetData", $"", MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, new CSharpType(typeof(string)), $"", [param1, param2]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "StaticOverloadType", ns: "Test", methods: [getData]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: a VOID method that gained an optional non-body parameter gets a hidden overload
        // whose body invokes the current method as a statement (no `return`), since a void method has no
        // value to return.
        [Test]
        public async Task BuildMethodsForBackCompatibilityAddsVoidOverloadForNewOptionalParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published void DoWork(int param1); the current generation adds an
            // optional non-body parameter param2.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var doWork = new MethodProvider(
                new MethodSignature("DoWork", $"", MethodSignatureModifiers.Public, null, $"", [param1, param2]),
                MethodBodyStatement.Empty,
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "VoidOverloadType", ns: "Test", methods: [doWork]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: an async Task<T> method that gained an optional non-body parameter gets a hidden
        // overload that is NOT declared 'async' (it returns the delegated task directly). An async shim
        // would emit `return this.FooAsync(...);` from an `async Task<T>` method, which is CS4016.
        [Test]
        public async Task BuildMethodsForBackCompatibilityAddsAsyncTaskOfTOverloadForNewOptionalParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published async Task<string> GetDataAsync(int param1); the current
            // generation adds an optional non-body parameter param2.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var getData = new MethodProvider(
                new MethodSignature("GetDataAsync", $"", MethodSignatureModifiers.Public | MethodSignatureModifiers.Async, new CSharpType(typeof(Task<string>)), $"", [param1, param2]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "AsyncOverloadType", ns: "Test", methods: [getData]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: an async Task (non-generic) method that gained an optional non-body parameter
        // gets a hidden overload that is NOT declared 'async' and returns the delegated task.
        [Test]
        public async Task BuildMethodsForBackCompatibilityAddsAsyncTaskOverloadForNewOptionalParameter()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published async Task DoWorkAsync(int param1); the current generation adds
            // an optional non-body parameter param2.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var doWork = new MethodProvider(
                new MethodSignature("DoWorkAsync", $"", MethodSignatureModifiers.Public | MethodSignatureModifiers.Async, new CSharpType(typeof(Task)), $"", [param1, param2]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "AsyncTaskOverloadType", ns: "Test", methods: [doWork]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: accepting the removal of ONE overload in the ApiCompat baseline must not suppress
        // the optional-parameter overload for a DIFFERENT overload with the same arity but different
        // parameter types. The baseline accepts removal of GetData(string); the current GetData(int)
        // gained an optional parameter and must still receive its back-compat overload.
        [Test]
        public async Task BuildMethodsForBackCompatibilityAddsOverloadWhenDifferentOverloadRemovalAccepted()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile();

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                apiCompatBaseline: baseline);

            // The last contract published GetData(int param1); the current generation adds an optional
            // param2. The baseline accepts removal of the unrelated GetData(string) overload only.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var getData = new MethodProvider(
                new MethodSignature("GetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [param1, param2]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "DifferentOverloadRemovalType", ns: "Test", methods: [getData]);

            typeProvider.ProcessTypeForBackCompatibility();

            // The GetData(int) overload is still added because only GetData(string) removal was accepted.
            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: a back-compat overload for a static extension method must preserve the extension
        // 'this' modifier so the generated shim is still an extension method (a common scenario is a
        // static "<Client>Extensions" class that gained an optional parameter).
        [Test]
        public async Task BuildMethodsForBackCompatibilityPreservesExtensionThisKeyword()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published a static extension method GetData(this object client, int param1);
            // the current generation adds an optional non-body parameter param2.
            var client = new ParameterProvider("client", $"", new CSharpType(typeof(object)));
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var getData = new MethodProvider(
                new MethodSignature(
                    "GetData",
                    $"",
                    MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    new CSharpType(typeof(string)),
                    $"",
                    [client, param1, param2]),
                Snippet.Return(Snippet.Literal("foo")),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "ExtensionOverloadType", ns: "Test", methods: [getData]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: a back-compat overload for a method with a 'ref' parameter must preserve the
        // 'ref' modifier on that parameter in the generated shim signature.
        [Test]
        public async Task BuildMethodsForBackCompatibilityPreservesRefKeyword()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published TryGetData(string value, ref int result); the current generation
            // adds an optional non-body parameter param2.
            var value = new ParameterProvider("value", $"", new CSharpType(typeof(string)));
            var result = new ParameterProvider("result", $"", new CSharpType(typeof(int)), isRef: true);
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var tryGetData = new MethodProvider(
                new MethodSignature("TryGetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(bool)), $"", [value, result, param2]),
                Snippet.Return(Snippet.False),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "RefOverloadType", ns: "Test", methods: [tryGetData]);

            typeProvider.ProcessTypeForBackCompatibility();

            // The back-compat shim reproduces the previous signature TryGetData(string value, ref int result)
            // with the 'ref' modifier retained on both the parameter and the delegating call.
            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: a back-compat overload for a method with an 'out' parameter must preserve the
        // 'out' modifier on both the parameter and the delegating call so the generated code compiles.
        [Test]
        public async Task BuildMethodsForBackCompatibilityPreservesOutKeyword()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The last contract published TryParse(string value, out int result); the current generation
            // adds an optional non-body parameter param2.
            var value = new ParameterProvider("value", $"", new CSharpType(typeof(string)));
            var result = new ParameterProvider("result", $"", new CSharpType(typeof(int)), isOut: true);
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var tryParse = new MethodProvider(
                new MethodSignature("TryParse", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(bool)), $"", [value, result, param2]),
                new MethodBodyStatement[]
                {
                    // Assign the out parameter so the generated method body is valid C#.
                    result.Assign(Snippet.Literal(0)).Terminate(),
                    Snippet.Return(Snippet.False),
                },
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "OutOverloadType", ns: "Test", methods: [tryParse]);

            typeProvider.ProcessTypeForBackCompatibility();

            // The back-compat shim reproduces the previous signature TryParse(string value, out int result)
            // with the 'out' modifier retained on both the parameter and the delegating call.
            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // TypeProvider: when a previous signature's removal is accepted in the ApiCompat baseline, the
        // optional-parameter overload pass must NOT resurrect it even though the replacement method added
        // optional parameters.
        [Test]
        public async Task BuildMethodsForBackCompatibilitySkipsOverloadForBaselineAcceptedRemoval()
        {
            var baseline = Helpers.GetApiCompatBaselineFromFile();

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                apiCompatBaseline: baseline);

            // The last contract published GetData(int param1); the current generation adds an optional
            // param2. The baseline accepts the removal of GetData(int), so no overload must be added.
            var param1 = new ParameterProvider("param1", $"", new CSharpType(typeof(int)));
            var param2 = new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query);
            var getData = new MethodProvider(
                new MethodSignature("GetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [param1, param2]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "SkipOverloadType", ns: "Test", methods: [getData]);

            typeProvider.ProcessTypeForBackCompatibility();

            // Only the current method remains; the accepted removal is not resurrected as an overload.
            Assert.AreEqual(1, typeProvider.Methods.Count);
            Assert.AreEqual(2, typeProvider.Methods[0].Signature.Parameters.Count);
        }

        // Validates the shared lookup that any provider can use to restore a previously-published
        // parameter name from its last contract.
        [Test]
        public async Task FindPreviousParameterNameLooksUpLastContract()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var lastContractView = new TestTypeProvider(name: "TestClient").LastContractView;

            // The last contract published Foo(string oldParam); scoped to that method it is found.
            Assert.AreEqual("oldParam", BackCompatHelper.FindPreviousParameterName(lastContractView, "oldParam", "Foo"));

            // The exact casing from the contract is returned even when the lookup name differs only in casing.
            Assert.AreEqual("oldParam", BackCompatHelper.FindPreviousParameterName(lastContractView, "oldparam", "Foo"));

            // The lookup is scoped: "oldParam" is not published on Other.
            Assert.IsNull(BackCompatHelper.FindPreviousParameterName(lastContractView, "oldParam", "Other"));

            // An unscoped lookup finds the parameter on any last-contract method.
            Assert.AreEqual("oldParam", BackCompatHelper.FindPreviousParameterName(lastContractView, "oldParam"));

            // A parameter that does not exist in the last contract returns null.
            Assert.IsNull(BackCompatHelper.FindPreviousParameterName(lastContractView, "missing", "Foo"));

            // A sync method name matches its async counterpart (BarAsync) in the contract.
            Assert.AreEqual("oldAsyncParam", BackCompatHelper.FindPreviousParameterName(lastContractView, "oldAsyncParam", "Bar"));
        }

        // Validates that the lookup returns null when there is no last contract.
        [Test]
        public void FindPreviousParameterNameReturnsNullWithoutLastContract()
        {
            var typeProvider = new TestTypeProvider(name: "TestClient");
            Assert.IsNull(typeProvider.LastContractView);
            Assert.IsNull(BackCompatHelper.FindPreviousParameterName(typeProvider.LastContractView, "oldParam", "Foo"));
        }

        [Test]
        public async Task TryRestorePreviousParameterOrderMatchesNonCanonicalParameterNames()
        {
            await MockHelpers.LoadMockGeneratorAsync();

            // Current generation declares Foo(second_param, first_param) — the reverse of the
            // previous Foo(first_param, second_param). The raw names are snake_case, so matching
            // requires normalizing both sides via ToVariableName.
            var firstParam = new ParameterProvider("first_param", $"", new CSharpType(typeof(string)));
            var secondParam = new ParameterProvider("second_param", $"", new CSharpType(typeof(int)));
            var currentFoo = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [secondParam, firstParam]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            var previousSignature = new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [
                    new ParameterProvider("first_param", $"", new CSharpType(typeof(string))),
                    new ParameterProvider("second_param", $"", new CSharpType(typeof(int))),
                ]);

            var reordered = BackCompatHelper.TryRestorePreviousParameterOrder(currentFoo, previousSignature);

            Assert.IsTrue(reordered);
            CollectionAssert.AreEqual(
                new[] { "first_param", "second_param" },
                currentFoo.Signature.Parameters.Select(p => p.Name).ToArray());
        }

        // Validates that the default-value preservation performed while reordering also matches by
        // the normalized parameter identifier, restoring the previously-published default onto the
        // current parameter even when the raw name is snake_case.
        [Test]
        public async Task TryRestorePreviousParameterOrderPreservesPreviousDefaultForNonCanonicalNames()
        {
            await MockHelpers.LoadMockGeneratorAsync();

            // Current declares Foo(second_param = default, first_param) — reverse of previous order.
            var firstParam = new ParameterProvider("first_param", $"", new CSharpType(typeof(string)));
            var secondParam = new ParameterProvider("second_param", $"", new CSharpType(typeof(int)), defaultValue: Snippet.Default);
            var currentFoo = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [secondParam, firstParam]),
                Snippet.Return(Snippet.Null),
                new TestTypeProvider());

            // The previously-published second_param carried a distinct default representation.
            var previousDefault = Snippet.Literal(0);
            var previousSignature = new MethodSignature(
                "Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [
                    new ParameterProvider("first_param", $"", new CSharpType(typeof(string))),
                    new ParameterProvider("second_param", $"", new CSharpType(typeof(int)), defaultValue: previousDefault),
                ]);

            var reordered = BackCompatHelper.TryRestorePreviousParameterOrder(currentFoo, previousSignature);

            Assert.IsTrue(reordered);
            CollectionAssert.AreEqual(
                new[] { "first_param", "second_param" },
                currentFoo.Signature.Parameters.Select(p => p.Name).ToArray());

            // The current second_param's default was restored from the previous contract.
            var restoredSecond = currentFoo.Signature.Parameters.Single(p => p.Name == "second_param");
            Assert.AreSame(previousDefault, restoredSecond.DefaultValue);
        }

        // Validates that a new optional parameter with an Unknown location is not treated as a
        // non-body parameter, so no back-compat overload is produced for it.
        [Test]
        public void HasNewOptionalNonBodyParametersOnlyRejectsUnknownLocation()
        {
            var previousSignature = new MethodSignature(
                "GetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [new ParameterProvider("param1", $"", new CSharpType(typeof(int)))]);

            // A new optional parameter whose location is Unknown must not qualify.
            var unknownLocationSignature = new MethodSignature(
                "GetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [
                    new ParameterProvider("param1", $"", new CSharpType(typeof(int))),
                    new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Unknown),
                ]);

            Assert.IsFalse(BackCompatHelper.HasNewOptionalNonBodyParametersOnly(previousSignature, unknownLocationSignature));

            // The same shape with an explicit non-body location does qualify.
            var queryLocationSignature = new MethodSignature(
                "GetData", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"",
                [
                    new ParameterProvider("param1", $"", new CSharpType(typeof(int))),
                    new ParameterProvider("param2", $"", new CSharpType(typeof(bool)), defaultValue: Snippet.Default, location: ParameterLocation.Query),
                ]);

            Assert.IsTrue(BackCompatHelper.HasNewOptionalNonBodyParametersOnly(previousSignature, queryLocationSignature));
        }

        // Validates that the base BuildMethodsForBackCompatibility default automatically restores a
        // previously-published parameter name on any derived type — keyed on the parameter's spec
        // original name — and that the rename propagates into the already-built method body.
        [Test]
        public async Task BuildMethodsForBackCompatibilityRestoresPreviousParameterName()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // A spec parameter "oldParam" that the generator renamed to "newParam".
            var inputParameter = InputFactory.QueryParameter("oldParam", InputPrimitiveType.String, isRequired: true);
            inputParameter.Update(name: "newParam");

            var parameter = new ParameterProvider(inputParameter);
            var fooMethod = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [parameter]),
                new MethodBodyStatement[]
                {
                    // Passing the parameter as an argument to another method exercises propagation
                    // of the restored name into invocation arguments, not just the return.
                    Snippet.This.Invoke("Validate", parameter).Terminate(),
                    Snippet.Return(parameter),
                },
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "TestClient", methods: [fooMethod]);

            // The default has no override here; the base restores the previously-published name and
            // the rename propagates into the already-built body.
            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // Validates that a parameter whose spec name is not in the last contract keeps its current name.
        [Test]
        public async Task BuildMethodsForBackCompatibilityKeepsUnpublishedParameterName()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // "brandNewParam" has no counterpart in the last contract (TestClient.Foo(oldParam)).
            var inputParameter = InputFactory.QueryParameter("brandNewParam", InputPrimitiveType.String, isRequired: true);
            var parameter = new ParameterProvider(inputParameter);
            var fooMethod = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [parameter]),
                Snippet.Return(parameter),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "TestClient", methods: [fooMethod]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        // When the restored name is used both as an argument (AsArgument -> _asArgument) and
        // as a variable (-> _asVariable), materializing both cached expressions before the rename, the
        // rename must keep them sharing one declaration. Otherwise the writer renames the two
        // declarations of the same name to "oldParam0"/"oldParam1", producing non-compiling code.
        [Test]
        public async Task BuildMethodsForBackCompatibilityRestoredNameDoesNotSplitDeclarations()
        {
            await MockHelpers.LoadMockGeneratorAsync(lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputParameter = InputFactory.QueryParameter("oldParam", InputPrimitiveType.String, isRequired: true);
            inputParameter.Update(name: "newParam");

            var parameter = new ParameterProvider(inputParameter);
            var fooMethod = new MethodProvider(
                new MethodSignature("Foo", $"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), $"", [parameter]),
                new MethodBodyStatement[]
                {
                    Snippet.This.Invoke("Validate", parameter.AsArgument()).Terminate(),
                    Snippet.Return(parameter),
                },
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "TestClient", methods: [fooMethod]);

            typeProvider.ProcessTypeForBackCompatibility();

            var actual = new TypeProviderWriter(typeProvider).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
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
        public void CanUpdateImplements()
        {
            var typeProvider = new TestTypeProvider(name: "OriginalName");
            Assert.AreEqual(0, typeProvider.Implements.Count);

            // Update with new implements
            var implements = new List<CSharpType>
            {
                new CSharpType(typeof(IDisposable)),
                new CSharpType(typeof(IEquatable<string>))
            };
            typeProvider.Update(implements: implements);

            Assert.IsNotNull(typeProvider.Implements);
            Assert.AreEqual(2, typeProvider.Implements.Count);
            Assert.AreEqual(new CSharpType(typeof(IDisposable)), typeProvider.Implements[0]);
            Assert.AreEqual(new CSharpType(typeof(IEquatable<string>)), typeProvider.Implements[1]);

            // Reset and validate
            typeProvider.Reset();
            Assert.AreEqual(0, typeProvider.Implements.Count);

            // Re-add the implements
            typeProvider.Update(implements: [new CSharpType(typeof(IDisposable))]);

            Assert.AreEqual(1, typeProvider.Implements.Count);
            Assert.AreEqual(new CSharpType(typeof(IDisposable)), typeProvider.Implements[0]);
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
        public async Task CustomPartialMethodImplementationKeepsParameterNames()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var inputParam = new ParameterProvider("input", $"The input value.", typeof(string));
            var generatedMethod = new MethodProvider(
                new MethodSignature(
                    "MyMethod",
                    $"Does something.",
                    MethodSignatureModifiers.Static,
                    null,
                    null,
                    [inputParam]),
                inputParam.Invoke("ToString").Terminate(),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "CustomPartialMethodType", methods: [generatedMethod]);

            var method = typeProvider.Methods.Single();
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteMethod(method);
            var result = codeWriter.ToString(false);

            // The partial implementation's signature parameter must keep the same name the body uses.
            // Regression guard: the parameter must not be renamed with a numeric suffix (e.g. "input0").
            Assert.IsFalse(
                result.Contains("input0"),
                $"Partial implementation renamed the parameter with a numeric suffix:\n{result}");
            Assert.AreEqual("input", method.Signature.Parameters.Single().Name);
        }

        [Test]
        public async Task CustomPartialMethodImplementationUsesGeneratorReturnType()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // The generator's resolved return type carries a namespace. The custom partial
            // declaration references the same type by name, but it is unresolved when read (a
            // type generated into the same assembly), so its parsed CSharpType has no namespace.
            var generatorReturnType = new CSharpType(
                "CustomReturnModel",
                "Sample.Models",
                isValueType: false,
                isNullable: false,
                declaringType: null,
                args: [],
                isPublic: true,
                isStruct: false);

            var inputParam = new ParameterProvider("input", $"The input value.", typeof(string));
            var generatedMethod = new MethodProvider(
                new MethodSignature(
                    "MyMethod",
                    $"Does something.",
                    MethodSignatureModifiers.Static,
                    generatorReturnType,
                    $"The result.",
                    [inputParam]),
                inputParam.Invoke("ToString").Terminate(),
                new TestTypeProvider());

            var typeProvider = new TestTypeProvider(name: "CustomPartialReturnType", methods: [generatedMethod]);

            var method = typeProvider.Methods.Single();
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            // The implementation must use the generator's resolved return type (with namespace),
            // not the customer's unresolved parsed return type (empty namespace).
            Assert.AreEqual("Sample.Models", method.Signature.ReturnType!.Namespace);
            Assert.AreEqual("CustomReturnModel", method.Signature.ReturnType.Name);

            using var codeWriter = new CodeWriter();
            codeWriter.WriteMethod(method);
            var result = codeWriter.ToString(false);

            // Regression guard: an empty-namespace return type renders as the malformed `global::.`.
            Assert.IsFalse(
                result.Contains("global::."),
                $"Partial implementation wrote a return type with no namespace:\n{result}");
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

        // Validates that a generated type whose customization partial declares the same operators
        // (==, !=, implicit) ends up with only the custom operators in its CanonicalView.
        [Test]
        public async Task CanonicalViewDedupesCustomOperators()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var typeProvider = new TestTypeProvider(name: "CustomOperatorType");
            var leftParam = new ParameterProvider("left", $"", typeProvider.Type);
            var rightParam = new ParameterProvider("right", $"", typeProvider.Type);
            var valueParam = new ParameterProvider("value", $"", typeof(string));
            var operatorModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator;
            var implicitOperatorModifiers = operatorModifiers | MethodSignatureModifiers.Implicit;

            var equality = new MethodProvider(
                new MethodSignature("==", $"", operatorModifiers, typeof(bool), $"", [leftParam, rightParam]),
                Snippet.Throw(Snippet.Null), typeProvider);
            var inequality = new MethodProvider(
                new MethodSignature("!=", $"", operatorModifiers, typeof(bool), $"", [leftParam, rightParam]),
                Snippet.Throw(Snippet.Null), typeProvider);
            var implicitCast = new MethodProvider(
                new MethodSignature(string.Empty, $"", implicitOperatorModifiers, typeProvider.Type, $"", [valueParam]),
                Snippet.Throw(Snippet.Null), typeProvider);

            typeProvider = new TestTypeProvider(name: "CustomOperatorType", methods: [equality, inequality, implicitCast]);

            Assert.IsNotNull(typeProvider.CustomCodeView);

            var operatorMethods = typeProvider.CanonicalView.Methods
                .Where(m => m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator))
                .ToList();

            // CanonicalView should only contain the 3 customized operators (no duplicates from generated).
            Assert.AreEqual(3, operatorMethods.Count);
            Assert.IsTrue(operatorMethods.All(m => m.EnclosingType == typeProvider.CustomCodeView),
                "Operator methods in CanonicalView should come from the custom code view, not the generated provider.");
            Assert.IsTrue(operatorMethods.Any(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit)));
            Assert.AreEqual(2, operatorMethods.Count(m =>
                !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit)
                && !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Explicit)));
        }
    }
}
