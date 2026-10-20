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
using Microsoft.TypeSpec.Generator.Tests.Providers.UpgradeFramework;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class MappedModelBaseUpgradeRegressionTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task RequiredMappedAncestorParameterIsConsumedOnce(bool registerFrameworkKey)
        {
            var (model, _) = await CreateModelAsync(requiredName: true, registerFrameworkKey: registerFrameworkKey);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(NamedTrackedResource))), Is.True);
            Assert.DoesNotThrow(() => _ = model.Constructors);
            var constructor = model.Constructors.Single(value => value.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.That(constructor.Signature.Parameters.Select(parameter => parameter.Name), Is.EqualTo(new[] { "name" }));
        }

        [Test]
        public async Task CanonicalProjectionRetainsChildPropertiesWhenOriginalBaseIsNonempty()
        {
            var (model, _) = await CreateModelAsync();
            var restored = (SystemObjectModelProvider)model.BaseModelProvider!;
            Assert.Multiple(() =>
            {
                Assert.That(restored.InputModel.Properties.Select(property => property.Name), Is.EqualTo(new[] { "name" }));
                Assert.That(restored.Properties.Select(property => property.Name), Is.EquivalentTo(new[] { "Name", "Location" }));
                Assert.That(restored.CanonicalView.Properties.Select(property => property.Name), Is.EquivalentTo(new[] { "Name", "Location" }));
                Assert.That(model.CanonicalView.Properties, Is.Empty);
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task CustomPropertyOrFieldAliasRetainsSourceAuthority(bool field)
        {
            var (model, currentBase) = await CreateModelAsync(customAlias: field
                ? "[CodeGenMember(\"Location\")] private string? _region;"
                : "[CodeGenMember(\"Location\")] public string? Region { get; set; }");
            Assert.That(model.CustomCodeView, Is.Not.Null);
            Assert.That(model.CustomCodeView!.Properties.Any(property => property.OriginalName == "Location") ||
                model.CustomCodeView.Fields.Any(value => value.OriginalName == "Location"), Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(currentBase.Type), Is.True,
                "Projection must not duplicate a wire property already claimed by a differently named custom member.");
        }

        private static async Task<(ModelProvider Model, ModelProvider CurrentBase)> CreateModelAsync(
            bool requiredName = false, bool registerFrameworkKey = false, string? customAlias = null)
        {
            var baselineSource = """
                using Microsoft.TypeSpec.Generator.Tests.Providers.UpgradeFramework;
                namespace Sample.Models
                {
                    public class Derived : NamedTrackedResource
                    {
                        public Derived(string name) : base(name) { }
                    }
                }
                """;
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(NamedResource).Assembly.Location).Distinct(StringComparer.Ordinal)
                .Select(path => MetadataReference.CreateFromFile(path));
            var baseline = CSharpCompilation.Create("PreviousMappedHierarchy", [CSharpSyntaxTree.ParseText(baselineSource)], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(baseline.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);

            var current = InputFactory.Model("CurrentBase", properties:
                [InputFactory.Property("name", InputPrimitiveType.String, isRequired: requiredName)]);
            var input = InputFactory.Model("Derived", baseModel: current,
                properties: [InputFactory.Property("location", InputPrimitiveType.String)]);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [current, input],
                createModelCore: model => model == current
                    ? new SystemObjectModelProvider(new CSharpType(typeof(NamedResource)), model)
                    : new ModelProvider(model),
                additionalMetadataReferences:
                [
                    MetadataReference.CreateFromFile(typeof(NamedResource).Assembly.Location),
                    MetadataReference.CreateFromFile(Path.Combine(Path.GetDirectoryName(typeof(object).Assembly.Location)!, "System.Runtime.dll")),
                ],
                compilation: customAlias is null ? null : () => Helpers.GetCompilationFromSourceFilesAsync(
                    [("Derived.cs", "using Microsoft.TypeSpec.Generator.Customizations; namespace Sample.Models { public partial class Derived { " + customAlias + " } }")]),
                lastContractCompilation: () => Task.FromResult<Compilation>(baseline),
                createLastContractModelBase: (previous, _) => previous.AreNamesEqual(new CSharpType(typeof(NamedTrackedResource)))
                    ? new CSharpType(typeof(NamedTrackedResource)) : null);

            var factory = CodeModelGenerator.Instance.TypeFactory;
            var currentProvider = factory.CreateModel(current)!;
            if (registerFrameworkKey)
            {
                // Downstream mappings can additionally register the reflected CLR key. Resolution must
                // not consume both this shared provider and the flattened historical projection.
                factory.CSharpTypeMap[new CSharpType(typeof(NamedResource))] = currentProvider;
            }
            return (factory.CreateModel(input)!, currentProvider);
        }
    }
}

namespace Microsoft.TypeSpec.Generator.Tests.Providers.UpgradeFramework
{
    public class NamedResource
    {
        protected NamedResource() { }
        public NamedResource(string name) => Name = name;
        public string Name { get; set; } = string.Empty;
    }

    public class NamedTrackedResource : NamedResource
    {
        protected NamedTrackedResource() { }
        public NamedTrackedResource(string name) : base(name) { }
        public string Location { get; set; } = string.Empty;
    }
}
