// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Tests.Providers.Framework;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class InheritedFrameworkConstructorTests
    {
        [SetUp]
        public void Setup() => MockHelpers.LoadMockGenerator();

        [TestCase(typeof(TrackedResourceData), "ResourceLocation location", "location", true)]
        [TestCase(typeof(TrackedResourceData), "ResourceLocation location = default", "location", true)]
        [TestCase(typeof(TrackedResourceData), "ResourceLocation? location", "location.GetValueOrDefault()", false)]
        [TestCase(typeof(TrackedResourceData), "ref ResourceLocation location", "location", false)]
        [TestCase(typeof(PrivateSetterFrameworkBase), "ResourceLocation location", "location", false)]
        [TestCase(typeof(InitOnlyFrameworkBase), "ResourceLocation location", "location", false)]
        public async Task InheritedAssignmentMustPreserveTheHistoricalParameterAndAccessibleSetter(
            Type frameworkType, string declaration, string argument, bool canRestore)
        {
            var provider = await CreateModelAsync(frameworkType, declaration, argument);
            Assert.That(provider.Constructors.Single(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)).Signature.Parameters, Is.Empty);
            provider.ProcessTypeForBackCompatibility();
            var restored = provider.Constructors.Where(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) && constructor.Signature.Parameters.Count == 1).ToArray();
            Assert.That(restored.Length, Is.EqualTo(canRestore ? 1 : 0),
                "Do not claim restoration by emitting a by-value/non-nullable substitute or assigning an inaccessible/init-only property.");
            if (canRestore)
            {
                Assert.That(restored[0].Signature.Parameters[0].Type.IsNullable, Is.False);
                Assert.That(restored[0].Signature.Parameters[0].IsRef, Is.False);
                Assert.That(restored[0].Signature.Parameters[0].DefaultValue is not null, Is.EqualTo(declaration.Contains('=')));
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task RetainedParametersPreserveDefaultsAndRejectNullableNarrowing(bool nullableCount)
        {
            var declaration = nullableCount ? "ResourceLocation location, int? count" : "ResourceLocation location = default, int count = 7";
            var provider = await CreateModelAsync(typeof(TrackedResourceData), declaration, "location", includeCount: true);
            Assert.That(provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                .Signature.Parameters.Select(parameter => parameter.Name), Is.EqualTo(new[] { "count" }));
            provider.ProcessTypeForBackCompatibility();
            var restored = provider.Constructors.Where(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 2).ToArray();
            Assert.That(restored.Length, Is.EqualTo(nullableCount ? 0 : 1));
            if (!nullableCount)
            {
                Assert.That(restored[0].Signature.Parameters.All(parameter => parameter.DefaultValue is not null), Is.True);
                var compilation = CreateCompilation(new TypeProviderWriter(provider).Write().Content);
                Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty,
                    "A restored optional location cannot precede a retained count whose historical default was dropped.");
            }
        }

        private static async Task<ModelProvider> CreateModelAsync(Type frameworkType, string declaration, string argument, bool includeCount = false)
        {
            var countAssignment = includeCount ? "Count = " + (declaration.Contains("int?") ? "count.GetValueOrDefault()" : "count") + ";" : "";
            var source = $$"""
                using Microsoft.TypeSpec.Generator.Tests.Providers.Framework;
                namespace Sample.Models
                {
                    public class BotData : global::{{frameworkType.FullName}}
                    {
                        public BotData({{declaration}}) : base({{argument}}) { {{countAssignment}} }
                        {{(includeCount ? "public int Count { get; set; }" : "")}}
                    }
                }
                """;
            var baseline = CreateCompilation(source);
            Assert.That(baseline.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            var locationType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "azureLocation", "Azure.Core.azureLocation");
            var location = InputFactory.Property("location", locationType);
            var input = InputFactory.Model("BotData", properties: [location,
                .. includeCount ? new[] { InputFactory.Property("count", InputPrimitiveType.Int32, isRequired: true) } : []]);
            var mappedInput = InputFactory.Model("MappedBase", properties: []);
            var previousBase = new NamedTypeSymbolProvider(baseline.GetTypeByMetadataName(frameworkType.FullName!)!, baseline);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [input],
                lastContractCompilation: () => Task.FromResult<Compilation>(baseline),
                createModelCore: model => new RestoredModel(model,
                    new SystemObjectModelProvider(new CSharpType(frameworkType), mappedInput, previousBase, [location])));
            Mock.Get(CodeModelGenerator.Instance.TypeFactory)
                .Setup(factory => factory.CreateFrameworkType(typeof(ResourceLocation).FullName!))
                .Returns(typeof(ResourceLocation));
            Mock.Get(CodeModelGenerator.Instance.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateCSharpTypeCore", ItExpr.Is<InputType>(type => ReferenceEquals(type, locationType)))
                .Returns(new CSharpType(typeof(ResourceLocation)));
            return CodeModelGenerator.Instance.TypeFactory.CreateModel(input)!;
        }

        private static CSharpCompilation CreateCompilation(string source)
        {
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(TrackedResourceData).Assembly.Location).Distinct(StringComparer.Ordinal)
                .Select(path => MetadataReference.CreateFromFile(path));
            return CSharpCompilation.Create($"HistoricalConstructor_{Guid.NewGuid():N}", [CSharpSyntaxTree.ParseText(source)], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        }

        private sealed class RestoredModel(InputModelType input, ModelProvider mappedBase) : ModelProvider(input)
        {
            protected override CSharpType? BuildBaseType() => mappedBase.Type;
            protected override ModelProvider? BuildBaseModelProvider() => mappedBase;
            protected internal override PropertyProvider[] BuildProperties()
                => base.BuildProperties().Where(property => property.Name != "Location").ToArray();
            protected override TypeProvider[] BuildSerializationProviders() => [];
        }
    }
}

namespace Microsoft.TypeSpec.Generator.Tests.Providers.Framework
{
    public class PrivateSetterFrameworkBase
    {
        protected PrivateSetterFrameworkBase() { }
        public PrivateSetterFrameworkBase(ResourceLocation location) => Location = location;
        public ResourceLocation Location { get; private set; }
    }

    public class InitOnlyFrameworkBase
    {
        protected InitOnlyFrameworkBase() { }
        public InitOnlyFrameworkBase(ResourceLocation location) => Location = location;
        public ResourceLocation Location { get; init; }
    }
}
