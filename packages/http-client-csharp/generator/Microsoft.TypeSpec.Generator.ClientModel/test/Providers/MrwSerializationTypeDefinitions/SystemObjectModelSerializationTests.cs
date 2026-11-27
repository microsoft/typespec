// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using ClientModelProvider = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    /// <summary>
    /// Tests that serialization methods use correct modifiers when a model's base is
    /// <see cref="SystemObjectModelProvider"/>. This validates behavior that would be
    /// impossible with <see cref="SystemObjectTypeProvider"/> (which cannot serve as
    /// <see cref="ModelProvider.BaseModelProvider"/>).
    /// </summary>
    internal class SystemObjectModelSerializationTests
    {
        /// <summary>
        /// Creates a derived model with a SystemObjectModelProvider base and returns its serialization.
        /// </summary>
        private static (ModelProvider Model, MrwSerializationTypeDefinition Serialization) CreateDerivedModelWithSystemBase()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);
            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [derivedProp], baseModel: baseInputModel);

            // Use typeof(object) as a stand-in framework type.
            // SystemObjectModelProvider extracts name/namespace from the CSharpType.
            var systemType = new CSharpType(typeof(object));
            var systemBase = new SystemObjectModelProvider(systemType, baseInputModel);

            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                    {
                        return systemBase;
                    }

                    return new ModelProvider(model);
                },
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider mp
                        ? [new MrwSerializationTypeDefinition(modelType, mp)]
                        : []);
            generator.Object.TypeFactory.RootInputModels.Add(derivedInputModel);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInputModel);

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derived!.BaseModelProvider);

            var serializations = derived.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            return (derived, (MrwSerializationTypeDefinition)serializations[0]);
        }

        /// <summary>
        /// Creates a derived model with a regular (non-system) ModelProvider base and returns its serialization.
        /// </summary>
        private static (ModelProvider Model, MrwSerializationTypeDefinition Serialization) CreateDerivedModelWithRegularBase()
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var baseInputModel = InputFactory.Model("Resource", properties: [baseProp]);
            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [derivedProp], baseModel: baseInputModel);

            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider mp
                        ? [new MrwSerializationTypeDefinition(modelType, mp)]
                        : []);
            generator.Object.TypeFactory.RootInputModels.Add(derivedInputModel);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInputModel);

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);
            Assert.IsNotInstanceOf<SystemObjectModelProvider>(derived!.BaseModelProvider);

            var serializations = derived.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            return (derived, (MrwSerializationTypeDefinition)serializations[0]);
        }

        [Test]
        public async Task CreateCoreMethodsPreserveLastContractModelReturnTypeWithSystemBase()
        {
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            var lastContractCompilation = await Helpers.GetCompilationFromDirectoryAsync();
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, lastContractCompilation));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();

            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("TrackedResource"));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("TrackedResource"));
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public void CreateCoreHistoricalReturnIsNotWidenedByMappedCandidateDiscovery(bool discoverMappedCandidate)
        {
            var mappedInput = InputFactory.Model("KnownMappedBase", properties: []);
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedInput = InputFactory.Model("Derived", properties: [], baseModel: currentBase);
            var frameworkType = new CSharpType(typeof(CreateCoreFrameworkRoot));
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => discoverMappedCandidate
                    ? [mappedInput, currentBase, derivedInput] : [currentBase, derivedInput],
                createModelCore: input => input == mappedInput
                    ? new SystemObjectModelProvider(frameworkType, input) : new ClientModelProvider(input));
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(frameworkType);

            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(System.IO.Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Append(typeof(CreateCoreFrameworkRoot).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var historicalSource = $$"""
                namespace Sample.Models
                {
                    public class Derived : {{frameworkType.Namespace}}.{{frameworkType.Name}}
                    {
                        protected virtual Derived PersistableModelCreateCore(System.BinaryData data,
                            System.ClientModel.Primitives.ModelReaderWriterOptions options) => throw new System.NotImplementedException();
                        protected virtual Derived JsonModelCreateCore(ref System.Text.Json.Utf8JsonReader reader,
                            System.ClientModel.Primitives.ModelReaderWriterOptions options) => throw new System.NotImplementedException();
                    }
                }
                """;
            var historical = CSharpCompilation.Create("HistoricalCreateCoreReturn",
                [CSharpSyntaxTree.ParseText(historicalSource)], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, historical));

            // Let normal discovery register the candidate. Do not modify CSharpTypeMap or
            // normalize the historical parameters to manufacture the root traversal.
            var model = generator.Object.TypeFactory.CreateModel(derivedInput)!;
            Assert.That(model.BaseType?.AreNamesEqual(frameworkType), Is.True);
            Assert.That(generator.Object.TypeFactory.CSharpTypeMap.Keys.Any(type => type.AreNamesEqual(frameworkType)),
                Is.EqualTo(discoverMappedCandidate));
            var serialization = (MrwSerializationTypeDefinition)model.SerializationProviders.Single();
            var emitted = CSharpSyntaxTree.ParseText(new TypeProviderWriter(serialization).Write().Content);
            var signatures = emitted.GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>()
                .Where(method => method.Identifier.Text is "PersistableModelCreateCore" or "JsonModelCreateCore")
                .Select(method => method.WithBody(SyntaxFactory.Block(
                    SyntaxFactory.ParseStatement("throw new System.NotImplementedException();"))).ToFullString()).ToArray();
            Assert.That(signatures, Has.Length.EqualTo(2));
            var consumer = CSharpSyntaxTree.ParseText("""
                namespace Consumer
                {
                    public class ExistingSubclass : Sample.Models.Derived
                    {
                        public Sample.Models.Derived Clone(System.BinaryData data,
                            System.ClientModel.Primitives.ModelReaderWriterOptions options)
                            => base.PersistableModelCreateCore(data, options);
                        public Sample.Models.Derived Read(ref System.Text.Json.Utf8JsonReader reader,
                            System.ClientModel.Primitives.ModelReaderWriterOptions options)
                            => base.JsonModelCreateCore(ref reader, options);
                    }
                }
                """);
            Assert.That(historical.AddSyntaxTrees(consumer).GetDiagnostics()
                .Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty,
                "The unchanged consumer must compile against the shipped signatures.");
            var generatedSource = $"namespace Sample.Models {{ public class Derived : {frameworkType.Namespace}.{frameworkType.Name} {{ {string.Join("\n", signatures)} }} }}";
            var generated = CSharpCompilation.Create("GeneratedCreateCoreReturn",
                [CSharpSyntaxTree.ParseText(generatedSource), consumer], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.Multiple(() =>
            {
                Assert.That(generated.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error),
                    Is.Empty, "Root traversal must not break existing Derived-returning consumers with CS0266.");
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name, Is.EqualTo("Derived"));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name, Is.EqualTo("Derived"));
            });
        }

        [TestCase("PersistableOnlyResource")]
        [TestCase("JsonOnlyResource")]
        public async Task SingleHistoricalCreateCoreMethodCanSupplyVirtualModelReturnType(string modelName)
        {
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var derivedInputModel = InputFactory.Model(modelName, properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            var lastContractCompilation = await Helpers.GetCompilationFromDirectoryAsync();
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, lastContractCompilation));
            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var historicalMethod = derived.LastContractView!.Methods.Single();
            if (historicalMethod.Signature.Name == "JsonModelCreateCore")
            {
                // Isolate return selection using the reader shape required by the existing matcher.
                historicalMethod.Signature.Parameters[0].Update(type: typeof(Utf8JsonReader));
            }
            Assert.That(MrwSerializationTypeDefinition.IsCreateCoreMethod(historicalMethod.Signature), Is.True);
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();
            var methods = new[] { serialization.BuildPersistableModelCreateCoreMethod(), serialization.BuildJsonModelCreateCoreMethod() };
            Assert.Multiple(() =>
            {
                foreach (var method in methods)
                {
                    Assert.That(method.Signature.ReturnType?.Name, Is.EqualTo(modelName));
                    Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), Is.True);
                    Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.False);
                }
            });

            // Compile the exact emitted signatures with throw bodies to isolate the reported
            // invalid-override concern from unrelated deserializer/helper dependencies.
            var emitted = CSharpSyntaxTree.ParseText(new TypeProviderWriter(serialization).Write().Content);
            var signatures = emitted.GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>()
                .Where(method => method.Identifier.Text is "PersistableModelCreateCore" or "JsonModelCreateCore")
                .Select(method => method.WithBody(SyntaxFactory.Block(
                    SyntaxFactory.ParseStatement("throw new System.NotImplementedException();"))).ToFullString());
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(System.IO.Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path));
            var compilation = CSharpCompilation.Create("SingleHistoricalCreateCoreSignatures",
                [CSharpSyntaxTree.ParseText($"namespace Sample.Models {{ public class {modelName} : object {{ {string.Join("\n", signatures)} }} }}")],
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [Test]
        public async Task CreateCoreMethodsPreserveInheritedLastContractModelReturnTypeWithSystemBase()
        {
            var baseInputModel = InputFactory.Model("FrameworkMapped", properties: []);
            var derivedInputModel = InputFactory.Model("DerivedModel", properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(InheritedCreateCoreMapped)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            generator.Object.AddMetadataReference(MetadataReference.CreateFromFile(typeof(InheritedCreateCoreMapped).Assembly.Location));
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, await Helpers.GetCompilationFromDirectoryAsync()));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();

            Assert.That(derived.LastContractView!.Methods, Is.Empty);
            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo(nameof(InheritedCreateCoreRoot)));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo(nameof(InheritedCreateCoreRoot)));
            });
        }

        [Test]
        public async Task CreateCoreMethodsPreferNearestInheritedLastContractMethodWithSystemBase()
        {
            var baseInputModel = InputFactory.Model("FrameworkLeaf", properties: []);
            var derivedInputModel = InputFactory.Model("DerivedModel", properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(InheritedCreateCoreLeaf)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            generator.Object.AddMetadataReference(MetadataReference.CreateFromFile(typeof(InheritedCreateCoreLeaf).Assembly.Location));
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, await Helpers.GetCompilationFromDirectoryAsync()));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();

            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo(nameof(InheritedCreateCoreMiddle)));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo(nameof(InheritedCreateCoreMiddle)));
            });
        }

        [Test]
        public async Task CreateCoreMethodsIgnoreUnrelatedLastContractReturnTypeWithSystemBase()
        {
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            var lastContractCompilation = await Helpers.GetCompilationFromDirectoryAsync();
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, lastContractCompilation));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();

            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
            });
        }

        [TestCase("TrackedResource")]
        [TestCase("ResourceWithMixedReturn")]
        public async Task CreateCoreMethodsIgnoreMixedLastContractReturnTypesWithSystemBase(string modelName)
        {
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var derivedInputModel = InputFactory.Model(modelName, properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, await Helpers.GetCompilationFromDirectoryAsync()));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();
            // The matcher intentionally requires the framework-backed reader parameter shape.
            // Keep this regression about return matching, not symbol/framework type reconciliation.
            derived.LastContractView!.Methods.Single(method => method.Signature.Name == "JsonModelCreateCore")
                .Signature.Parameters[0].Update(type: typeof(Utf8JsonReader));
            Assert.That(derived.LastContractView.Methods.Count(method =>
                MrwSerializationTypeDefinition.IsCreateCoreMethod(method.Signature)), Is.EqualTo(2),
                "Both historical methods must be recognized to reproduce the partial-return match.");
            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
            });
        }

        [Test]
        public async Task CreateCoreMethodsIgnoreRemovedLastContractReturnTypeWithSystemBase()
        {
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var derivedInputModel = InputFactory.Model("DerivedModel", properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            var lastContractCompilation = await Helpers.GetCompilationFromDirectoryAsync();
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, lastContractCompilation));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var removedType = derived.LastContractView!.Methods
                .Single(method => method.Signature.Name == "JsonModelCreateCore")
                .Signature.ReturnType!;
            ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[removedType] = new SystemObjectTypeProvider(removedType);
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();

            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
            });
        }

        [Test]
        public async Task CreateCoreMethodsIgnoreAvailableModelOutsideCurrentHierarchyWithSystemBase()
        {
            var baseInputModel = InputFactory.Model("Resource", properties: []);
            var derivedInputModel = InputFactory.Model("DerivedModel", properties: [], baseModel: baseInputModel);
            var systemBase = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: model => model == baseInputModel ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider modelProvider
                        ? [new MrwSerializationTypeDefinition(modelType, modelProvider)]
                        : []);
            var lastContractCompilation = await Helpers.GetCompilationFromDirectoryAsync(
                method: nameof(CreateCoreMethodsIgnoreRemovedLastContractReturnTypeWithSystemBase));
            generator.SetupProperty(
                plugin => plugin.SourceInputModel,
                new SourceInputModel(null, lastContractCompilation));

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel)!;
            var previousBase = derived.LastContractView!.Methods
                .Single(method => method.Signature.Name == "JsonModelCreateCore")
                .Signature.ReturnType!;
            ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[previousBase] =
                new ModelProvider(InputFactory.Model("UnrelatedModel", properties: []));
            var serialization = (MrwSerializationTypeDefinition)derived.SerializationProviders.Single();

            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.ReturnType?.Name,
                    Is.EqualTo("Object"));
            });
        }

        [Test]
        public async Task GeneratedSerializationMethodDoesNotBlockRootBaseRestoration()
        {
            var previousBase = InputFactory.Model("PreviousBase", usage: InputModelTypeUsage.Json, properties: []);
            var currentBase = InputFactory.Model("CurrentBase", usage: InputModelTypeUsage.Json, properties: []);
            var derivedModel = InputFactory.Model(
                "DerivedModel",
                usage: InputModelTypeUsage.Json,
                properties: [],
                baseModel: currentBase);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [derivedModel, currentBase, previousBase],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var provider = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .Single(model => model.Name == "DerivedModel");

            Assert.That(provider.BaseType?.Name, Is.EqualTo("PreviousBase"));
        }

        [Test]
        public void CreateCoreMatcherRejectsGenericMethod()
        {
            var signature = new MethodSignature(
                "JsonModelCreateCore",
                null,
                MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual,
                typeof(string),
                null,
                [
                    new ParameterProvider("reader", $"", typeof(Utf8JsonReader), isRef: true),
                    new ParameterProvider("options", $"", typeof(ModelReaderWriterOptions))
                ],
                GenericArguments: [new CSharpType(typeof(string))]);

            Assert.That(MrwSerializationTypeDefinition.IsCreateCoreMethod(signature), Is.False);
        }

        [TestCase(true, true)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(false, false)]
        public void CreateCoreMatcherRequiresSupportedSignature(bool json, bool unsupported)
        {
            var signature = new MethodSignature(
                json ? "JsonModelCreateCore" : "PersistableModelCreateCore",
                null,
                MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual,
                typeof(string),
                null,
                [
                    new ParameterProvider("data", $"", json ? typeof(Utf8JsonReader) : typeof(BinaryData), isRef: json),
                    new ParameterProvider("options", $"", typeof(ModelReaderWriterOptions))
                ])
            {
                HasUnsupportedBaseContract = unsupported
            };

            Assert.That(MrwSerializationTypeDefinition.IsCreateCoreMethod(signature), Is.EqualTo(!unsupported));
        }

        [TestCase(true)]
        [TestCase(false)]
        public void CreateCoreMatcherRejectsUnsupportedParameterModifiers(bool firstParameter)
        {
            var signature = new MethodSignature(
                "PersistableModelCreateCore", null,
                MethodSignatureModifiers.Protected | MethodSignatureModifiers.Virtual,
                typeof(string), null,
                [
                    new ParameterProvider("data", $"", typeof(BinaryData)) { HasUnsupportedParameterModifiers = firstParameter },
                    new ParameterProvider("options", $"", typeof(ModelReaderWriterOptions)) { HasUnsupportedParameterModifiers = !firstParameter }
                ]);

            Assert.That(MrwSerializationTypeDefinition.IsCreateCoreMethod(signature), Is.False);
        }

        [TestCase(MethodSignatureModifiers.Protected)]
        [TestCase(MethodSignatureModifiers.Protected | MethodSignatureModifiers.Internal | MethodSignatureModifiers.Virtual)]
        [TestCase(MethodSignatureModifiers.Protected | MethodSignatureModifiers.Abstract)]
        public void CreateCoreMatcherRejectsNonGeneratedModifiers(MethodSignatureModifiers modifiers)
        {
            var signature = new MethodSignature(
                "JsonModelCreateCore",
                null,
                modifiers,
                typeof(string),
                null,
                [
                    new ParameterProvider("reader", $"", typeof(Utf8JsonReader), isRef: true),
                    new ParameterProvider("options", $"", typeof(ModelReaderWriterOptions))
                ]);

            Assert.That(MrwSerializationTypeDefinition.IsCreateCoreMethod(signature), Is.False);
        }

        // -------------------------------------------------------------------
        // JsonModelWriteCore only overrides bases that provide a compatible method.
        // -------------------------------------------------------------------

        [Test]
        public void JsonModelWriteCore_IsVirtual_WhenSystemBaseHasNoWriteCore()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "A system base without JsonModelWriteCore cannot be overridden");
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void JsonModelWriteCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelWriteCore should be 'override' with regular base too");
        }

        [Test]
        public void JsonModelWriteCore_IsOverride_WhenBaseProviderIsResolvedAfterSerialization()
        {
            var baseInputModel = InputFactory.Model("Resource");
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [InputFactory.Property("Location", InputPrimitiveType.String)]);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseInputModel, derivedInputModel]);

            var derived = new DelayedBaseModelProvider(derivedInputModel);
            var serialization = new MrwSerializationTypeDefinition(derivedInputModel, derived);

            // The serialization provider can be constructed before later visitors/customization
            // resolution make the base model provider available.
            derived.BaseModel = new SystemObjectModelProvider(new CSharpType(typeof(object)), baseInputModel);

            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.AreEqual(derived.BaseModel.Type, derived.Type.BaseType,
                "The generated model type should inherit the base resolved after serialization construction.");
            Assert.AreEqual(derived.BaseModel.Type, serialization.Type.BaseType,
                "The serialization type should inherit the same resolved base.");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "The resolved system base does not declare JsonModelWriteCore");
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void XmlModelWriteCore_IsOverride_WhenBaseProviderIsResolvedAfterSerialization()
        {
            var baseInputModel = InputFactory.Model("Resource", usage: InputModelTypeUsage.Xml);
            var derivedInputModel = InputFactory.Model(
                "TrackedResource",
                properties: [InputFactory.Property("Location", InputPrimitiveType.String)],
                usage: InputModelTypeUsage.Xml);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseInputModel, derivedInputModel]);

            var derived = new DelayedBaseModelProvider(derivedInputModel);
            var serialization = new MrwSerializationTypeDefinition(derivedInputModel, derived);

            derived.BaseModel = new ModelProvider(baseInputModel);

            var method = serialization.Methods.Single(method => method.Signature.Name == "XmlModelWriteCore");

            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override));
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        // -------------------------------------------------------------------
        // PersistableModelWriteCore: 'virtual' with system base, 'override' with regular
        // (the framework base already implements this; derived model re-introduces it)
        // -------------------------------------------------------------------

        [Test]
        public void PersistableModelWriteCore_IsVirtual_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "PersistableModelWriteCore should be 'virtual' when base is SystemObjectModelProvider " +
                "(framework already has this method; derived re-introduces, not overrides)");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelWriteCore should NOT be 'override' with SystemObjectModelProvider base");
        }

        [Test]
        public void PersistableModelWriteCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelWriteCore should be 'override' with regular base model");
        }

        // -------------------------------------------------------------------
        // PersistableModelCreateCore: 'virtual' with system base, 'override' with regular
        // -------------------------------------------------------------------

        [Test]
        public void PersistableModelCreateCore_IsVirtual_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "PersistableModelCreateCore should be 'virtual' when base is SystemObjectModelProvider");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelCreateCore should NOT be 'override' with SystemObjectModelProvider base");
        }

        [Test]
        public void PersistableModelCreateCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelCreateCore should be 'override' with regular base model");
        }

        // -------------------------------------------------------------------
        // JsonModelCreateCore: 'virtual' with system base, 'override' with regular
        // -------------------------------------------------------------------

        [Test]
        public void JsonModelCreateCore_IsVirtual_WhenBaseIsSystemObject()
        {
            var (_, serialization) = CreateDerivedModelWithSystemBase();
            var method = serialization.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "JsonModelCreateCore should be 'virtual' when base is SystemObjectModelProvider");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelCreateCore should NOT be 'override' with SystemObjectModelProvider base");
        }

        [Test]
        public void JsonModelCreateCore_IsOverride_WhenBaseIsRegularModel()
        {
            var (_, serialization) = CreateDerivedModelWithRegularBase();
            var method = serialization.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelCreateCore should be 'override' with regular base model");
        }

        /// <summary>
        /// Creates a derived model whose SystemObjectModelProvider base wraps a framework type that
        /// itself follows the generated MRW pattern (declares the protected virtual *Core methods).
        /// </summary>
        private static (ModelProvider Model, MrwSerializationTypeDefinition Serialization) CreateDerivedModelWithMrwSystemBase(Type? frameworkType = null,
            CSharpType? mappedType = null, bool external = false, bool additionalPropertiesOnly = false, Compilation? customization = null, bool inheritedPayload = false)
        {
            var baseProp = InputFactory.Property("Name", InputPrimitiveType.String);
            var payload = inheritedPayload ? InputFactory.Model("Payload", properties: additionalPropertiesOnly ? [] : [baseProp],
                additionalProperties: additionalPropertiesOnly ? InputPrimitiveType.String : null) : null;
            var baseInputModel = InputFactory.Model("Resource", properties: additionalPropertiesOnly || inheritedPayload ? [] : [baseProp], external: external
                ? new InputExternalTypeMetadata(frameworkType!.AssemblyQualifiedName!, null, null) : null,
                additionalProperties: additionalPropertiesOnly && !inheritedPayload ? InputPrimitiveType.String : null, baseModel: payload);
            var derivedProp = InputFactory.Property("Location", InputPrimitiveType.String);
            var derivedInputModel = InputFactory.Model("TrackedResource", properties: [derivedProp], baseModel: baseInputModel);

            // The base wraps a framework type that declares the generated MRW *Core methods, so a
            // derived model must override them (mirrors deriving from an external MRW-generated type).
            var systemType = mappedType ?? new CSharpType(frameworkType ?? typeof(FakeMrwBase));
            var systemBase = new SystemObjectModelProvider(systemType, baseInputModel);

            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInputModel, derivedInputModel],
                createModelCore: (model) =>
                {
                    if (model.Name == "Resource")
                        return systemBase;
                    return new ModelProvider(model);
                },
                createSerializationsCore: (inputType, typeProvider) =>
                    inputType is InputModelType modelType && typeProvider is ModelProvider mp
                        ? [new MrwSerializationTypeDefinition(modelType, mp)]
                        : []);
            if (customization is not null)
            {
                generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(customization, null));
            }
            generator.Object.TypeFactory.RootInputModels.Add(derivedInputModel);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInputModel);

            var derived = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel) as ModelProvider;
            Assert.IsNotNull(derived);
            Assert.IsInstanceOf<SystemObjectModelProvider>(derived!.BaseModelProvider);

            var serializations = derived.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            return (derived, (MrwSerializationTypeDefinition)serializations[0]);
        }

        // -------------------------------------------------------------------
        // When the external/system base itself follows the generated MRW pattern (declares the
        // protected virtual *Core methods), the derived model must OVERRIDE them rather than
        // re-introduce them as virtual. Regression test for issue #11042 where deriving from an
        // external MRW-generated base (e.g. OpenAI's ResponseItem) produced CS0114.
        // -------------------------------------------------------------------

        [Test]
        public void PersistableModelCreateCore_IsOverride_WhenSystemBaseDeclaresCoreMethods()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase();
            var method = serialization.BuildPersistableModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelCreateCore should be 'override' when the system base declares the *Core methods");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "PersistableModelCreateCore should NOT be 'virtual' when the system base declares the *Core methods");
        }

        [Test]
        public void JsonModelCreateCore_IsOverride_WhenSystemBaseDeclaresCoreMethods()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase();
            var method = serialization.BuildJsonModelCreateCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelCreateCore should be 'override' when the system base declares the *Core methods");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "JsonModelCreateCore should NOT be 'virtual' when the system base declares the *Core methods");
        }

        [Test]
        public void PersistableModelWriteCore_IsOverride_WhenSystemBaseDeclaresCoreMethods()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase();
            var method = serialization.BuildPersistableModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "PersistableModelWriteCore should be 'override' when the system base declares the *Core methods");
            Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual),
                "PersistableModelWriteCore should NOT be 'virtual' when the system base declares the *Core methods");
        }

        [Test]
        public void JsonModelWriteCore_IsOverride_WhenSystemBaseDeclaresCoreMethods()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase();
            var method = serialization.BuildJsonModelWriteCoreMethod();

            Assert.IsNotNull(method);
            Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override),
                "JsonModelWriteCore should be 'override' when the system base declares the *Core methods");
        }

        [Test]
        public void LegacyMrwBaseDoesNotOverrideMissingCoreMethods()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(LegacyMrwBase));
            var inheritedWrite = serialization.BuildJsonModelWriteCoreMethod();
            var missingMethods = new[]
            {
                serialization.BuildPersistableModelCreateCoreMethod(),
                serialization.BuildJsonModelCreateCoreMethod(),
                serialization.BuildPersistableModelWriteCoreMethod(),
            };
            Assert.Multiple(() =>
            {
                Assert.That(inheritedWrite.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
                foreach (var method in missingMethods)
                {
                    Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), Is.True, method.Signature.Name);
                    Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.False, method.Signature.Name);
                }
            });
        }

        [Test]
        public void LegacyMrwBaseWithoutWriteCoreDoesNotEmitBaseCall()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(InterfaceOnlyMrwBase));
            var method = serialization.BuildJsonModelWriteCoreMethod();
            Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), Is.True);
            Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.False);
            Assert.That(new TypeProviderWriter(serialization).Write().Content, Does.Not.Contain("base.JsonModelWriteCore("));
        }

        [Test]
        public void LegacyMrwBaseSelectsCoreOverridesIndependently()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(PartialCoreMrwBase));
            Assert.Multiple(() =>
            {
                Assert.That(serialization.BuildJsonModelWriteCoreMethod().Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
                Assert.That(serialization.BuildPersistableModelWriteCoreMethod().Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
                Assert.That(serialization.BuildPersistableModelCreateCoreMethod().Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), Is.True);
                Assert.That(serialization.BuildJsonModelCreateCoreMethod().Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), Is.True);
            });
        }

        [Test]
        public void SystemBaseWithGenericAndNongenericCoreOverloadsSelectsNongenericSlot()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(OverloadedCoreMrwBase));
            Assert.That(serialization.BuildPersistableModelWriteCoreMethod().Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
        }

        [Test]
        public void SystemBaseWithPublicVirtualWriteCoreUsesPublicOverride()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(PublicWriteCoreMrwBase));
            var method = serialization.BuildJsonModelWriteCoreMethod();
            Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public), Is.True);
            Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
        }

        [TestCase(null, false)]
        [TestCase("override", false)]
        [TestCase("new", false)]
        [TestCase("sealed override", false)]
        [TestCase(null, true)]
        [TestCase("public generic", false, true)]
        [TestCase("new virtual partial", false)]
        [TestCase("new", false, true)]
        [TestCase("sealed override", false, true)]
        [TestCase("abstract override", false, true)]
        public void PublicCoreAccessibilityIsPreservedThroughGeneratedInheritance(string? handwrittenModifiers, bool suppressed, bool protectedBase = false)
        {
            var baseInput = InputFactory.Model("Resource", properties: []);
            var middleInput = InputFactory.Model("Middle", properties: [], baseModel: baseInput);
            var leafInput = InputFactory.Model("Leaf", properties: [], baseModel: middleInput);
            var frameworkType = protectedBase ? typeof(LegacyMrwBase) : typeof(PublicWriteCoreMrwBase);
            var systemBase = new SystemObjectModelProvider(new CSharpType(frameworkType), baseInput);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [baseInput, middleInput, leafInput],
                createModelCore: model => model == baseInput ? systemBase : new ModelProvider(model),
                createSerializationsCore: (inputType, provider) =>
                    inputType is InputModelType input && provider is ModelProvider model
                        ? [new MrwSerializationTypeDefinition(input, model)] : []);
            var abstractMiddle = handwrittenModifiers == "abstract override";
            var genericOverload = handwrittenModifiers == "public generic";
            var partialCore = handwrittenModifiers == "new virtual partial";
            var accessibility = protectedBase && !genericOverload || partialCore ? "protected" : "public";
            var methodModifiers = genericOverload ? "virtual" : handwrittenModifiers;
            var customMethod = handwrittenModifiers is null ? "" : $"{accessibility} {methodModifiers} void JsonModelWriteCore{(genericOverload ? "<T>" : "")}(global::System.Text.Json.Utf8JsonWriter writer, global::System.ClientModel.Primitives.ModelReaderWriterOptions options){(abstractMiddle || partialCore ? ";" : " { }")}";
            const string suppressAttribute = "[Microsoft.TypeSpec.Generator.Customizations.CodeGenSuppress(\"JsonModelWriteCore\", typeof(global::System.Text.Json.Utf8JsonWriter), typeof(global::System.ClientModel.Primitives.ModelReaderWriterOptions))]";
            const string suppressDefinition = "namespace Microsoft.TypeSpec.Generator.Customizations { [System.AttributeUsage(System.AttributeTargets.Class)] internal class CodeGenSuppressAttribute(string name, params System.Type[] parameters) : System.Attribute { } }";
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location).Append(typeof(PublicWriteCoreMrwBase).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path));
            if (handwrittenModifiers is not null || suppressed)
            {
                var custom = CSharpCompilation.Create("CustomPublicCore", [CSharpSyntaxTree.ParseText(
                    $"{(suppressed ? suppressDefinition : "")} namespace Sample.Models {{ {(suppressed ? suppressAttribute : "")} public {(abstractMiddle ? "abstract " : "")}partial class Middle : global::{frameworkType.FullName} {{ {customMethod} }} }}")], references);
                generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(custom, null));
                _ = generator.Object.TypeFactory.CreateModel(baseInput);
            }
            generator.Object.TypeFactory.RootInputModels.Add(leafInput);
            generator.Object.TypeFactory.RootOutputModels.Add(leafInput);
            var middle = generator.Object.TypeFactory.CreateModel(middleInput)!;
            var leaf = generator.Object.TypeFactory.CreateModel(leafInput)!;
            var middleSerialization = (MrwSerializationTypeDefinition)middle.SerializationProviders.Single();
            var leafSerialization = (MrwSerializationTypeDefinition)leaf.SerializationProviders.Single();
            var middleMethod = middleSerialization.BuildJsonModelWriteCoreMethod();
            var leafMethod = leafSerialization.BuildJsonModelWriteCoreMethod();
            Assert.That(middleMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public), Is.EqualTo(!protectedBase));
            Assert.That(leafMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public), Is.EqualTo(!protectedBase && !partialCore));
            if (abstractMiddle)
            {
                Assert.That(new TypeProviderWriter(leafSerialization).Write().Content, Does.Not.Contain("base.JsonModelWriteCore("));
            }

            static string Signature(MrwSerializationTypeDefinition serialization) => CSharpSyntaxTree.ParseText(new TypeProviderWriter(serialization).Write().Content)
                .GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>()
                .Single(method => method.Identifier.Text == "JsonModelWriteCore")
                .WithBody(SyntaxFactory.Block(SyntaxFactory.ParseStatement("throw new System.NotImplementedException();"))).ToFullString();
            var middleWriter = genericOverload || partialCore ? Signature(middleSerialization) + customMethod :
                suppressed || handwrittenModifiers is not null ? customMethod : Signature(middleSerialization);
            var source = $"namespace Samples.Models {{ public {(abstractMiddle ? "abstract " : "")}partial class Middle : global::{frameworkType.FullName} {{ {middleWriter} }} " +
                $"public class Leaf : Middle {{ {Signature(leafSerialization)} }} }}";
            var compilation = CSharpCompilation.Create("PublicCoreInheritance", [CSharpSyntaxTree.ParseText(source)], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary).WithGeneralDiagnosticOption(ReportDiagnostic.Error));
            Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [TestCase("abstract override", ";", "cannot call the abstract writer")]
        [TestCase("sealed override", "{ }", "cannot override the sealed writer")]
        [TestCase("abstract override", ";", "cannot call the abstract writer", true, false)]
        [TestCase("sealed override", "{ }", "cannot override the sealed writer", false, true)]
        [TestCase("sealed override", "{ }", "cannot override the sealed writer", false, false, true)]
        public void GeneratedHierarchyRejectsWriterSlotsThatLosePayload(string modifiers, string body, string expected,
            bool rawPayloadOnly = false, bool emptyIntermediate = false, bool dynamicLeaf = false)
        {
            var parentInput = InputFactory.Model("Parent", properties: rawPayloadOnly ? [] : [InputFactory.Property("inherited", InputPrimitiveType.String)]);
            var middleInput = InputFactory.Model("Middle", properties: [], baseModel: parentInput);
            var intermediateInput = InputFactory.Model("Intermediate", properties: [], baseModel: middleInput);
            var leafInput = InputFactory.Model("Leaf", properties: dynamicLeaf ? [] : [InputFactory.Property("local", InputPrimitiveType.String)],
                baseModel: emptyIntermediate ? intermediateInput : middleInput, isDynamicModel: dynamicLeaf);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => emptyIntermediate
                    ? [parentInput, middleInput, intermediateInput, leafInput] : [parentInput, middleInput, leafInput],
                createModelCore: model => dynamicLeaf ? new ClientModelProvider(model) : new ModelProvider(model),
                createSerializationsCore: (input, provider) => input is InputModelType model && provider is ModelProvider modelProvider
                    ? [new MrwSerializationTypeDefinition(model, modelProvider)] : []);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location).Distinct().Select(path => MetadataReference.CreateFromFile(path));
            var declaration = modifiers.StartsWith("abstract", StringComparison.Ordinal) ? "abstract " : "";
            var source = $$"""
                namespace Sample.Models
                {
                    public {{declaration}}partial class Middle
                    {
                        protected {{modifiers}} void JsonModelWriteCore(global::System.Text.Json.Utf8JsonWriter writer,
                            global::System.ClientModel.Primitives.ModelReaderWriterOptions options) {{body}}
                    }
                }
                """;
            var custom = CSharpCompilation.Create("CustomIntermediateWriter", [CSharpSyntaxTree.ParseText(source)], references);
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(custom, null));
            using var diagnostics = new MemoryStream();
            generator.SetupGet(plugin => plugin.Emitter).Returns(new Emitter(diagnostics));
            var leaf = generator.Object.TypeFactory.CreateModel(leafInput)!;
            var generated = new TypeProviderWriter(leaf.SerializationProviders.Single()).Write().Content;
            if (dynamicLeaf)
            {
                Assert.That(generated, Does.Contain("Patch"));
            }
            var output = System.Text.Encoding.UTF8.GetString(diagnostics.ToArray());
            Assert.That(output, Does.Contain(expected));
            Assert.That(output, Does.Contain("\"severity\":\"error\""));
        }

        [Test]
        public void SystemBaseWithNonvirtualWriteCoreExplicitlyHidesIt()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(NonvirtualWriteCoreMrwBase));
            var method = serialization.BuildJsonModelWriteCoreMethod();
            Assert.Multiple(() =>
            {
                Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.New), Is.True);
                Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), Is.True);
                Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.False);
                // An accessible nonvirtual helper is not necessarily the base's interface writer.
                Assert.That(new TypeProviderWriter(serialization).Write().Content, Does.Not.Contain("base.JsonModelWriteCore("));
            });
        }

        [TestCase(typeof(OpaquePayloadWriterBase))]
        [TestCase(typeof(OpaqueWriterWithUnrelatedNonvirtualHelper))]
        [TestCase(typeof(OpaqueFieldWriterBase))]
        [TestCase(typeof(AbstractOpaqueWriterBase))]
        [TestCase(typeof(OpaquePrivateStorageWriterBase), true)]
        [TestCase(typeof(OpaquePrivateStorageWriterBase), false)]
        public void OpaqueFrameworkWriterWithMappedFieldsReportsUnsupportedSerialization(Type frameworkType, bool explicitExternal = false)
        {
            using var diagnostics = new MemoryStream();
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(frameworkType, external: explicitExternal);
            Mock.Get(ScmCodeModelGenerator.Instance).SetupGet(plugin => plugin.Emitter).Returns(new Emitter(diagnostics));
            var generated = new TypeProviderWriter(serialization).Write().Content;
            Assert.That(generated, Does.Not.Contain("base.JsonModelWriteCore("));
            var output = System.Text.Encoding.UTF8.GetString(diagnostics.ToArray());
            Assert.That(output, Does.Contain("no accessible JSON write core"));
            Assert.That(output, Does.Contain("\"severity\":\"error\""));
        }

        [TestCase(true, false)]
        [TestCase(true, true)]
        [TestCase(false, true)]
        public void OpaqueDeclaredPayloadRequiresComposableWriter(bool additionalProperties, bool inherited)
        {
            using var diagnostics = new MemoryStream();
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(OpaquePrivateStorageWriterBase),
                external: true, additionalPropertiesOnly: additionalProperties, inheritedPayload: inherited);
            Mock.Get(ScmCodeModelGenerator.Instance).SetupGet(plugin => plugin.Emitter).Returns(new Emitter(diagnostics));
            _ = new TypeProviderWriter(serialization).Write();
            Assert.That(System.Text.Encoding.UTF8.GetString(diagnostics.ToArray()), Does.Contain("no accessible JSON write core"));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void HandwrittenWriterCanOwnOpaqueInheritedPayload(bool suppressCore)
        {
            using var diagnostics = new MemoryStream();
            const string source = """
                namespace Sample.Models
                {
                    public partial class TrackedResource
                    {
                        protected virtual void JsonModelWriteCore(System.Text.Json.Utf8JsonWriter writer,
                            System.ClientModel.Primitives.ModelReaderWriterOptions options) => writer.WriteString("name", Name);
                    }
                }
                """;
            const string suppressingSource = """
                using System;
                using System.ClientModel.Primitives;
                using System.Text.Json;
                namespace Microsoft.TypeSpec.Generator.Customizations
                {
                    [AttributeUsage(AttributeTargets.Class)]
                    internal class CodeGenSuppressAttribute(string name, params Type[] parameters) : Attribute { }
                }
                namespace Sample.Models
                {
                    [Microsoft.TypeSpec.Generator.Customizations.CodeGenSuppress("JsonModelWriteCore", typeof(Utf8JsonWriter), typeof(ModelReaderWriterOptions))]
                    public partial class TrackedResource : IJsonModel<TrackedResource>
                    {
                        void IJsonModel<TrackedResource>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
                        {
                            writer.WriteStartObject();
                            writer.WriteString("name", Name);
                            writer.WriteEndObject();
                        }
                    }
                }
                """;
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location).Distinct().Select(path => MetadataReference.CreateFromFile(path));
            var custom = CSharpCompilation.Create("CustomOpaqueWriter", [CSharpSyntaxTree.ParseText(suppressCore ? suppressingSource : source)], references);
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(OpaquePayloadWriterBase), customization: custom);
            Mock.Get(ScmCodeModelGenerator.Instance).SetupGet(plugin => plugin.Emitter).Returns(new Emitter(diagnostics));
            var generated = new TypeProviderWriter(serialization).Write().Content;
            var syntax = CSharpSyntaxTree.ParseText(generated).GetRoot();
            Assert.That(syntax.DescendantNodes().OfType<MethodDeclarationSyntax>().Any(method => method.Identifier.Text == "JsonModelWriteCore"), Is.False);
            Assert.That(System.Text.Encoding.UTF8.GetString(diagnostics.ToArray()), Does.Not.Contain("no accessible JSON write core"));
        }

        [TestCase(typeof(NonMrwWriteHelperBase))]
        [TestCase(typeof(PublicVirtualNonMrwWriteHelperBase))]
        [TestCase(typeof(ProtectedVirtualNonMrwHelperBase))]
        public void NonMrwFrameworkHelperIsNotCalledAsAWriter(Type frameworkType)
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(frameworkType);
            var method = serialization.BuildJsonModelWriteCoreMethod();
            Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.New), Is.True);
            Assert.That(new TypeProviderWriter(serialization).Write().Content, Does.Not.Contain("base.JsonModelWriteCore("));
        }

        [TestCase(typeof(PublicVirtualNonMrwWriteHelperBase))]
        [TestCase(typeof(ProtectedVirtualNonMrwHelperBase))]
        public void NonMrwCreateAndPersistenceHelpersAreNotOverridden(Type frameworkType)
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(frameworkType);
            var methods = new[] { serialization.BuildJsonModelCreateCoreMethod(), serialization.BuildPersistableModelCreateCoreMethod(),
                serialization.BuildPersistableModelWriteCoreMethod() };
            Assert.That(methods.All(method => method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.New) &&
                !method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override)), Is.True);
        }

        [TestCase(typeof(AlternateReturnCreateCoreBase))]
        [TestCase(typeof(AbstractAlternateReturnCreateCoreBase))]
        [TestCase(typeof(InterfaceReturnCreateCoreBase))]
        public void IncompatibleFrameworkCreateCoresReportUnsupportedDispatch(Type frameworkType)
        {
            using var diagnostics = new MemoryStream();
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(frameworkType);
            Mock.Get(ScmCodeModelGenerator.Instance).SetupGet(plugin => plugin.Emitter).Returns(new Emitter(diagnostics));
            _ = new TypeProviderWriter(serialization).Write();
            var output = System.Text.Encoding.UTF8.GetString(diagnostics.ToArray());
            Assert.That(output, Does.Contain("incompatible return type"));
            Assert.That(output, Does.Contain("JsonModelCreateCore").And.Contain("PersistableModelCreateCore"));
            Assert.That(output, Does.Contain("\"severity\":\"error\""));
        }

        [Test]
        public void FrameworkCreateCoresCanOverrideCovariantObjectReturn()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(ObjectReturnCreateCoreBase));
            var json = serialization.BuildJsonModelCreateCoreMethod();
            var persistable = serialization.BuildPersistableModelCreateCoreMethod();
            Assert.Multiple(() =>
            {
                Assert.That(json.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
                Assert.That(persistable.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
            });
        }

        [Test]
        public void GenericBaseWithGeneratedArgumentOverridesSelfReturningCreateSlots()
        {
            var payload = new CSharpType("Payload", "Samples.Models", false, false, null, [], true, false);
            var mappedType = new CSharpType(typeof(GenericCreateCoreBase<>), [payload]);
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(mappedType: mappedType);
            foreach (var method in new[] { serialization.BuildJsonModelCreateCoreMethod(), serialization.BuildPersistableModelCreateCoreMethod() })
            {
                Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True, method.Signature.Name);
                Assert.That(method.Signature.ReturnType!.Arguments.Single(), Is.SameAs(payload));
            }
        }

        [Test]
        public void GenericBaseWithGeneratedArgumentOverridesIndependentWriteSlot()
        {
            var payload = new CSharpType("Payload", "Samples.Models", false, false, null, [], true, false);
            var mappedType = new CSharpType(typeof(GenericIndependentWriterBase<>), [payload]);
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(mappedType: mappedType);
            var method = serialization.BuildJsonModelWriteCoreMethod();
            Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
            Assert.That(new TypeProviderWriter(serialization).Write().Content, Does.Contain("base.JsonModelWriteCore("));
        }

        [Test]
        public void ConstructedGenericFrameworkWriterOverridesSubstitutedSlot()
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(typeof(GenericWriteCoreMrwBase<Utf8JsonWriter>));
            var method = serialization.BuildJsonModelWriteCoreMethod();
            var source = new TypeProviderWriter(serialization).Write().Content;
            Assert.Multiple(() =>
            {
                Assert.That(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
                Assert.That(source, Does.Contain("base.JsonModelWriteCore("));
                Assert.That(source, Does.Contain("GenericWriteCoreMrwBase<global::System.Text.Json.Utf8JsonWriter>"));
            });
        }

        [TestCase(typeof(LegacyMrwBase))]
        [TestCase(typeof(FakeMrwBase))]
        [TestCase(typeof(PartialCoreMrwBase))]
        [TestCase(typeof(PublicWriteCoreMrwBase))]
        [TestCase(typeof(NonvirtualWriteCoreMrwBase))]
        [TestCase(typeof(OverloadedCoreMrwBase))]
        [TestCase(typeof(ProtectedInternalCoreMrwBase))]
        [TestCase(typeof(PrivateProtectedCoreMrwBase))]
        [TestCase(typeof(SealedCoreMrwBase))]
        [TestCase(typeof(WrongSignatureCoreMrwBase))]
        [TestCase(typeof(IncompatibleReturnCoreMrwBase))]
        [TestCase(typeof(OutReaderCoreMrwBase))]
        [TestCase(typeof(PrivateHidingCoreMrwBase))]
        [TestCase(typeof(PrivateProtectedHidingCoreMrwBase))]
        [TestCase(typeof(StaticWriteCoreMrwBase))]
        [TestCase(typeof(AbstractWriteCoreMrwBase))]
        [TestCase(typeof(GenericWriteCoreMrwBase<Utf8JsonWriter>))]
        [TestCase(typeof(ObjectReturnCreateCoreBase))]
        public void LegacyMrwBaseCoreMethodsCompileAcrossAssemblies(Type frameworkType)
        {
            var (_, serialization) = CreateDerivedModelWithMrwSystemBase(frameworkType);
            var emitted = CSharpSyntaxTree.ParseText(new TypeProviderWriter(serialization).Write().Content);
            var signatures = emitted.GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>()
                .Where(method => method.Identifier.Text is "JsonModelWriteCore" or "JsonModelCreateCore"
                    or "PersistableModelWriteCore" or "PersistableModelCreateCore")
                .Select(method =>
                {
                    var baseCall = method.Identifier.Text == "JsonModelWriteCore"
                        ? method.Body?.Statements.FirstOrDefault(statement => statement.ToString().Contains("base.JsonModelWriteCore("))
                        : null;
                    return method.WithBody(SyntaxFactory.Block(baseCall ?? SyntaxFactory.ParseStatement("throw new System.NotImplementedException();"))).ToFullString();
                });
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(System.IO.Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Append(typeof(LegacyMrwBase).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path));
            var emittedBase = emitted.GetRoot().DescendantNodes().OfType<ClassDeclarationSyntax>().Single().BaseList!.Types[0].Type;
            var source = $"namespace Samples.Models {{ public class LegacyDerived : {emittedBase} {{ {string.Join("\n", signatures)} }} }}";
            var compilation = CSharpCompilation.Create("LegacySystemBaseConsumer", [CSharpSyntaxTree.ParseText(source)], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary).WithGeneralDiagnosticOption(ReportDiagnostic.Error));
            Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        private class DelayedBaseModelProvider(InputModelType inputModel) : ModelProvider(inputModel)
        {
            public ModelProvider? BaseModel { get; set; }

            protected override ModelProvider? BuildBaseModelProvider() => BaseModel;

            protected override CSharpType? BuildBaseType() => BaseModel?.Type;
        }
    }

    /// <summary> An external model with all overridable MRW core methods. </summary>
    public class FakeMrwBase : IJsonModel<FakeMrwBase>
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        /// <summary> Creates the base model from JSON. </summary>
        protected virtual FakeMrwBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        /// <summary> Persists the base model. </summary>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => BinaryData.FromString(string.Empty);
        /// <summary> Creates the base model from persisted data. </summary>
        protected virtual FakeMrwBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => this;
        void IJsonModel<FakeMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => JsonModelWriteCore(writer, options);
        FakeMrwBase IJsonModel<FakeMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => JsonModelCreateCore(ref reader, options);
        BinaryData IPersistableModel<FakeMrwBase>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        FakeMrwBase IPersistableModel<FakeMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options) => PersistableModelCreateCore(data, options);
        string IPersistableModel<FakeMrwBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    /// <summary> An external MRW base that exposes only its JSON write-core method. </summary>
    public class LegacyMrwBase : IJsonModel<LegacyMrwBase>
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }

        void IJsonModel<LegacyMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => JsonModelWriteCore(writer, options);
        LegacyMrwBase IJsonModel<LegacyMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        BinaryData IPersistableModel<LegacyMrwBase>.Write(ModelReaderWriterOptions options) => BinaryData.FromString(string.Empty);
        LegacyMrwBase IPersistableModel<LegacyMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options) => this;
        string IPersistableModel<LegacyMrwBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    /// <summary> An external MRW base that implements only explicit interfaces. </summary>
    public class InterfaceOnlyMrwBase : IJsonModel<InterfaceOnlyMrwBase>
    {
        void IJsonModel<InterfaceOnlyMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        InterfaceOnlyMrwBase IJsonModel<InterfaceOnlyMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        BinaryData IPersistableModel<InterfaceOnlyMrwBase>.Write(ModelReaderWriterOptions options) => BinaryData.FromString(string.Empty);
        InterfaceOnlyMrwBase IPersistableModel<InterfaceOnlyMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options) => this;
        string IPersistableModel<InterfaceOnlyMrwBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    /// <summary> An external MRW base with only a subset of the generated core methods. </summary>
    public class PartialCoreMrwBase : IJsonModel<PartialCoreMrwBase>
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        /// <summary> Persists the base model. </summary>
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => BinaryData.FromString(string.Empty);
        void IJsonModel<PartialCoreMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => JsonModelWriteCore(writer, options);
        PartialCoreMrwBase IJsonModel<PartialCoreMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        BinaryData IPersistableModel<PartialCoreMrwBase>.Write(ModelReaderWriterOptions options) => PersistableModelWriteCore(options);
        PartialCoreMrwBase IPersistableModel<PartialCoreMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options) => this;
        string IPersistableModel<PartialCoreMrwBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    /// <summary> An external model with a public virtual write core. </summary>
    public class PublicWriteCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        public virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model with a nonvirtual write core. </summary>
    public class NonvirtualWriteCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        protected void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model with generic and nongeneric methods sharing parameter types. </summary>
    public class OverloadedCoreMrwBase : PartialCoreMrwBase
    {
        /// <summary> A generic overload that is not the MRW core slot. </summary>
        protected virtual T PersistableModelWriteCore<T>(ModelReaderWriterOptions options) => default!;
    }

    /// <summary> An external model with a protected internal virtual write core. </summary>
    public class ProtectedInternalCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        protected internal virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model whose write core is not accessible in another assembly. </summary>
    public class PrivateProtectedCoreMrwBase : InterfaceOnlyMrwBase
    {
        private protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model with a sealed core override. </summary>
    public class SealedCoreMrwBase : PartialCoreMrwBase
    {
        /// <inheritdoc/>
        protected sealed override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model with an unrelated overload. </summary>
    public class WrongSignatureCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> An unrelated overload. </summary>
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, int unrelated) { }
    }

    /// <summary> An external model with a core signature whose return is incompatible. </summary>
    public class IncompatibleReturnCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> A core-shaped method with a non-model return. </summary>
        protected virtual string PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => string.Empty;
    }

    /// <summary> An external model with an out parameter where the generated core uses ref. </summary>
    public class OutReaderCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> Creates the model using a distinct parameter modifier. </summary>
        protected virtual OutReaderCoreMrwBase JsonModelCreateCore(out Utf8JsonReader reader, ModelReaderWriterOptions options)
        {
            reader = default;
            return this;
        }
    }

    /// <summary> An external model with a private overload hiding an inherited virtual core. </summary>
    public class PrivateHidingCoreMrwBase : PartialCoreMrwBase
    {
        private new void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model with an inaccessible hidden core. </summary>
    public class PrivateProtectedHidingCoreMrwBase : PartialCoreMrwBase
    {
        private protected new void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    /// <summary> An external model with a static method using the core signature. </summary>
    public class OpaquePayloadWriterBase : IJsonModel<OpaquePayloadWriterBase>
    {
        public string? Name { get; }
        protected OpaquePayloadWriterBase() { }
        protected OpaquePayloadWriterBase(string name) => Name = name;

        void IJsonModel<OpaquePayloadWriterBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            writer.WriteString("name", Name);
            writer.WriteEndObject();
        }

        OpaquePayloadWriterBase IJsonModel<OpaquePayloadWriterBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        BinaryData IPersistableModel<OpaquePayloadWriterBase>.Write(ModelReaderWriterOptions options) => BinaryData.FromString("{}");
        OpaquePayloadWriterBase IPersistableModel<OpaquePayloadWriterBase>.Create(BinaryData data, ModelReaderWriterOptions options) => this;
        string IPersistableModel<OpaquePayloadWriterBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    public class OpaqueWriterWithUnrelatedNonvirtualHelper : OpaquePayloadWriterBase
    {
        protected void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => throw new InvalidOperationException("This helper is not the base serializer.");
    }

    public class OpaqueFieldWriterBase : InterfaceOnlyMrwBase, IJsonModel<InterfaceOnlyMrwBase>
    {
        public readonly string Name = "field";

        void IJsonModel<InterfaceOnlyMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            writer.WriteString("name", Name);
            writer.WriteEndObject();
        }
    }

    public class OpaquePrivateStorageWriterBase : InterfaceOnlyMrwBase, IJsonModel<InterfaceOnlyMrwBase>
    {
        private readonly string _storedName = "private";

        void IJsonModel<InterfaceOnlyMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            writer.WriteString("name", _storedName);
            writer.WriteEndObject();
        }
    }

    public abstract class AbstractOpaqueWriterBase : OpaquePayloadWriterBase
    {
        protected abstract void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options);
    }

    public class AlternateReturnCreateCoreBase : IJsonModel<AlternateReturnCreateCoreBase>
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        protected virtual AlternateReturnStatus JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => new();
        protected virtual AlternateReturnStatus PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => new();
        void IJsonModel<AlternateReturnCreateCoreBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => JsonModelWriteCore(writer, options);
        AlternateReturnCreateCoreBase IJsonModel<AlternateReturnCreateCoreBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => JsonModelCreateCore(ref reader, options);
        BinaryData IPersistableModel<AlternateReturnCreateCoreBase>.Write(ModelReaderWriterOptions options) => BinaryData.FromString("{}");
        AlternateReturnCreateCoreBase IPersistableModel<AlternateReturnCreateCoreBase>.Create(BinaryData data, ModelReaderWriterOptions options)
            => PersistableModelCreateCore(data, options);
        string IPersistableModel<AlternateReturnCreateCoreBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    public sealed class AlternateReturnStatus : AlternateReturnCreateCoreBase { }

    public abstract class AbstractAlternateReturnCreateCoreBase : AlternateReturnCreateCoreBase
    {
        protected abstract override AlternateReturnStatus JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options);
        protected abstract override AlternateReturnStatus PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options);
    }

    public interface IAlternateStatus { }

    public class InterfaceReturnCreateCoreBase : InterfaceOnlyMrwBase, IJsonModel<InterfaceOnlyMrwBase>
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        protected virtual IAlternateStatus JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => new AlternateStatus();
        protected virtual IAlternateStatus PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => new AlternateStatus();
        InterfaceOnlyMrwBase IJsonModel<InterfaceOnlyMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => (InterfaceOnlyMrwBase)JsonModelCreateCore(ref reader, options);
        InterfaceOnlyMrwBase IPersistableModel<InterfaceOnlyMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options)
            => (InterfaceOnlyMrwBase)PersistableModelCreateCore(data, options);
        private sealed class AlternateStatus : InterfaceReturnCreateCoreBase, IAlternateStatus { }
    }

    public class ObjectReturnCreateCoreBase : IJsonModel<ObjectReturnCreateCoreBase>
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        protected virtual object JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        protected virtual object PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => this;
        void IJsonModel<ObjectReturnCreateCoreBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => JsonModelWriteCore(writer, options);
        ObjectReturnCreateCoreBase IJsonModel<ObjectReturnCreateCoreBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => (ObjectReturnCreateCoreBase)JsonModelCreateCore(ref reader, options);
        BinaryData IPersistableModel<ObjectReturnCreateCoreBase>.Write(ModelReaderWriterOptions options) => BinaryData.FromString("{}");
        ObjectReturnCreateCoreBase IPersistableModel<ObjectReturnCreateCoreBase>.Create(BinaryData data, ModelReaderWriterOptions options)
            => (ObjectReturnCreateCoreBase)PersistableModelCreateCore(data, options);
        string IPersistableModel<ObjectReturnCreateCoreBase>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    public class PublicVirtualNonMrwWriteHelperBase
    {
        public virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => writer.WriteString("name", "unrelated");
        public virtual PublicVirtualNonMrwWriteHelperBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        public virtual PublicVirtualNonMrwWriteHelperBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => this;
        public virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => BinaryData.FromString("helper");
    }

    public class ProtectedVirtualNonMrwHelperBase
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => writer.WriteString("name", "unrelated");
        protected virtual ProtectedVirtualNonMrwHelperBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        protected virtual ProtectedVirtualNonMrwHelperBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => this;
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options) => BinaryData.FromString("helper");
    }

    public class NonMrwWriteHelperBase
    {
        protected void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => writer.WriteString("name", "unrelated");
    }

    public class GenericCreateCoreBase<T> : IJsonModel<GenericCreateCoreBase<T>>
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        protected virtual GenericCreateCoreBase<T> JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        protected virtual GenericCreateCoreBase<T> PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options) => this;
        void IJsonModel<GenericCreateCoreBase<T>>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) => JsonModelWriteCore(writer, options);
        GenericCreateCoreBase<T> IJsonModel<GenericCreateCoreBase<T>>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => JsonModelCreateCore(ref reader, options);
        BinaryData IPersistableModel<GenericCreateCoreBase<T>>.Write(ModelReaderWriterOptions options) => BinaryData.FromString("{}");
        GenericCreateCoreBase<T> IPersistableModel<GenericCreateCoreBase<T>>.Create(BinaryData data, ModelReaderWriterOptions options)
            => PersistableModelCreateCore(data, options);
        string IPersistableModel<GenericCreateCoreBase<T>>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    public class GenericIndependentWriterBase<T> : InterfaceOnlyMrwBase
    {
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    public class GenericWriteCoreMrwBase<T> : InterfaceOnlyMrwBase
    {
        protected virtual void JsonModelWriteCore(T writer, ModelReaderWriterOptions options) { }
    }

    public abstract class AbstractWriteCoreMrwBase : InterfaceOnlyMrwBase
    {
        protected abstract void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options);
    }

    public class StaticWriteCoreMrwBase : InterfaceOnlyMrwBase
    {
        /// <summary> Writes the base model's JSON properties. </summary>
        public static void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
    }

    public class CreateCoreFrameworkRoot { }

    // The mapped type inherits (rather than declares) the create-core signatures from its root.
    public class InheritedCreateCoreRoot : IJsonModel<InheritedCreateCoreRoot>
    {
        protected virtual InheritedCreateCoreRoot PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => this;

        protected virtual InheritedCreateCoreRoot JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => this;

        void IJsonModel<InheritedCreateCoreRoot>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options) { }
        InheritedCreateCoreRoot IJsonModel<InheritedCreateCoreRoot>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options) => this;
        BinaryData IPersistableModel<InheritedCreateCoreRoot>.Write(ModelReaderWriterOptions options) => BinaryData.FromString(string.Empty);
        InheritedCreateCoreRoot IPersistableModel<InheritedCreateCoreRoot>.Create(BinaryData data, ModelReaderWriterOptions options) => this;
        string IPersistableModel<InheritedCreateCoreRoot>.GetFormatFromOptions(ModelReaderWriterOptions options) => "J";
    }

    public class InheritedCreateCoreMapped : InheritedCreateCoreRoot { }

    public class InheritedCreateCoreMiddle : InheritedCreateCoreRoot
    {
        protected override InheritedCreateCoreMiddle PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => this;

        protected override InheritedCreateCoreMiddle JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => this;
    }

    public class InheritedCreateCoreLeaf : InheritedCreateCoreMiddle { }
}
