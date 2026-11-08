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
    public class MultipartMappedBaseRestorationRegressionTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void MultipartOnlyModelHasCompilableSerializationConstructor(bool restoreBase)
            => AssertSerializationConstructorsCompile(restoreBase);

        private static void AssertSerializationConstructorsCompile(bool restoreBase)
        {
            var mappedInput = InputFactory.Model("KnownMappedBase", properties:
                [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            var currentBase = InputFactory.Model("CurrentBase", properties:
                [InputFactory.Property("code", InputPrimitiveType.Int32, isRequired: true)]);
            var derivedInput = InputFactory.Model("Derived", properties: [], baseModel: currentBase,
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData);
            var mapped = new SystemObjectModelProvider(typeof(ParameterizedCreateCoreFrameworkRoot), mappedInput);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => [mappedInput, currentBase, derivedInput],
                createModelCore: model => model == mappedInput ? mapped : new ClientModelProvider(model));
            generator.Object.TypeFactory.RootInputModels.Add(derivedInput);
            var references = GetCompilationReferences();
            var historicalCompilation = CSharpCompilation.Create("LastContract", [CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    public class Derived : Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions.ParameterizedCreateCoreFrameworkRoot
                    {
                        public Derived(int code) : base(code) { }
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
                if (provider is MrwSerializationTypeDefinition or MultipartFormDataSerializationDefinition)
                {
                    updated = updated.WithBaseList(null);
                }
                return CSharpSyntaxTree.Create((CSharpSyntaxNode)root.ReplaceNode(declaration, updated));
            }

            var serialization = model.SerializationProviders.OfType<MultipartFormDataSerializationDefinition>().Single();
            TestContext.WriteLine($"Selected base: {model.BaseModelProvider!.Type}");
            var currentBaseProvider = generator.Object.TypeFactory.CreateModel(currentBase)!;
            var generatedCompilation = CSharpCompilation.Create("GeneratedConstructors",
                [ConstructorSurface(model), ConstructorSurface(serialization), ConstructorSurface(currentBaseProvider),
                    ConstructorSurface(currentBaseProvider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single())],
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(generatedCompilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty,
                "Restoration must not introduce an implicit base() call that cannot be made in the multipart serialization partial.");
        }

        private static MetadataReference[] GetCompilationReferences()
            => ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(System.IO.Path.PathSeparator)
                .Concat([typeof(Utf8JsonReader).Assembly.Location, typeof(ModelReaderWriterOptions).Assembly.Location,
                    typeof(BinaryData).Assembly.Location, typeof(CreateCoreFrameworkRoot).Assembly.Location])
                .Distinct()
                .Select(path => (MetadataReference)MetadataReference.CreateFromFile(path))
                .ToArray();
    }
}
