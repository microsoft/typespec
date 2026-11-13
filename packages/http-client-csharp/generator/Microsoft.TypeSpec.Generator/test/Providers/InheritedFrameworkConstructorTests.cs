// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
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
        [TestCase(typeof(AdditionalArgumentFrameworkBase), "ResourceLocation location", "location, 7", false)]
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

        [TestCase(false)]
        [TestCase(true)]
        public async Task InheritedAssignmentEmitsConstructorChaining(bool inheritedBackingField)
        {
            var provider = await CreateModelAsync(typeof(TrackedResourceData),
                "ResourceLocation location = default, int count = 7", "location", includeCount: true);
            if (inheritedBackingField)
            {
                var mappedBase = provider.BaseModelProvider!;
                var location = mappedBase.CanonicalView.Properties.Single(property => property.Name == "Location");
                location.BackingField = new FieldProvider(FieldModifiers.Private, location.Type, "_inheritedLocation", mappedBase);
            }
            provider.ProcessTypeForBackCompatibility();
            var restored = provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 2);
            Assert.That(restored.Signature.Initializer!.IsBase, Is.True);
            Assert.That(restored.Signature.Initializer.Arguments.Select(argument => argument.ToDisplayString()), Is.EqualTo(new[] { "location" }));
            Assert.That(restored.BodyStatements!.ToDisplayString(), Does.Contain("Count = count;")
                .And.Not.Contain("Location = location;").And.Not.Contain("_inheritedLocation"));
            var file = new TypeProviderWriter(provider).Write();
            TestContext.WriteLine(file.Content);
            Assert.That(CreateCompilation(file.Content).GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            Assert.That(file.Content, Is.EqualTo(Helpers.GetExpectedFromFile()));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task CopiedConstructorBodyPreservesWarningSuppressions(bool suppressWarning)
        {
            var provider = await CreateModelAsync(typeof(TrackedResourceData),
                "ResourceLocation location = default, int count = 7", "location", includeCount: true);
            var target = provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            target.Update(bodyStatements: new MethodBodyStatement[] { target.BodyStatements!, Snippet.Static(typeof(DeprecatedHelper)).Invoke("Check").Terminate() },
                suppressions: suppressWarning ? [new SuppressionStatement(null, Snippet.Literal("CS0618"), "Test suppression.")] : []);
            provider.ProcessTypeForBackCompatibility();
            var restored = provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 2);
            Assert.That(restored.Signature.Initializer!.IsBase, Is.True);
            Assert.That(restored.Signature.Initializer.Arguments.Select(argument => argument.ToDisplayString()), Is.EqualTo(new[] { "location" }));
            Assert.That(restored.BodyStatements!.ToDisplayString(), Does.Contain("Count = count;").And.Contain("Check()"));
            var source = new TypeProviderWriter(provider).Write().Content;
            var compilation = CreateCompilation(source).WithOptions(new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,
                specificDiagnosticOptions: ImmutableDictionary<string, ReportDiagnostic>.Empty.Add("CS0618", ReportDiagnostic.Error)));
            var diagnostics = compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error).ToArray();
            if (suppressWarning)
            {
                Assert.That(diagnostics, Is.Empty, string.Join(Environment.NewLine, diagnostics.Select(diagnostic => diagnostic.ToString())));
            }
            else
            {
                var restoredSyntax = compilation.SyntaxTrees.Single().GetRoot().DescendantNodes().OfType<ConstructorDeclarationSyntax>()
                    .Single(constructor => constructor.ParameterList.Parameters.Count == 2);
                Assert.That(diagnostics.Any(diagnostic => diagnostic.Id == "CS0618" &&
                    restoredSyntax.Span.Contains(diagnostic.Location.SourceSpan)), Is.True,
                    "The unsuppressed control must prove the copied body itself requires the warning suppression.");
            }
        }

        [Test]
        public async Task CopiedBodySuppressionDoesNotCoverAddedAssignments()
        {
            var provider = await CreateModelAsync(typeof(TrackedResourceData),
                "ResourceLocation location, int count", "location", includeCount: true, countRequired: false);
            var target = provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            target.Update(bodyStatements: new MethodBodyStatement[] { target.BodyStatements ?? MethodBodyStatement.Empty,
                    Snippet.Static(typeof(DeprecatedHelper)).Invoke("Check").Terminate() },
                suppressions: [new SuppressionStatement(null, Snippet.Literal("CS0618"), "Test suppression.")]);
            provider.Properties.Single(property => property.Name == "Count")
                .Update(attributes: [new AttributeStatement(typeof(ObsoleteAttribute), Snippet.Literal("Regression diagnostic"))]);
            provider.ProcessTypeForBackCompatibility();
            var restored = provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 2);
            Assert.That(restored.Signature.Initializer!.IsBase, Is.True);
            var compilation = CreateCompilation(new TypeProviderWriter(provider).Write().Content).WithOptions(
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,
                    specificDiagnosticOptions: ImmutableDictionary<string, ReportDiagnostic>.Empty.Add("CS0618", ReportDiagnostic.Error)));
            var restoredSyntax = compilation.SyntaxTrees.Single().GetRoot().DescendantNodes().OfType<ConstructorDeclarationSyntax>()
                .Single(constructor => constructor.ParameterList.Parameters.Count == 2);
            var assignment = restoredSyntax.DescendantNodes().OfType<AssignmentExpressionSyntax>()
                .Single(expression => expression.Left.ToString() == "Count");
            var diagnostics = compilation.GetDiagnostics().Where(diagnostic => diagnostic.Id == "CS0618" &&
                restoredSyntax.Span.Contains(diagnostic.Location.SourceSpan)).ToArray();
            Assert.That(diagnostics.Length, Is.EqualTo(1));
            Assert.That(assignment.Span.Contains(diagnostics[0].Location.SourceSpan), Is.True,
                "The warning on a new assignment must not be hidden by the copied target body's suppression.");
        }

        [Test]
        public async Task InheritedArgumentsFollowFrameworkConstructorOrder()
        {
            var provider = await CreateModelAsync(typeof(TwoLocationsFrameworkBase),
                "ResourceLocation secondLocation, ResourceLocation location", "location, secondLocation", includeSecondLocation: true);
            provider.ProcessTypeForBackCompatibility();
            var restored = provider.Constructors.Single(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 2);
            Assert.That(restored.Signature.Parameters.Select(parameter => parameter.Name),
                Is.EqualTo(new[] { "secondLocation", "location" }));
            Assert.That(restored.Signature.Initializer!.IsBase, Is.True);
            Assert.That(restored.Signature.Initializer.Arguments.Select(argument => argument.ToDisplayString()),
                Is.EqualTo(new[] { "location", "secondLocation" }));
            Assert.That(CreateCompilation(new TypeProviderWriter(provider).Write().Content).GetDiagnostics()
                .Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        private static async Task<ModelProvider> CreateModelAsync(Type frameworkType, string declaration, string argument,
            bool includeCount = false, bool includeSecondLocation = false, bool countRequired = true)
        {
            var countAssignment = includeCount ? "Count = " + (declaration.Contains("int?") ? "count.GetValueOrDefault()" : "count") + ";" : "";
            var source = Helpers.GetExpectedFromFile("Historical")
                .Replace("__FRAMEWORK_TYPE__", frameworkType.FullName)
                .Replace("__DECLARATION__", declaration)
                .Replace("__ARGUMENT__", argument)
                .Replace("__COUNT_ASSIGNMENT__", countAssignment)
                .Replace("__COUNT_PROPERTY__", includeCount ? "public int Count { get; set; }" : "");
            var baseline = CreateCompilation(source);
            Assert.That(baseline.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            var locationType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "azureLocation", "Azure.Core.azureLocation");
            var location = InputFactory.Property("location", locationType);
            InputModelProperty[] inheritedProperties = [location,
                .. includeSecondLocation ? new[] { InputFactory.Property("secondLocation", locationType) } : []];
            var input = InputFactory.Model("BotData", properties: [.. inheritedProperties,
                .. includeCount ? new[] { InputFactory.Property("count", InputPrimitiveType.Int32, isRequired: countRequired) } : []]);
            var mappedInput = InputFactory.Model("MappedBase", properties: []);
            var previousBase = new NamedTypeSymbolProvider(baseline.GetTypeByMetadataName(frameworkType.FullName!)!, baseline);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [input],
                lastContractCompilation: () => Task.FromResult<Compilation>(baseline),
                createModelCore: model => new RestoredModel(model,
                    new SystemObjectModelProvider(new CSharpType(frameworkType), mappedInput, previousBase, inheritedProperties)));
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
                => base.BuildProperties().Where(property => !mappedBase.Properties.Any(inherited => inherited.Name == property.Name)).ToArray();
            protected override TypeProvider[] BuildSerializationProviders() => [];
        }
    }
}

namespace Microsoft.TypeSpec.Generator.Tests.Providers.Framework
{
    public static class DeprecatedHelper
    {
        [Obsolete("Regression diagnostic")]
        public static void Check() { }
    }

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

    public class AdditionalArgumentFrameworkBase
    {
        protected AdditionalArgumentFrameworkBase() { }
        public AdditionalArgumentFrameworkBase(ResourceLocation location, int count) => Location = location;
        public ResourceLocation Location { get; set; }
    }

    public class TwoLocationsFrameworkBase
    {
        protected TwoLocationsFrameworkBase() { }
        public TwoLocationsFrameworkBase(ResourceLocation location, ResourceLocation secondLocation)
        {
            Location = location;
            SecondLocation = secondLocation;
        }
        public ResourceLocation Location { get; set; }
        public ResourceLocation SecondLocation { get; set; }
    }
}
