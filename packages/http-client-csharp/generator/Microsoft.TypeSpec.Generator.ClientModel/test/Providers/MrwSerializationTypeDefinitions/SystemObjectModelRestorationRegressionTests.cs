// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using ClientModelProvider = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class SystemObjectModelRestorationRegressionTests
    {
        [Test]
        public void RestoredParameterizedMappedBaseHasCompilableSerializationConstructor()
            => AssertSerializationConstructorsCompile(restoreBase: true);

        [Test]
        public void CurrentBaseHasCompilableSerializationConstructorWithoutRestoration()
            => AssertSerializationConstructorsCompile(restoreBase: false);

        [Test]
        public void RestoredParameterizedMappedBaseHasCompilableXmlSerializationConstructor()
            => AssertSerializationConstructorsCompile(restoreBase: true, serializationUsage: InputModelTypeUsage.Xml);

        private static void AssertSerializationConstructorsCompile(bool restoreBase,
            InputModelTypeUsage serializationUsage = InputModelTypeUsage.Json)
        {
            var mappedInput = InputFactory.Model("KnownMappedBase", properties:
                [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            var currentBase = InputFactory.Model("CurrentBase", properties:
                [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            var derivedInput = InputFactory.Model("Derived", properties: [], baseModel: currentBase,
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | serializationUsage);
            var mapped = new SystemObjectModelProvider(typeof(ParameterizedCreateCoreFrameworkRoot), mappedInput);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [mappedInput, currentBase, derivedInput],
                createModelCore: model => model == mappedInput ? mapped : new ClientModelProvider(model));
            generator.Object.TypeFactory.RootInputModels.Add(derivedInput);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInput);
            var references = GetCompilationReferences();
            var historicalCompilation = CSharpCompilation.Create("LastContract", [CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    public class Derived : Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions.ParameterizedCreateCoreFrameworkRoot
                    {
                        public Derived(int code) : base(code) { }
                        internal Derived() : base(default) { }
                    }
                }
                """)], references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(historicalCompilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            if (restoreBase)
            {
                generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, historicalCompilation));
            }
            var model = (ModelProvider)generator.Object.TypeFactory.CreateModel(derivedInput)!;

            // Keep actual constructor bodies and initializers from both generated partials.
            // Other serialization members are irrelevant to constructor-call accessibility.
            static SyntaxTree ConstructorSurface(TypeProvider provider)
            {
                var root = CSharpSyntaxTree.ParseText(new TypeProviderWriter(provider).Write().Content).GetRoot();
                var declaration = root.DescendantNodes().OfType<ClassDeclarationSyntax>().Single();
                var members = declaration.Members.Where(member => member is ConstructorDeclarationSyntax or
                    FieldDeclarationSyntax or PropertyDeclarationSyntax);
                var updated = declaration.WithMembers(SyntaxFactory.List(members));
                if (provider is MrwSerializationTypeDefinition)
                {
                    updated = updated.WithBaseList(null);
                }
                return CSharpSyntaxTree.Create((CSharpSyntaxNode)root.ReplaceNode(declaration, updated));
            }

            var serialization = model.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            TestContext.WriteLine($"Selected base: {model.BaseModelProvider!.Type}");
            var currentBaseProvider = generator.Object.TypeFactory.CreateModel(currentBase)!;
            var generatedCompilation = CSharpCompilation.Create("GeneratedConstructors",
                [ConstructorSurface(model), ConstructorSurface(serialization), ConstructorSurface(currentBaseProvider),
                    ConstructorSurface(currentBaseProvider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single())],
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(generatedCompilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty,
                "Restoration must not introduce an implicit base() call that cannot be made in the serialization partial.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ParameterizedMappedBaseRemainsSupportedWithoutMrw(bool useCoreProvider)
        {
            var mappedInput = InputFactory.Model("KnownMappedBase", properties:
                [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            var currentBase = InputFactory.Model("CurrentBase", properties:
                [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            var derivedInput = InputFactory.Model("Derived", properties: [], baseModel: currentBase,
                usage: useCoreProvider ? InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json
                    : InputModelTypeUsage.Input | InputModelTypeUsage.Output);
            var mapped = new SystemObjectModelProvider(typeof(ParameterizedCreateCoreFrameworkRoot), mappedInput);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [mappedInput, currentBase, derivedInput],
                createModelCore: model => model == mappedInput ? mapped
                    : useCoreProvider ? new ModelProvider(model) : new ClientModelProvider(model),
                createSerializationsCore: useCoreProvider ? (_, _) => [] : null);
            generator.Object.TypeFactory.RootInputModels.Add(derivedInput);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInput);
            var compilation = CSharpCompilation.Create("LastContract", [CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    public class Derived : Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions.ParameterizedCreateCoreFrameworkRoot
                    {
                        public Derived(int code) : base(code) { }
                    }
                }
                """)], GetCompilationReferences(), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, compilation));
            var model = generator.Object.TypeFactory.CreateModel(derivedInput)!;
            Assert.That(model.BaseModelProvider, Is.TypeOf<SystemObjectModelProvider>(),
                "Do not require a parameterless framework constructor when this provider does not emit an MRW partial.");
            Assert.That(model.SerializationProviders, Is.Empty);
        }

        [Test]
        public void RestoredMappedBasePreservesUntouchedRoslynJsonCreateCoreReturn()
        {
            var mappedInput = InputFactory.Model("KnownMappedBase", properties: []);
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derivedInput = InputFactory.Model("Derived", properties: [], baseModel: currentBase);
            var mapped = new SystemObjectModelProvider(typeof(CreateCoreFrameworkRoot), mappedInput);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [mappedInput, currentBase, derivedInput],
                createModelCore: model => model == mappedInput ? mapped : new ClientModelProvider(model));
            generator.Object.TypeFactory.RootInputModels.Add(derivedInput);
            generator.Object.TypeFactory.RootOutputModels.Add(derivedInput);
            var references = GetCompilationReferences();
            var historicalCompilation = CSharpCompilation.Create("LastContract", [CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    public class Derived : Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions.CreateCoreFrameworkRoot
                    {
                        public Derived() { }
                        protected virtual Derived JsonModelCreateCore(ref System.Text.Json.Utf8JsonReader reader,
                            System.ClientModel.Primitives.ModelReaderWriterOptions options) => this;
                    }
                }
                """)], references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(historicalCompilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, historicalCompilation));
            var model = (ModelProvider)generator.Object.TypeFactory.CreateModel(derivedInput)!;
            Assert.That(model.BaseModelProvider, Is.TypeOf<SystemObjectModelProvider>(), "Exercise successful base restoration.");
            var historicalMethod = model.LastContractView!.Methods.Single();
            // Deliberately do not replace the reader parameter with a reflection-backed CSharpType.
            var serialization = model.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var generatedMethod = serialization.BuildJsonModelCreateCoreMethod()!;
            var consumer = CSharpSyntaxTree.ParseText("""
                public class Consumer : Sample.Models.Derived
                {
                    public Sample.Models.Derived Read(ref System.Text.Json.Utf8JsonReader reader,
                        System.ClientModel.Primitives.ModelReaderWriterOptions options)
                        => base.JsonModelCreateCore(ref reader, options);
                }
                """);
            Assert.That(historicalCompilation.AddSyntaxTrees(consumer).GetDiagnostics()
                .Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty,
                "The unchanged consumer must compile against the historical contract.");
            var generatedDeclaration = CSharpSyntaxTree.ParseText(new TypeProviderWriter(serialization).Write().Content)
                .GetRoot().DescendantNodes().OfType<MethodDeclarationSyntax>()
                .Single(method => method.Identifier.ValueText == "JsonModelCreateCore")
                .WithExpressionBody(null).WithSemicolonToken(default)
                .WithBody(SyntaxFactory.Block(SyntaxFactory.ParseStatement("throw new global::System.NotImplementedException();")));
            // Compile the actual emitted signature, isolating it from unrelated serialization method bodies.
            var generatedSource = $"namespace Sample.Models {{ public class Derived : {model.BaseModelProvider!.Type} {{ {generatedDeclaration.NormalizeWhitespace()} }} }}";
            var generatedCompilation = CSharpCompilation.Create("GeneratedCreateCoreReturn",
                [CSharpSyntaxTree.ParseText(generatedSource), consumer], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.Multiple(() =>
            {
                Assert.That(MrwSerializationTypeDefinition.IsCreateCoreMethod(historicalMethod.Signature), Is.True,
                    "The untouched Roslyn signature must match the supported JSON create-core signature.");
                Assert.That(generatedMethod.Signature.ReturnType!.Equals(model.Type), Is.True,
                    "The shipped Derived return must not widen to the restored framework base.");
                Assert.That(generatedCompilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty,
                    "The unchanged consumer must still compile against the emitted create-core signature.");
            });
        }

        private static MetadataReference[] GetCompilationReferences()
            => ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(System.IO.Path.PathSeparator)
                .Concat([typeof(Utf8JsonReader).Assembly.Location, typeof(ModelReaderWriterOptions).Assembly.Location,
                    typeof(BinaryData).Assembly.Location, typeof(CreateCoreFrameworkRoot).Assembly.Location])
                .Distinct()
                .Select(path => (MetadataReference)MetadataReference.CreateFromFile(path))
                .ToArray();
    }

    public class ParameterizedCreateCoreFrameworkRoot
    {
        public ParameterizedCreateCoreFrameworkRoot(int code) => Code = code;
        public int Code { get; set; }
    }
}
