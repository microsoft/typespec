// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders;
using Microsoft.TypeSpec.Generator.Tests.TestHelpers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.ReferenceMap
{
    public class ProviderReferenceMapAnalyzerTests
    {
        [SetUp]
        public void SetUp()
        {
            ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
        }

        [TearDown]
        public void TearDown()
        {
            ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
        }

        [Test]
        public void NonRootKeptTypesKeepTheirAccessibility()
        {
            var context = new TestTypeProvider("SampleContext", TypeSignatureModifiers.Public);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(context));
            CodeModelGenerator.Instance.AddTypeToKeep(context.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([context]);

            Assert.IsTrue(context.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(context.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void NonRootKeptTypesAreWrittenWithoutRootingOtherTypes()
        {
            var context = new TestTypeProvider("SampleContext", TypeSignatureModifiers.Public);
            var unusedModel = new TestTypeProvider("UnusedModel", TypeSignatureModifiers.Public);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(context, unusedModel));
            CodeModelGenerator.Instance.AddTypeToKeep(context.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.Analyze([context, unusedModel]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(context));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(unusedModel));
        }

        [Test]
        public void ProviderNamedClientProviderIsNotTreatedAsClientWithoutCapability()
        {
            var sameNamedProvider = new ClientProvider();
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(sameNamedProvider));

            ProviderReferenceMapAnalyzer.Analyze([sameNamedProvider]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(sameNamedProvider));
        }

        [Test]
        public void RootedTypeWithInternalPartialDeclarationRemainsPublic()
        {
            var model = new ModelProvider(InputFactory.Model("PublicModel", "Sample.Models", access: "public"));
            var internalPartial = new TestTypeProvider(
                "PublicModel",
                TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class,
                ns: "Sample.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(model, internalPartial));
            CodeModelGenerator.Instance.AddTypeToKeep(model);

            using var session = ProviderReferenceMapAnalyzer.PrepareForGeneration([model, internalPartial]);

            Assert.IsTrue(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void AmbiguousNamespaceLessCustomCodeBodyDependencyDoesNotRootGeneratedTypeBySimpleName()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", CreateNamedType("Error", string.Empty));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var generatedError = new TestTypeProvider("Error", TypeSignatureModifiers.Public, ns: "Sample.Models");
            var otherGeneratedError = new TestTypeProvider("Error", TypeSignatureModifiers.Public, ns: "Other.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, generatedError, otherGeneratedError));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, generatedError, otherGeneratedError]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(generatedError));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(otherGeneratedError));
        }

        [Test]
        public void NamespaceLessCustomCodeBodyDependencyRootsGeneratedTypeInCustomCodeNamespace()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample", CreateNamedType("ReferencedModel", string.Empty));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var referencedModel = new TestTypeProvider("ReferencedModel", TypeSignatureModifiers.Public, ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, referencedModel));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, referencedModel]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(referencedModel));
        }

        [Test]
        public void NamespaceLessCustomCodeBodyDependencyRootsGeneratedTypeInParentNamespace()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample.Child", CreateNamedType("ReferencedModel", string.Empty));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample.Child");
            var referencedModel = new TestTypeProvider("ReferencedModel", TypeSignatureModifiers.Public, ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, referencedModel));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, referencedModel]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(referencedModel));
        }

        [Test]
        public void NamespaceLessCustomCodeGenericBodyDependencyRootsGeneratedTypeInCustomCodeNamespace()
        {
            var genericArgument = CreateNamedType("T", string.Empty);
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample", CreateNamedType("ErrorResult", string.Empty, genericArgument));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var errorResult = new GenericTestTypeProvider("ErrorResult", TypeSignatureModifiers.Internal, "Sample", genericArgument);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, errorResult));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, errorResult]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(errorResult));
        }

        [Test]
        public void NamespaceLessGeneratedGenericBodyDependencyRootsGeneratedTypeInProviderNamespace()
        {
            var genericArgument = CreateNamedType("T", string.Empty);
            var provider = new BodyDependencyTestTypeProvider("ClientPipelineExtensions", "Sample", CreateNamedType("ErrorResult", "Microsoft.TypeSpec.Generator.ClientModel.Providers", genericArgument));
            var errorResult = new GenericTestTypeProvider("ErrorResult", TypeSignatureModifiers.Internal, "Sample", genericArgument);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(provider, errorResult));
            CodeModelGenerator.Instance.AddTypeToKeep(provider.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([provider, errorResult]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(provider));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(errorResult));
        }

        [Test]
        public void UnionVariantPropertyReferenceOnlyMatchesFullyQualifiedModelName()
        {
            var keptVariant = new ModelProvider(InputFactory.Model("Variant", "Sample"));
            var collidingVariant = new ModelProvider(InputFactory.Model("Variant", "Other"));
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, keptVariant, collidingVariant));
            client.Update(properties:
            [
                new PropertyProvider(
                    $"",
                    MethodSignatureModifiers.Public,
                    CSharpType.FromUnion([keptVariant.Type, typeof(string)]),
                    "Value",
                    new AutoPropertyBody(false),
                    client)
            ]);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, keptVariant, collidingVariant]);

            Assert.IsTrue(keptVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(collidingVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void BinaryDataUnionPropertyDoesNotPublicizeInternalUnionMembers()
        {
            var internalVariant = new GeneratedModelTestTypeProvider(
                "InternalVariant",
                TypeSignatureModifiers.Internal,
                "Sample");
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(client, internalVariant),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            client.Update(properties:
            [
                new PropertyProvider(
                    $"",
                    MethodSignatureModifiers.Public,
                    CSharpType.FromUnion([internalVariant.Type, typeof(string)]),
                    "Value",
                    new AutoPropertyBody(false),
                    client)
            ]);

            using var session = ProviderReferenceMapAnalyzer.PrepareForGeneration([client, internalVariant]);

            Assert.IsTrue(internalVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(internalVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(internalVariant));
        }

        [Test]
        public void MetadataOnlyUnionPropertyDoesNotReferenceUnionMember()
        {
            var variant = new GeneratedModelTestTypeProvider(
                "Variant",
                TypeSignatureModifiers.Public,
                "Sample");
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(client, variant),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            client.Update(properties:
            [
                new PropertyProvider(
                    $"",
                    MethodSignatureModifiers.Public,
                    new CSharpType(
                        typeof(IReadOnlyDictionary<,>),
                        typeof(string),
                        CSharpType.FromUnion(
                            [variant.Type],
                            false,
                            UnionItemTypeReferenceKind.MetadataOnly)),
                    "Value",
                    new AutoPropertyBody(false),
                    client)
            ]);

            using var session = ProviderReferenceMapAnalyzer.PrepareForGeneration([client, variant]);

            Assert.IsTrue(variant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(variant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(variant));
        }

        [Test]
        public void BinaryDataUnionPropertyDoesNotPublicizeAbstractBaseModel()
        {
            var discriminator = InputFactory.Property(
                "kind",
                InputPrimitiveType.String,
                isRequired: true,
                isDiscriminator: true);
            var derivedInput = InputFactory.Model(
                "InternalVariant",
                "Sample",
                access: "internal",
                discriminatedKind: "internal");
            var baseInput = InputFactory.Model(
                "Variant",
                "Sample",
                access: null!,
                properties: [discriminator],
                derivedModels: [derivedInput],
                discriminatorProperty: discriminator);
            MockHelpers.LoadMockGenerator(inputModelTypes: [baseInput, derivedInput]);
            var providers = CodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var baseVariant = providers.OfType<ModelProvider>().Single(provider => provider.Name == "Variant");
            var internalVariant = providers.OfType<ModelProvider>().Single(provider => provider.Name == "InternalVariant");
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            client.Update(properties:
            [
                new PropertyProvider(
                    $"",
                    MethodSignatureModifiers.Public,
                    CSharpType.FromUnion(
                    [
                        new CSharpType(typeof(IList<>), baseVariant.Type),
                        typeof(string)
                    ]),
                    "Value",
                    new AutoPropertyBody(false),
                    client)
            ]);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, baseVariant, internalVariant]);

            Assert.IsTrue(baseVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(internalVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void UnionVariantEnumRemainsPublicWhenReferencedByPublicProperty()
        {
            var inputEnum = InputFactory.StringEnum(
                "Variant",
                [("One", "one")],
                access: null!,
                clientNamespace: "Sample");
            MockHelpers.LoadMockGenerator(inputEnumTypes: [inputEnum]);
            var variant = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<EnumProvider>()
                .Single(provider => provider.Name == "Variant");
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            client.Update(properties:
            [
                new PropertyProvider(
                    $"",
                    MethodSignatureModifiers.Public,
                    CSharpType.FromUnion([variant.Type, typeof(string)]),
                    "Value",
                    new AutoPropertyBody(false),
                    client)
            ]);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, variant]);

            Assert.IsTrue(variant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(variant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void DisconnectedUnionVariantIsNotPublicRoot()
        {
            var inputVariant = InputFactory.Model("Variant", "Sample", access: null!);
            var variant = new ModelProvider(inputVariant);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(variant));
            CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(
                InputFactory.Union([inputVariant, InputPrimitiveType.String]));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([variant]);

            Assert.IsTrue(variant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(variant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void KnownDiscriminatorVariantRemainsPublicWhenBaseIsRooted()
        {
            var discriminator = InputFactory.Property(
                "kind",
                InputPrimitiveType.String,
                isRequired: true,
                isDiscriminator: true);
            var derivedInput = InputFactory.Model(
                "KnownVariant",
                "Sample",
                access: null!,
                discriminatedKind: "known");
            var baseInput = InputFactory.Model(
                "BaseModel",
                "Sample",
                access: null!,
                properties: [discriminator],
                derivedModels: [derivedInput],
                discriminatorProperty: discriminator);
            MockHelpers.LoadMockGenerator(inputModelTypes: [baseInput, derivedInput]);
            var providers = CodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var baseProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "BaseModel");
            var derivedProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "KnownVariant");
            CodeModelGenerator.Instance.AddTypeToKeep(baseProvider);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility(providers);

            Assert.IsTrue(baseProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(derivedProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void NestedKnownDiscriminatorVariantRemainsPublicWhenOuterBaseIsCustomRoot()
        {
            var innerDiscriminator = InputFactory.Property(
                "innerKind",
                InputPrimitiveType.String,
                isRequired: true,
                isDiscriminator: true);
            var innerDerivedInput = InputFactory.Model(
                "InnerKnownVariant",
                "Sample",
                access: null!,
                discriminatedKind: "inner");
            var innerBaseInput = InputFactory.Model(
                "InnerBaseModel",
                "Sample",
                access: null!,
                properties: [innerDiscriminator],
                derivedModels: [innerDerivedInput],
                discriminatorProperty: innerDiscriminator);
            var outerDiscriminator = InputFactory.Property(
                "outerKind",
                InputPrimitiveType.String,
                isRequired: true,
                isDiscriminator: true);
            var outerDerivedInput = InputFactory.Model(
                "OuterKnownVariant",
                "Sample",
                access: null!,
                properties: [InputFactory.Property("nested", innerBaseInput, isRequired: true)],
                discriminatedKind: "outer");
            var outerBaseInput = InputFactory.Model(
                "OuterBaseModel",
                "Sample",
                access: null!,
                properties: [outerDiscriminator],
                derivedModels: [outerDerivedInput],
                discriminatorProperty: outerDiscriminator);
            MockHelpers.LoadMockGenerator(inputModelTypes:
            [
                outerBaseInput,
                outerDerivedInput,
                innerBaseInput,
                innerDerivedInput
            ]);
            var providers = CodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var outerBaseProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "OuterBaseModel");
            var innerDerivedProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "InnerKnownVariant");
            var customCodeView = new SignatureDependencyTestTypeProvider(
                "CustomApi",
                TypeSignatureModifiers.Public,
                outerBaseProvider.Type);
            var customApi = new CustomizableTestTypeProvider(
                "CustomApi",
                TypeSignatureModifiers.Public,
                customCodeView,
                "Sample");

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([customApi, .. providers]);

            Assert.IsTrue(innerDerivedProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(innerDerivedProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void KnownDiscriminatorVariantRemainsPublicWhenIntermediateBaseHasNoDiscriminatorProperty()
        {
            var discriminator = InputFactory.Property(
                "kind",
                InputPrimitiveType.String,
                isRequired: true,
                isDiscriminator: true);
            var leafInput = InputFactory.Model(
                "KnownVariant",
                "Sample",
                access: null!,
                discriminatedKind: "known");
            var intermediateInput = InputFactory.Model(
                "IntermediateBase",
                "Sample",
                access: null!,
                derivedModels: [leafInput]);
            var rootInput = InputFactory.Model(
                "RootBase",
                "Sample",
                access: null!,
                properties: [discriminator],
                derivedModels: [intermediateInput],
                discriminatorProperty: discriminator);
            MockHelpers.LoadMockGenerator(inputModelTypes: [rootInput, intermediateInput, leafInput]);
            var providers = CodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var rootProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "RootBase");
            var intermediateProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "IntermediateBase");
            var leafProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "KnownVariant");
            CodeModelGenerator.Instance.AddTypeToKeep(rootProvider);

            Assert.IsNull(intermediateProvider.DiscriminatorProperty);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility(providers);

            Assert.IsTrue(leafProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(leafProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void DisconnectedKnownDiscriminatorVariantIsNotPublicRoot()
        {
            var discriminator = InputFactory.Property(
                "kind",
                InputPrimitiveType.String,
                isRequired: true,
                isDiscriminator: true);
            var derivedInput = InputFactory.Model(
                "KnownVariant",
                "Sample",
                access: null!,
                discriminatedKind: "known");
            var baseInput = InputFactory.Model(
                "BaseModel",
                "Sample",
                access: null!,
                properties: [discriminator],
                derivedModels: [derivedInput],
                discriminatorProperty: discriminator);
            MockHelpers.LoadMockGenerator(inputModelTypes: [baseInput, derivedInput]);
            var providers = CodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var baseProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "BaseModel");
            var derivedProvider = providers.OfType<ModelProvider>().Single(provider => provider.Name == "KnownVariant");

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility(providers);

            Assert.IsTrue(baseProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(derivedProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void CollectionUnionVariantPropertyReferenceOnlyMatchesFullyQualifiedModelName()
        {
            var keptVariant = new ModelProvider(InputFactory.Model("Variant", "Sample"));
            var collidingVariant = new ModelProvider(InputFactory.Model("Variant", "Other"));
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, keptVariant, collidingVariant));
            client.Update(properties:
            [
                new PropertyProvider(
                    $"",
                    MethodSignatureModifiers.Public,
                    new CSharpType(typeof(IList<>), CSharpType.FromUnion([keptVariant.Type, typeof(string)])),
                    "Values",
                    new AutoPropertyBody(false),
                    client)
            ]);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, keptVariant, collidingVariant]);

            Assert.IsTrue(keptVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(collidingVariant.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void QualifiedExternalBuildableTypeDoesNotMatchRemovedGeneratedTypeBySimpleName()
        {
            var generatedFoo = new GeneratedModelTestTypeProvider("Foo", TypeSignatureModifiers.Public, ns: "Sample");
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(generatedFoo),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");

            ProviderReferenceMapAnalyzer.Analyze([generatedFoo]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(generatedFoo));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.IsResolvableBuildableType(CreateNamedType("Foo", "Contoso")));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.IsResolvableBuildableType(CreateNamedType("Foo", string.Empty)));
        }

        [Test]
        public void AmbiguousUnqualifiedBuildableTypeDoesNotMatchRemovedProviderBySimpleName()
        {
            var keptFoo = new GeneratedModelTestTypeProvider("Foo", TypeSignatureModifiers.Public, ns: "Kept");
            var removedFoo = new GeneratedModelTestTypeProvider("Foo", TypeSignatureModifiers.Public, ns: "Removed");
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(removedFoo, keptFoo),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            CodeModelGenerator.Instance.AddTypeToKeep(keptFoo.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([keptFoo, removedFoo]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(keptFoo));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(removedFoo));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.IsResolvableBuildableType(CreateNamedType("Foo", string.Empty)));
        }

        [Test]
        public void UnqualifiedGenericBuildableTypeUsesArityWhenMatchingRemovedProvider()
        {
            var genericArgument = CreateNamedType("T", string.Empty);
            var keptFoo = new GeneratedModelTestTypeProvider("Foo", TypeSignatureModifiers.Public, ns: "Kept");
            var removedGenericFoo = new GenericTestTypeProvider(
                "Foo`1",
                TypeSignatureModifiers.Public,
                "Removed",
                genericArgument);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(keptFoo, removedGenericFoo),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            CodeModelGenerator.Instance.AddTypeToKeep(keptFoo.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([keptFoo, removedGenericFoo]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(removedGenericFoo));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.IsResolvableBuildableType(
                CreateNamedType("Foo", string.Empty, genericArgument)));
        }

        [Test]
        public void HelperRootBodyDependencyRootsGeneratedGenericDependency()
        {
            var genericArgument = CreateNamedType("T", string.Empty);
            var client = new HelperDependencyTestTypeProvider("SampleClient", "Sample", CreateNamedType("ClientPipelineExtensions", "Microsoft.TypeSpec.Generator.ClientModel.Providers"));
            var pipelineExtensions = new BodyDependencyTestTypeProvider("ClientPipelineExtensions", "Sample", CreateNamedType("ErrorResult", "Microsoft.TypeSpec.Generator.ClientModel.Providers", genericArgument));
            var errorResult = new GenericTestTypeProvider("ErrorResult", TypeSignatureModifiers.Internal, "Sample", genericArgument);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, pipelineExtensions, errorResult));
            CodeModelGenerator.Instance.AddTypeToKeep(client.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([client, pipelineExtensions, errorResult]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(client));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(pipelineExtensions));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(errorResult));
        }

        [Test]
        public void UnreferencedHelperDependencyDoesNotKeepUnreferencedSiblingHelper()
        {
            var client = new HelperDependencyTestTypeProvider("SampleClient", "Sample", CreateNamedType("ClientPipelineExtensions", "Sample"));
            var pipelineExtensions = new TestTypeProvider("ClientPipelineExtensions", TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static, ns: "Sample");
            var cancellationTokenExtensions = new TestTypeProvider("CancellationTokenExtensions", TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static, ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, pipelineExtensions, cancellationTokenExtensions));
            CodeModelGenerator.Instance.AddTypeToKeep(client.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([client, pipelineExtensions, cancellationTokenExtensions]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(client));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(pipelineExtensions));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(cancellationTokenExtensions));
        }

        [Test]
        public async Task LastContractInternalHelperDoesNotRootAbsentGeneratedHelper()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample
                    {
                        internal static class ClientPipelineExtensions
                        {
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var client = new TestTypeProvider("SampleClient", TypeSignatureModifiers.Public, ns: "Sample");
            var pipelineExtensions = new TestTypeProvider("ClientPipelineExtensions", TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static, ns: "Sample");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(client, pipelineExtensions),
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));
            CodeModelGenerator.Instance.AddTypeToKeep(client.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([client, pipelineExtensions]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(client));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(pipelineExtensions));
        }

        [Test]
        public void NamespaceLessCustomCodeBodyDependencyDoesNotRootGeneratedTypeInDifferentNamespace()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample", CreateNamedType("ReferencedModel", string.Empty));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var referencedModel = new TestTypeProvider("ReferencedModel", TypeSignatureModifiers.Public, ns: "Other.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, referencedModel));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, referencedModel]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(referencedModel));
        }

        [Test]
        public void NamespaceLessCustomCodeBodyDependencyDoesNotRootInternalModelWithSameNamespaceMemberName()
        {
            var customCodeView = new BodyDependencyTestTypeProvider(
                "CustomSetting",
                "Sample",
                [CreateNamedType("Key", string.Empty)],
                [new PropertyProvider($"", MethodSignatureModifiers.Public, typeof(string), "Key", new AutoPropertyBody(true), TestTypeProvider.Empty)]);
            var customType = new CustomizableTestTypeProvider("CustomSetting", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var generatedKey = new TestTypeProvider("Key", TypeSignatureModifiers.Internal, ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, generatedKey));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, generatedKey]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(generatedKey));
        }

        [Test]
        public void CustomCodeBodyDependencyOnExternalTypeDoesNotRootGeneratedTypeBySimpleName()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample", CreateNamedType("OperationState", "Azure"));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var generatedOperationState = new TestTypeProvider("OperationState", TypeSignatureModifiers.Internal, ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, generatedOperationState));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, generatedOperationState]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(customType));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(generatedOperationState));
        }

        [Test]
        public void UnregisteredCustomCodeMethodDependencyDoesNotRootGeneratedExtensionProvider()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample", CreateNamedType("SetValue", string.Empty));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var extensionProvider = new ExtensionMethodTestTypeProvider("GeneratedExtensions", "SetValue", ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, extensionProvider));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, extensionProvider]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(extensionProvider));
        }

        [Test]
        public void AmbiguousCustomCodeExtensionMethodDependencyDoesNotRootGeneratedProvider()
        {
            var customCodeView = new BodyDependencyTestTypeProvider("CustomType", "Sample", CreateNamedType("SetValue", string.Empty));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var firstExtensionProvider = new ExtensionMethodTestTypeProvider("FirstExtensions", "SetValue", ns: "Sample");
            var secondExtensionProvider = new ExtensionMethodTestTypeProvider("SecondExtensions", "SetValue", ns: "Sample");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, firstExtensionProvider, secondExtensionProvider));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([customType, firstExtensionProvider, secondExtensionProvider]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(firstExtensionProvider));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(secondExtensionProvider));
        }

        [Test]
        public void GeneratedBodyExtensionCallRootsProviderByMethodAndReceiverType()
        {
            var requestContextType = CreateNamedType("RequestContext", "Azure");
            var otherContextType = CreateNamedType("OtherContext", "Azure");
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            client.Update(methods:
            [
                new MethodProvider(
                    new MethodSignature("Process", $"", MethodSignatureModifiers.Public, typeof(void), $"", []),
                    new InvokeMethodExpression(new VariableExpression(requestContextType, "context"), "Parse", []),
                    client)
            ]);
            var requestContextExtensions = new ExtensionMethodTestTypeProvider("RequestContextExtensions", "Parse", "Sample", requestContextType);
            var otherContextExtensions = new ExtensionMethodTestTypeProvider("OtherContextExtensions", "Parse", "Sample", otherContextType);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, requestContextExtensions, otherContextExtensions));
            CodeModelGenerator.Instance.AddTypeToKeep(client.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([client, requestContextExtensions, otherContextExtensions]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(requestContextExtensions));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(otherContextExtensions));
        }

        [Test]
        public async Task CustomCodeTypeDoesNotRootGeneratedExtensionsTypeByNamingConvention()
        {
            var customCompilation = CSharpCompilation.Create(
                "Customization",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample
                    {
                        public partial class Widget
                        {
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            var widgetExtensions = new TestTypeProvider("WidgetExtensions", TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static, ns: "Sample");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(client, widgetExtensions),
                compilation: () => Task.FromResult<Compilation>(customCompilation));
            CodeModelGenerator.Instance.AddTypeToKeep(client.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([client, widgetExtensions]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(widgetExtensions));
        }

        [Test]
        public void PublicCustomSignatureExternalTypeDoesNotPublicizeGeneratedTypeBySimpleName()
        {
            var customCodeView = new SignatureDependencyTestTypeProvider(
                "CustomType",
                TypeSignatureModifiers.Public,
                CreateNamedType("Action", "System"));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Sample");
            var generatedAction = new TestTypeProvider("Action", TypeSignatureModifiers.Internal, ns: "Sample.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, generatedAction));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);
            CodeModelGenerator.Instance.AddTypeToKeep(generatedAction.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([customType, generatedAction]);

            Assert.IsTrue(generatedAction.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(generatedAction.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void InternalizeModeDoesNotRemoveUnreferencedProviders()
        {
            var context = new TestTypeProvider("SampleContext", TypeSignatureModifiers.Public);
            var unusedModel = new TestTypeProvider("UnusedModel", TypeSignatureModifiers.Public);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(context, unusedModel),
                configuration: "{\"unreferenced-types-handling\":\"internalize\"}");
            CodeModelGenerator.Instance.AddTypeToKeep(context.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.Analyze([context, unusedModel]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(context));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(unusedModel));
            Assert.IsEmpty(ProviderReferenceMapAnalyzer.LatestResult!.RemoveCandidates);
        }

        [Test]
        public void SerializationProviderInfrastructureRootsUseProviderBodyDependencies()
        {
            var optional = new TestTypeProvider("Optional", TypeSignatureModifiers.Public);
            var modelSerializationExtensions = new TestTypeProvider("ModelSerializationExtensions", TypeSignatureModifiers.Public);
            var serializationProvider = new BodyDependencyTestTypeProvider(
                "SampleModelSerializer",
                ns: null,
                optional.Type,
                modelSerializationExtensions.Type);
            var model = new ClientTestTypeProvider("SampleModel", serializationProvider);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(
                model,
                serializationProvider,
                optional,
                modelSerializationExtensions));

            ProviderReferenceMapAnalyzer.Analyze([model, serializationProvider, optional, modelSerializationExtensions]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(serializationProvider));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(optional));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(modelSerializationExtensions));
        }

        [Test]
        public async Task InternalCustomizationTypeDoesNotInternalizeGeneratedTypeWithSameSimpleName()
        {
            var customCompilation = CompilationHelper.LoadCompilation(
                [new TestTypeProvider("Error", TypeSignatureModifiers.Internal, ns: "Custom.Models")]);
            var context = new TestTypeProvider("SampleContext", TypeSignatureModifiers.Public);
            var generatedError = new TestTypeProvider("Error", TypeSignatureModifiers.Public, ns: "Generated.Models");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(context, generatedError),
                compilation: () => Task.FromResult(customCompilation));
            CodeModelGenerator.Instance.AddTypeToKeep(context.Type.FullyQualifiedName);
            CodeModelGenerator.Instance.AddTypeToKeep(generatedError.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([context, generatedError]);

            Assert.IsTrue(generatedError.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(generatedError.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public async Task PublicGenericCustomizationDoesNotPublicizeGeneratedNonGenericTypeWithSameSimpleName()
        {
            var customCompilation = CSharpCompilation.Create(
                "TestAssembly",
                [CSharpSyntaxTree.ParseText("""
                    namespace Generated.Models
                    {
                        public partial class SearchResult<T>
                        {
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var context = new TestTypeProvider("SampleContext", TypeSignatureModifiers.Public);
            var generatedSearchResult = new TestTypeProvider("SearchResult", TypeSignatureModifiers.Internal, ns: "Generated.Models");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(context, generatedSearchResult),
                compilation: () => Task.FromResult<Compilation>(customCompilation));
            CodeModelGenerator.Instance.AddTypeToKeep(context.Type.FullyQualifiedName);
            CodeModelGenerator.Instance.AddTypeToKeep(generatedSearchResult.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([context, generatedSearchResult]);

            Assert.IsTrue(generatedSearchResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(generatedSearchResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void PublicGenericCustomSignatureDoesNotRootGeneratedNonGenericTypeBySimpleName()
        {
            var genericArgument = CreateNamedType("T", string.Empty);
            var customCodeView = new SignatureDependencyTestTypeProvider(
                "CustomType",
                TypeSignatureModifiers.Public,
                CreateNamedType("SearchResult", "Generated.Models", genericArgument));
            var customType = new CustomizableTestTypeProvider("CustomType", TypeSignatureModifiers.Public, customCodeView, ns: "Generated.Models");
            var generatedSearchResult = new TestTypeProvider("SearchResult", TypeSignatureModifiers.Internal, ns: "Generated.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(customType, generatedSearchResult));
            CodeModelGenerator.Instance.AddTypeToKeep(customType.Type.FullyQualifiedName);
            CodeModelGenerator.Instance.AddTypeToKeep(generatedSearchResult.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([customType, generatedSearchResult]);

            Assert.IsTrue(generatedSearchResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(generatedSearchResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void PublicProviderSignatureDependencyKeepsNonRootTypePublic()
        {
            var client = new ClientTestTypeProvider(
                "SampleClient",
                "Sample",
                signatureDependencyTypes: CreateNamedType("GeneratedModel", "Sample.Models"));
            var generatedModel = new GeneratedModelTestTypeProvider("GeneratedModel", TypeSignatureModifiers.Public, ns: "Sample.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, generatedModel));
            CodeModelGenerator.Instance.AddTypeToKeep(generatedModel.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, generatedModel]);

            Assert.IsTrue(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void PublicProviderMethodWithNamespaceLessSignatureKeepsNonRootTypePublic()
        {
            var client = new ClientTestTypeProvider("SampleClient", "Sample");
            var generatedModel = new GeneratedModelTestTypeProvider("GeneratedModel", TypeSignatureModifiers.Public, ns: "Sample");
            client.Update(methods:
            [
                new MethodProvider(
                    new MethodSignature(
                        "GetModel",
                        $"",
                        MethodSignatureModifiers.Public,
                        CreateNamedType("GeneratedModel", string.Empty),
                        $"",
                        []),
                    MethodBodyStatement.Empty,
                    client)
            ]);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, generatedModel));
            CodeModelGenerator.Instance.AddTypeToKeep(generatedModel.Type.FullyQualifiedName, isRoot: false);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, generatedModel]);

            Assert.IsTrue(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public async Task LastContractPublicDeclarationRootsGeneratedType()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample.Models
                    {
                        public partial class GeneratedModel
                        {
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var generatedModel = new GeneratedModelTestTypeProvider(
                "GeneratedModel",
                TypeSignatureModifiers.Public,
                "Sample.Models");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(generatedModel),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}",
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            using var session = ProviderReferenceMapAnalyzer.PrepareForGeneration([generatedModel]);

            Assert.IsTrue(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(generatedModel));
        }

        [Test]
        public async Task LastContractGenericDeclarationDoesNotRootGeneratedType()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample.Models
                    {
                        public partial class PageResult<T>
                        {
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);

            var genericArgument = CreateNamedType("T", string.Empty);
            var genericPageResult = new GenericTestTypeProvider("PageResult", TypeSignatureModifiers.Public, "Sample.Models", genericArgument);
            var nonGenericPageResult = new GeneratedModelTestTypeProvider("PageResult", TypeSignatureModifiers.Public, ns: "Sample.Models");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(genericPageResult, nonGenericPageResult),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}",
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([genericPageResult, nonGenericPageResult]);

            Assert.IsTrue(genericPageResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(genericPageResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(nonGenericPageResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(nonGenericPageResult.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public async Task LastContractNestedPublicDeclarationRootsGeneratedType()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample.Models
                    {
                        public partial class OuterModel
                        {
                            public partial class InnerModel
                            {
                            }
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);

            var outerModel = new TestTypeProvider("OuterModel", TypeSignatureModifiers.Public, ns: "Sample.Models");
            var innerModel = new NestedTestTypeProvider("InnerModel", TypeSignatureModifiers.Public, outerModel, ns: "Sample.Models");
            outerModel.NestedTypesInternal = [innerModel];
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(outerModel),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}",
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            Assert.IsNotNull(outerModel.LastContractView);
            Assert.IsNotNull(innerModel.LastContractView);
            Assert.IsTrue(outerModel.LastContractView!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(innerModel.LastContractView!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            using var session = ProviderReferenceMapAnalyzer.PrepareForGeneration([outerModel]);

            Assert.IsTrue(outerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(outerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(innerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(innerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(outerModel));
            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(innerModel));
        }

        [Test]
        public async Task LastContractPublicNestedDeclarationInInternalTypeDoesNotRootGeneratedType()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample.Models
                    {
                        internal partial class OuterModel
                        {
                            public partial class InnerModel
                            {
                            }
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);

            var outerModel = new TestTypeProvider("OuterModel", TypeSignatureModifiers.Public, ns: "Sample.Models");
            var innerModel = new NestedTestTypeProvider("InnerModel", TypeSignatureModifiers.Public, outerModel, ns: "Sample.Models");
            outerModel.NestedTypesInternal = [innerModel];
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(outerModel),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}",
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            using var session = ProviderReferenceMapAnalyzer.PrepareForGeneration([outerModel]);

            Assert.IsTrue(outerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(outerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(innerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(innerModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void DependenciesOfInternalizedClientAreNotPublicizedFromClientRootTraversal()
        {
            var clientOptions = new TestTypeProvider("SampleClientOptions", TypeSignatureModifiers.Public, ns: "Sample");
            var client = new ClientTestTypeProvider(
                "SampleClient",
                "Sample",
                new SignatureDependencyTestTypeProvider("SampleClient", TypeSignatureModifiers.Internal, ns: "Sample"),
                signatureDependencyTypes: clientOptions.Type);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, clientOptions));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, clientOptions]);

            Assert.IsTrue(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void PublicConstructorOnInternalClientDoesNotPublicizeGeneratedOptions()
        {
            var clientOptions = new TestTypeProvider("SampleClientOptions", TypeSignatureModifiers.Public, ns: "Sample");
            var customCodeView = new SignatureDependencyTestTypeProvider("SampleClient", TypeSignatureModifiers.Internal, ns: "Sample");
            var client = new ConstructorDependencyTestTypeProvider(
                "SampleClient",
                TypeSignatureModifiers.Public,
                customCodeView,
                ns: "Sample",
                constructorParameterTypes: [CreateNamedType("SampleClientOptions", "Sample")]);
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(client, clientOptions));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, clientOptions]);

            Assert.IsTrue(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public async Task LastContractInternalDeclarationsDoNotChangeProviderAccessibility()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample
                    {
                        internal partial class SampleClient
                        {
                        }

                        internal partial class SampleClientOptions
                        {
                            internal enum ServiceVersion
                            {
                                V1 = 1
                            }
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var clientOptions = new TestTypeProvider("SampleClientOptions", TypeSignatureModifiers.Public, ns: "Sample");
            clientOptions.NestedTypesInternal =
            [
                new NestedTestTypeProvider("ServiceVersion", TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum, clientOptions, ns: "Sample")
            ];
            var client = new ClientTestTypeProvider("SampleClient", "Sample", signatureDependencyTypes: CreateNamedType("SampleClientOptions", "Sample"));
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(client, clientOptions),
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, clientOptions]);

            Assert.IsTrue(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(clientOptions.NestedTypes[0].DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(clientOptions.NestedTypes[0].DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public async Task LastContractInternalDeclarationDoesNotOverridePublicCustomPartial()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample
                    {
                        internal abstract partial class AbstractModel
                        {
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var customCodeView = new TestTypeProvider("AbstractModel", TypeSignatureModifiers.Public | TypeSignatureModifiers.Abstract, ns: "Sample");
            var model = new CustomizableTestTypeProvider("AbstractModel", TypeSignatureModifiers.Public | TypeSignatureModifiers.Abstract, customCodeView, ns: "Sample");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(model),
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([model]);

            Assert.IsTrue(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public async Task TopLevelTypeWithSameNameAsNestedTypeDoesNotPublicizeDeclaringType()
        {
            var lastContractCompilation = CSharpCompilation.Create(
                "LastContract",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample
                    {
                        public enum ServiceVersion
                        {
                            V1 = 1
                        }

                        internal partial class SampleClientOptions
                        {
                            internal enum ServiceVersion
                            {
                                V1 = 1
                            }
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var publicServiceVersion = new TestTypeProvider("ServiceVersion", TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum, ns: "Sample");
            var clientOptions = new TestTypeProvider("SampleClientOptions", TypeSignatureModifiers.Public, ns: "Sample");
            clientOptions.NestedTypesInternal =
            [
                new NestedTestTypeProvider("ServiceVersion", TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum, clientOptions, ns: "Sample")
            ];
            var customPublicApi = new SignatureDependencyTestTypeProvider(
                "CustomPublicApi",
                TypeSignatureModifiers.Public,
                ns: "Sample",
                CreateNamedType("ServiceVersion", "Sample"));
            var generatedPublicApi = new CustomizableTestTypeProvider(
                "CustomPublicApi",
                TypeSignatureModifiers.Public,
                customPublicApi,
                ns: "Sample");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(publicServiceVersion, clientOptions, generatedPublicApi),
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContractCompilation));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([publicServiceVersion, clientOptions, generatedPublicApi]);

            Assert.IsTrue(publicServiceVersion.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(publicServiceVersion.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(generatedPublicApi.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(generatedPublicApi.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(clientOptions.NestedTypes[0].DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(clientOptions.NestedTypes[0].DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public async Task ExistingGeneratedSourceDoesNotChangeAccessibilityWithoutLastContract()
        {
            var outputPath = Path.Combine(TestContext.CurrentContext.WorkDirectory, "ReferenceMap", nameof(ExistingGeneratedSourceDoesNotChangeAccessibilityWithoutLastContract));
            var projectPath = Path.Combine(outputPath, "src");
            Directory.CreateDirectory(projectPath);
            await File.WriteAllTextAsync(Path.Combine(projectPath, "SampleClient.cs"), """
                namespace Sample
                {
                    internal partial class SampleClient
                    {
                    }
                }
                """);
            await File.WriteAllTextAsync(Path.Combine(projectPath, "SampleClientOptions.cs"), """
                namespace Sample
                {
                    internal partial class SampleClientOptions
                    {
                        internal enum ServiceVersion
                        {
                            V1 = 1
                        }
                    }
                }
                """);
            var clientOptions = new TestTypeProvider("SampleClientOptions", TypeSignatureModifiers.Public, ns: "Sample");
            clientOptions.NestedTypesInternal =
            [
                new NestedTestTypeProvider("ServiceVersion", TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum, clientOptions, ns: "Sample")
            ];
            var client = new ClientTestTypeProvider("SampleClient", "Sample", signatureDependencyTypes: CreateNamedType("SampleClientOptions", "Sample"));
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(client, clientOptions),
                configuration: "{}",
                outputPath: outputPath);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, clientOptions]);

            Assert.IsTrue(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(clientOptions.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(clientOptions.NestedTypes[0].DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public async Task LastContractModelFactorySignaturesDoNotRootGeneratedModels()
        {
            MockHelpers.LoadMockGenerator();
            var lastContract = await Helpers.GetCompilationFromDirectoryAsync();
            var pagedModel = new TestTypeProvider("PagedWidget", TypeSignatureModifiers.Public, ns: "Sample");
            var requestModel = new TestTypeProvider("WidgetRequest", TypeSignatureModifiers.Public, ns: "Sample");
            await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new TestOutputLibrary(pagedModel, requestModel),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}",
                lastContractCompilation: () => Task.FromResult<Compilation>(lastContract));
            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            Assert.IsNotNull(modelFactory.LastContractView, modelFactory.Name);

            ProviderReferenceMapAnalyzer.Analyze([pagedModel, requestModel, modelFactory]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(pagedModel));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(requestModel));
        }

        [Test]
        public void ApiDirectoryDoesNotChangePublicClientRootsWithoutLastContract()
        {
            var outputPath = Path.Combine(TestContext.CurrentContext.WorkDirectory, "ReferenceMap", nameof(ApiDirectoryDoesNotChangePublicClientRootsWithoutLastContract));
            Directory.CreateDirectory(Path.Combine(outputPath, "api"));
            MockHelpers.LoadMockGenerator(
                configuration: "{}",
                outputPath: Path.Combine(outputPath, "src"));
            var options = new TestTypeProvider("SampleClientOptions", TypeSignatureModifiers.Public, ns: "Sample");
            var client = new ClientTestTypeProvider("SampleClient", "Sample", signatureDependencyTypes: options.Type);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([client, options]);

            Assert.IsTrue(client.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(options.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void PublicCustomCodeArraySignatureKeepsGeneratedTypePublic()
        {
            var customCodeView = new SignatureDependencyTestTypeProvider("PublicCustomApi", TypeSignatureModifiers.Public, CreateNamedType("GeneratedModel", string.Empty));
            var generatedModel = new CustomizableTestTypeProvider("GeneratedModel", TypeSignatureModifiers.Public, customCodeView, ns: "Generated.Models");
            MockHelpers.LoadMockGenerator(createOutputLibrary: () => new TestOutputLibrary(generatedModel));

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([generatedModel]);

            Assert.IsTrue(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void InternalGeneratedPredecessorDoesNotPublicizeItsInternalDependency()
        {
            var dependency = new GeneratedModelTestTypeProvider("InternalDependency", TypeSignatureModifiers.Internal, ns: "Sample.Models");
            var internalModel = new GeneratedModelTestTypeProvider(
                "InternalModel",
                TypeSignatureModifiers.Internal,
                ns: "Sample.Models");
            var publicRoot = new GeneratedModelTestTypeProvider(
                "PublicRoot",
                TypeSignatureModifiers.Public,
                ns: "Sample.Models");
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(publicRoot, internalModel, dependency),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            CodeModelGenerator.Instance.AddTypeToKeep(publicRoot.Type.FullyQualifiedName);
            CodeModelGenerator.Instance.AddTypeToKeep(internalModel.Type.FullyQualifiedName);
            CodeModelGenerator.Instance.AddTypeToKeep(dependency.Type.FullyQualifiedName);

            publicRoot.Update(properties: [
                new PropertyProvider($"", MethodSignatureModifiers.Public, internalModel.Type, "InternalModel", new AutoPropertyBody(false), publicRoot)
            ]);
            internalModel.Update(properties: [
                new PropertyProvider($"", MethodSignatureModifiers.Public, dependency.Type, "Dependency", new AutoPropertyBody(false), internalModel)
            ]);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([publicRoot, internalModel, dependency]);

            Assert.IsTrue(internalModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(internalModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(dependency.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(dependency.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void PublicSerializationPartialDoesNotPublicizeInternalOwner()
        {
            var model = new GeneratedModelTestTypeProvider(
                "InternalModel",
                TypeSignatureModifiers.Internal,
                ns: "Sample.Models");
            var serialization = new TestTypeProvider(
                "InternalModel",
                TypeSignatureModifiers.Public,
                ns: "Sample.Models");
            model.Update(serializations: [serialization]);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => new TestOutputLibrary(model),
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            CodeModelGenerator.Instance.AddTypeToKeep(model.Type.FullyQualifiedName);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([model]);

            Assert.IsTrue(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsTrue(serialization.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(serialization.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
        }

        [Test]
        public void InternalizedGenericModelRemovesAritylessModelFactoryMethod()
        {
            var genericArgument = CreateNamedType("T", string.Empty);
            var genericModel = new GenericTestTypeProvider(
                "GenericModel`1",
                TypeSignatureModifiers.Public,
                "Sample.Models",
                genericArgument);
            var outputLibrary = new TestOutputLibrary(genericModel);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => outputLibrary,
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            modelFactory.Update(methods:
            [
                new MethodProvider(
                    new MethodSignature(
                        "GenericModel",
                        $"",
                        MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                        genericModel.Type,
                        $"",
                        []),
                    MethodBodyStatement.Empty,
                    modelFactory)
            ]);

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([genericModel]);

            Assert.IsTrue(genericModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(genericModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsEmpty(modelFactory.Methods.Select(m => m.Signature.Name));
        }

        [Test]
        public void RemovedModelDoesNotRemoveFactoryMethodForSameNamedModel()
        {
            var keptModel = new GeneratedModelTestTypeProvider("Widget", TypeSignatureModifiers.Public, ns: "Kept");
            var removedModel = new GeneratedModelTestTypeProvider("Widget", TypeSignatureModifiers.Public, ns: "Removed");
            var outputLibrary = new TestOutputLibrary(keptModel, removedModel);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => outputLibrary,
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");
            CodeModelGenerator.Instance.AddTypeToKeep(keptModel.Type.FullyQualifiedName);
            var modelFactory = CodeModelGenerator.Instance.OutputLibrary.ModelFactory.Value;
            modelFactory.Update(methods:
            [
                new MethodProvider(
                    new MethodSignature(
                        "Widget",
                        $"",
                        MethodSignatureModifiers.Static | MethodSignatureModifiers.Public,
                        keptModel.Type,
                        $"",
                        []),
                    MethodBodyStatement.Empty,
                    modelFactory)
            ]);

            ProviderReferenceMapAnalyzer.Analyze([keptModel, removedModel, modelFactory]);

            Assert.IsTrue(ProviderReferenceMapAnalyzer.ShouldWriteProvider(keptModel));
            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(removedModel));
            Assert.AreEqual(new[] { "Widget" }, modelFactory.Methods.Select(m => m.Signature.Name));
        }

        [Test]
        public void GeneratedTypeDoesNotPreserveLastContractTypeAttributes()
        {
            var lastContractView = new AttributedTestTypeProvider(
                "GeneratedModel",
                TypeSignatureModifiers.Internal,
                ns: "Sample",
                new AttributeStatement(typeof(ExperimentalAttribute), Literal("TEST001")));
            var generatedModel = new ContractedTestTypeProvider(
                "GeneratedModel",
                TypeSignatureModifiers.Internal,
                lastContractView,
                ns: "Sample");
            var outputLibrary = new TestOutputLibrary(generatedModel);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => outputLibrary,
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");

            ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility([generatedModel]);

            Assert.IsTrue(generatedModel.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            var codeFile = new TypeProviderWriter(generatedModel).Write();
            StringAssert.DoesNotContain("[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"TEST001\")]", codeFile.Content);
            StringAssert.Contains("internal partial class GeneratedModel", codeFile.Content);
        }

        [Test]
        public void GeneratedTypeDoesNotPreserveLastContractAttributeReferencingRemovedGeneratedType()
        {
            var removedModel = new GeneratedModelTestTypeProvider("RemovedModel", TypeSignatureModifiers.Internal, ns: "Sample");
            var lastContractView = new AttributedTestTypeProvider(
                "GeneratedModel",
                TypeSignatureModifiers.Internal,
                ns: "Sample",
                new AttributeStatement(typeof(ExperimentalAttribute), TypeOf(CreateNamedType("RemovedModel", "Sample"))));
            var generatedModel = new ContractedTestTypeProvider(
                "GeneratedModel",
                TypeSignatureModifiers.Internal,
                lastContractView,
                ns: "Sample");
            var outputLibrary = new TestOutputLibrary(generatedModel, removedModel);
            MockHelpers.LoadMockGenerator(
                createOutputLibrary: () => outputLibrary,
                configuration: "{\"unreferenced-types-handling\":\"removeOrInternalize\"}");

            ProviderReferenceMapAnalyzer.Analyze([generatedModel, removedModel]);

            Assert.IsFalse(ProviderReferenceMapAnalyzer.ShouldWriteProvider(removedModel));
            var codeFile = new TypeProviderWriter(generatedModel).Write();
            StringAssert.DoesNotContain("RemovedModel", codeFile.Content);
            StringAssert.Contains("internal partial class GeneratedModel", codeFile.Content);
        }

        private sealed class BodyDependencyTestTypeProvider : TestTypeProvider
        {
            private readonly CSharpType[] _bodyDependencyTypes;

            public BodyDependencyTestTypeProvider(string name, params CSharpType[] bodyDependencyTypes)
                : this(name, bodyDependencyTypes, ns: null)
            {
            }

            public BodyDependencyTestTypeProvider(string name, string? ns, params CSharpType[] bodyDependencyTypes)
                : this(name, bodyDependencyTypes, ns)
            {
            }

            public BodyDependencyTestTypeProvider(string name, string? ns, CSharpType[] bodyDependencyTypes, PropertyProvider[] properties)
                : base(name, TypeSignatureModifiers.Public, properties: properties, ns: ns)
            {
                _bodyDependencyTypes = bodyDependencyTypes;
            }

            public BodyDependencyTestTypeProvider(string name, CSharpType[] bodyDependencyTypes, string? ns)
                : base(name, TypeSignatureModifiers.Public, ns: ns)
            {
                _bodyDependencyTypes = bodyDependencyTypes;
            }

            protected internal override IReadOnlyList<CSharpType> BuildBodyDependencyTypes() => _bodyDependencyTypes;
        }

        private sealed class HelperDependencyTestTypeProvider : TestTypeProvider
        {
            private readonly CSharpType[] _helperDependencyTypes;

            public HelperDependencyTestTypeProvider(string name, string? ns, params CSharpType[] helperDependencyTypes)
                : base(name, TypeSignatureModifiers.Public, ns: ns)
            {
                _helperDependencyTypes = helperDependencyTypes;
            }

            protected internal override IReadOnlyList<CSharpType> BuildHelperDependencyTypes() => _helperDependencyTypes;
        }

        private sealed class ExtensionMethodTestTypeProvider : TestTypeProvider
        {
            private readonly string _methodName;
            private readonly CSharpType? _receiverType;

            public ExtensionMethodTestTypeProvider(string name, string methodName, string ns, CSharpType? receiverType = null)
                : base(name, TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static, ns: ns)
            {
                _methodName = methodName;
                _receiverType = receiverType;
            }

            protected internal override MethodProvider[] BuildMethods() =>
            [
                new MethodProvider(
                    new MethodSignature(
                        _methodName,
                        $"",
                        MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                        typeof(void),
                        $"",
                        _receiverType == null ? [] : [new ParameterProvider("value", $"", _receiverType)]),
                    MethodBodyStatement.Empty,
                    this)
            ];
        }

        private sealed class SignatureDependencyTestTypeProvider : TestTypeProvider
        {
            private readonly CSharpType[] _signatureDependencyTypes;

            public SignatureDependencyTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, params CSharpType[] signatureDependencyTypes)
                : this(name, declarationModifiers, ns: null, signatureDependencyTypes)
            {
            }

            public SignatureDependencyTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, string? ns, params CSharpType[] signatureDependencyTypes)
                : base(name, declarationModifiers, ns: ns)
            {
                _signatureDependencyTypes = signatureDependencyTypes;
            }

            protected internal override IReadOnlyList<CSharpType> BuildSignatureDependencyTypes() => _signatureDependencyTypes;
        }

        private sealed class CustomizableTestTypeProvider : TestTypeProvider
        {
            private readonly TypeProvider _customCodeView;

            public CustomizableTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, TypeProvider customCodeView, string ns)
                : base(name, declarationModifiers, ns: ns)
            {
                _customCodeView = customCodeView;
            }

            private protected override TypeProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => _customCodeView;
        }

        private sealed class AttributedTestTypeProvider : TestTypeProvider
        {
            private readonly AttributeStatement[] _attributes;

            public AttributedTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, string ns, params AttributeStatement[] attributes)
                : base(name, declarationModifiers, ns: ns)
            {
                _attributes = attributes;
            }

            protected override IReadOnlyList<AttributeStatement> BuildAttributes() => _attributes;
        }

        private sealed class ContractedTestTypeProvider : TestTypeProvider
        {
            private readonly TypeProvider _lastContractView;

            public ContractedTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, TypeProvider lastContractView, string ns)
                : base(name, declarationModifiers, ns: ns)
            {
                _lastContractView = lastContractView;
            }

            private protected override TypeProvider? BuildLastContractView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => _lastContractView;
        }

        private sealed class ConstructorDependencyTestTypeProvider : TestTypeProvider
        {
            private readonly TypeProvider _customCodeView;
            private readonly CSharpType[] _constructorParameterTypes;

            public ConstructorDependencyTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, TypeProvider customCodeView, string ns, params CSharpType[] constructorParameterTypes)
                : base(name, declarationModifiers, ns: ns)
            {
                _customCodeView = customCodeView;
                _constructorParameterTypes = constructorParameterTypes;
            }

            protected internal override ConstructorProvider[] BuildConstructors()
            {
                var parameters = _constructorParameterTypes
                    .Select((type, index) => new ParameterProvider($"p{index}", $"", type))
                    .ToArray();
                return
                [
                    new ConstructorProvider(
                        new ConstructorSignature(Type, $"", MethodSignatureModifiers.Public, parameters),
                        MethodBodyStatement.Empty,
                        this)
                ];
            }

            private protected override TypeProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => _customCodeView;
        }

        private sealed class NestedTestTypeProvider : TestTypeProvider
        {
            private readonly TypeProvider _declaringTypeProvider;

            public NestedTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, TypeProvider declaringTypeProvider, string ns)
                : base(name, declarationModifiers, ns: ns)
            {
                _declaringTypeProvider = declaringTypeProvider;
            }

            protected override TypeProvider? BuildDeclaringTypeProvider() => _declaringTypeProvider;
        }

        private sealed class GeneratedModelTestTypeProvider : TypeProvider
        {
            private readonly string _name;
            private readonly string _namespace;
            private readonly TypeSignatureModifiers _declarationModifiers;

            public GeneratedModelTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, string ns)
            {
                _name = name;
                _namespace = ns;
                _declarationModifiers = declarationModifiers;
            }

            protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", $"{Name}.cs");
            protected override string BuildName() => _name;
            protected override string BuildNamespace() => _namespace;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => _declarationModifiers;
        }

        private sealed class GenericTestTypeProvider : TestTypeProvider
        {
            private readonly CSharpType[] _typeArguments;

            public GenericTestTypeProvider(string name, TypeSignatureModifiers declarationModifiers, string ns, params CSharpType[] typeArguments)
                : base(name, declarationModifiers, ns: ns)
            {
                _typeArguments = typeArguments;
            }

            protected override CSharpType[] GetTypeArguments() => _typeArguments;
        }

        private sealed class ClientTestTypeProvider : TestTypeProvider
        {
            private readonly TypeProvider[] _serializationProviders;
            private readonly TypeProvider? _customCodeView;
            private readonly CSharpType[] _signatureDependencyTypes;

            public ClientTestTypeProvider(string name, params TypeProvider[] serializationProviders)
                : this(name, ns: null, customCodeView: null, serializationProviders: serializationProviders)
            {
            }

            public ClientTestTypeProvider(string name, string? ns, TypeProvider? customCodeView = null, TypeProvider[]? serializationProviders = null, params CSharpType[] signatureDependencyTypes)
                : base(name, TypeSignatureModifiers.Public, ns: ns)
            {
                _serializationProviders = serializationProviders ?? [];
                _customCodeView = customCodeView;
                _signatureDependencyTypes = signatureDependencyTypes;
            }

            protected internal override bool IsClientProvider => true;
            protected override TypeProvider[] BuildSerializationProviders() => _serializationProviders;
            private protected override TypeProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => _customCodeView;
            protected internal override IReadOnlyList<CSharpType> BuildSignatureDependencyTypes() => _signatureDependencyTypes;
        }

        private sealed class ClientProvider : TestTypeProvider
        {
            public ClientProvider()
                : base("SameNamedProvider", TypeSignatureModifiers.Public, ns: "Sample")
            {
            }
        }

        private static CSharpType CreateNamedType(string name, string ns, params CSharpType[] arguments)
        {
            var constructor = typeof(CSharpType).GetConstructor(
                BindingFlags.Instance | BindingFlags.NonPublic,
                binder: null,
                [typeof(string), typeof(string), typeof(bool), typeof(bool), typeof(CSharpType), typeof(IReadOnlyList<CSharpType>), typeof(bool), typeof(bool), typeof(CSharpType), typeof(Type)],
                modifiers: null)!;

            return (CSharpType)constructor.Invoke([name, ns, false, false, null, arguments, true, false, null, null]);
        }
    }
}
