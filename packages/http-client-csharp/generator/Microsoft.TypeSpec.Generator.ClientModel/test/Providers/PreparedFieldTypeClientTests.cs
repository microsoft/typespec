// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    [NonParallelizable]
    internal class PreparedFieldTypeClientTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public void RealClientRestPartParticipatesInPreparedFieldLookup(bool restShadow)
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-prepared-client-pair-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                File.Copy(Path.Combine(AppContext.BaseDirectory, "TestData", "PreparedFieldTypes", "ClientStructureDefault.json"),
                    Path.Combine(directory, "tspCodeModel.json"));
                var configuration = Configuration.Load(directory, "{\"enable-pre-emission-simplification\":true,\"package-name\":\"Client.Structure.Service.Default\"}");
                var generator = new ScmCodeModelGenerator(new GeneratorContext(configuration));
                CodeModelGenerator.Instance = generator;
                ((CodeModelGenerator)generator).Configure();
                var compilation = CSharpCompilation.Create("KnownClientInputs", references: [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
                generator.SourceInputModel = new SourceInputModel(compilation, null);
                var output = generator.OutputLibrary;
                foreach (var provider in output.TypeProviders)
                {
                    provider.EnsureBuilt();
                }
                foreach (var visitor in generator.Visitors)
                {
                    visitor.VisitLibrary(output);
                }
                foreach (var provider in output.TypeProviders)
                {
                    provider.ProcessTypeForBackCompatibility();
                }
                var owner = output.TypeProviders.OfType<Microsoft.TypeSpec.Generator.ClientModel.Providers.ClientProvider>().Single(provider => provider.Name == "Foo");
                var field = owner.Fields.Single(candidate => candidate.Name == "_client");
                var canonical = field.Type;
                if (restShadow)
                {
                    owner.RestClient.Update(nestedTypes: [new ClientTypeShadow(owner.RestClient)]);
                }
                using var referenceMap = ProviderReferenceMapAnalyzer.PrepareForGeneration(output.TypeProviders);
                // Exercise the rewritten rule against the supplied generator
                // input environment; actual-consumer admission is reviewed later.
                using var prepared = PreparedFieldTypes.Create(output.TypeProviders, compilation, referenceMap.ShouldWriteProvider, directory);
                Assert.That(prepared.CanWriteSimpleName(owner, field), Is.EqualTo(!restShadow));
                var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                Assert.That(file.Content, Does.Contain(restShadow
                    ? "private readonly global::Client.Structure.Service.ClientType _client;"
                    : "private readonly ClientType _client;"));
                Assert.That(ReferenceEquals(field.Type, canonical), Is.True);
                // Raw occurrence witness, not a claim that unrelated client
                // bodies were compiled. Core tests compile both related parts.
            }
            finally
            {
                ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
                Directory.Delete(directory, recursive: true);
            }
        }

        private sealed class ClientTypeShadow(TypeProvider owner) : TypeProvider
        {
            protected override string BuildName() => "ClientType";
            protected override string BuildNamespace() => owner.Type.Namespace;
            protected override string BuildRelativeFilePath() => "NestedClientType.cs";
            protected override TypeProvider? BuildDeclaringTypeProvider() => owner;
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Private | TypeSignatureModifiers.Class;
        }

        // This emitter-produced input exercises the raw writer only. Its narrowed
        // enum literal also exposes an unrelated invalid Derived constructor, so
        // it must not be used as evidence of a successful consuming build.
        [Test]
        public void EmittedMultipartModelPreparesRawFieldBeforeRoslyn()
        {
            var directory = Path.Combine(Path.GetTempPath(), "typespec-multipart-probe-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(directory);
            try
            {
                var input = Path.Combine(AppContext.BaseDirectory, "TestData", "PreparedFieldTypes", "tspCodeModel.json");
                File.Copy(input, Path.Combine(directory, "tspCodeModel.json"));
                var configuration = Configuration.Load(directory, "{\"enable-pre-emission-simplification\":true,\"package-name\":\"OwnedPilot\",\"unreferenced-types-handling\":\"keepAll\"}");
                var generator = new ScmCodeModelGenerator(new GeneratorContext(configuration));
                CodeModelGenerator.Instance = generator;
                ((CodeModelGenerator)generator).Configure();
                var compilation = CSharpCompilation.Create("ControlledCustomization", references: [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
                generator.SourceInputModel = new SourceInputModel(compilation, null)
                {
                    // Test-only controlled input, not a production ownership certificate.
                    PreEmissionSourceInputs = new CompleteSourceInputSnapshot(directory, "controlled-pilot", compilation, ["Debug|net10.0"], () => true)
                };
                var output = generator.OutputLibrary;
                foreach (var provider in output.TypeProviders) { provider.EnsureBuilt(); }
                foreach (var visitor in generator.Visitors) { visitor.VisitLibrary(output); }
                foreach (var provider in output.TypeProviders) { provider.ProcessTypeForBackCompatibility(); }
                using var referenceMap = ProviderReferenceMapAnalyzer.PrepareForGeneration(output.TypeProviders);
                using var prepared = PreparedFieldTypes.CreateForGeneration(generator, output.TypeProviders, referenceMap.ShouldWriteProvider);
                var owner = output.TypeProviders.Single(provider => provider.Name == "Base");
                var field = owner.Fields.Single(f => f.Name == "_value");
                TestContext.WriteLine($"Base simple={owner.HasSimpleFieldTypeScope}, field={field.Type.Namespace}.{field.Type.Name}, nullable={field.Type.IsNullable}, serialization={owner.SerializationProviders.Count}");
                Assert.That(prepared, Is.Not.Null, "Real multipart field preparation must be eligible.");
                Assert.That(prepared!.CanWriteSimpleName(owner, field), Is.True);
                var file = new TypeProviderWriter(owner) { PreparedFieldTypes = prepared }.Write();
                Assert.That(file.Content, Does.Contain("private protected Kind _value;"));
                Assert.That(file.QualifiedContent, Does.Contain("private protected global::OwnedPilot.Kind _value;"));
                Assert.That(prepared.CanCommit(), Is.True);
            }
            finally
            {
                ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
                Directory.Delete(directory, recursive: true);
            }
        }
    }
}
