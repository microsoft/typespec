// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
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
    public class MappedFrameworkBaseRestorationTests
    {
        [Test]
        public async Task RestoresMoreDerivedFrameworkBaseWithChildOwnedOptionalProperties()
        {
            var model = await CreateModelAsync();
            model.ProcessTypeForBackCompatibility();

            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True,
                    "The previous framework base must replace the current mapped ResourceData base.");
                Assert.That(model.BaseModelProvider, Is.InstanceOf<SystemObjectModelProvider>());
                Assert.That(model.Properties.Select(property => property.Name), Does.Not.Contain("Location"),
                    "Location must be inherited from the restored framework base rather than redeclared.");
                Assert.That(model.Properties.Select(property => property.Name), Does.Not.Contain("Tags"),
                    "Tags must be inherited from the restored framework base rather than redeclared.");
                Assert.That(model.Constructors.Any(constructor =>
                    constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                    constructor.Signature.Parameters.Count == 1 &&
                    constructor.Signature.Parameters[0].Name == "location" &&
                    constructor.Signature.Parameters[0].Type.Equals(new CSharpType(typeof(ResourceLocation)))), Is.True,
                    "The concrete model must retain its historical public location constructor even though the wire property is optional.");
            });
        }

        [TestCase(true, false, false)]
        [TestCase(false, true, false)]
        [TestCase(false, false, true)]
        public async Task RejectsIncompatibleChildOwnedProperties(bool incompatibleLocationType, bool readOnlyLocation, bool readOnlyTags)
        {
            var model = await CreateModelAsync(incompatibleLocationType, readOnlyLocation, readOnlyTags);

            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                "Incompatible child-owned properties must not be discarded to restore the historical base.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ProjectionPreservesInputOwnershipAndExistingProviders(bool existingMappedCandidate)
        {
            var model = await CreateModelAsync(existingMappedCandidate: existingMappedCandidate);
            var restored = (SystemObjectModelProvider)model.BaseModelProvider!;
            var originalBase = model.InputModel.BaseModel!;
            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True);
                Assert.That(originalBase.Name, Is.EqualTo("ProxyResource"));
                Assert.That(originalBase.Properties, Is.Empty);
                Assert.That(restored.InputModel, Is.SameAs(originalBase));
                Assert.That(model.InputModel.Properties.Select(property => property.Name), Is.EqualTo(new[] { "location", "tags" }));
                Assert.That(model.InputModel.Properties, Is.All.Matches<InputModelProperty>(property =>
                    ReferenceEquals(property.EnclosingType, model.InputModel) && !property.IsRequired && !property.IsReadOnly));
                Assert.That(restored.MappedInputProperties.Select(property => property.Name),
                    Is.EquivalentTo(new[] { "location", "tags", "id", "name", "type" }));
                Assert.That(CodeModelGenerator.Instance.TypeFactory.CreateModel(originalBase)!.Type.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True);
            });
            if (existingMappedCandidate)
            {
                var shared = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.Values.OfType<SystemObjectModelProvider>()
                    .Distinct().Single(provider => provider.InputModel.Name == "MappedTrackedResource");
                Assert.That(CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[shared.Type], Is.SameAs(shared));
                Assert.That(restored, Is.Not.SameAs(shared));
                Assert.That(shared.MappedInputProperties, Is.Empty);
                Assert.That(shared.Properties, Is.Empty);
            }
            else
            {
                Assert.That(CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.Values.OfType<SystemObjectModelProvider>().Any(provider =>
                    provider.SystemType.AreNamesEqual(new CSharpType(typeof(TrackedResourceData)))), Is.False);
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task SourceOwnerVetoIsNotBypassedByProjection(bool cacheRemoval)
        {
            var model = await CreateModelAsync(visitor: new SourceOwnerVeto(), cacheSourceProperty: cacheRemoval);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True);
        }

        private sealed class SourceOwnerVeto : LibraryVisitor
        {
            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
                => input.Name == "location" && property?.EnclosingType is ModelProvider owner &&
                    ReferenceEquals(owner.InputModel, input.EnclosingType) ? null : property;
        }

        private static async Task<ModelProvider> CreateModelAsync(
            bool incompatibleLocationType = false,
            bool readOnlyLocation = false,
            bool readOnlyTags = false,
            bool existingMappedCandidate = false,
            LibraryVisitor? visitor = null,
            bool cacheSourceProperty = false)
        {
            // Reproduces #12304: Bot -> ProxyResource -> Resource, with location/tags owned by Bot.
            // A downstream generator maps ProxyResource to ResourceData, while the last public
            // contract derives from TrackedResourceData. Do not make location required to restore its constructor.
            var resource = InputFactory.Model("Resource", properties:
            [
                InputFactory.Property("id", InputPrimitiveType.String, isReadOnly: true),
                InputFactory.Property("name", InputPrimitiveType.String, isReadOnly: true),
                InputFactory.Property("type", InputPrimitiveType.String, isReadOnly: true),
            ]);
            var proxyResource = InputFactory.Model("ProxyResource", properties: [], baseModel: resource);
            var locationType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "azureLocation", "Azure.Core.azureLocation");
            var bot = InputFactory.Model("BotData", baseModel: proxyResource, properties:
            [
                InputFactory.Property("location", incompatibleLocationType ? InputPrimitiveType.Int32 : locationType,
                    isRequired: false, isReadOnly: readOnlyLocation),
                InputFactory.Property("tags", InputFactory.Dictionary(InputPrimitiveType.String),
                    isRequired: false, isReadOnly: readOnlyTags),
            ]);
            var mappedInput = InputFactory.Model("MappedTrackedResource", properties: []);
            CSharpType? requestedBase = null;

            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [resource, proxyResource, bot, .. existingMappedCandidate ? new[] { mappedInput } : []],
                createModelCore: input =>
                {
                    if (input == proxyResource || input == mappedInput)
                    {
                        return new SystemObjectModelProvider(new CSharpType(input == proxyResource
                            ? typeof(ResourceData) : typeof(TrackedResourceData)), input);
                    }
                    var provider = new ModelProvider(input);
                    if (input == bot && cacheSourceProperty)
                    {
                        CodeModelGenerator.Instance.TypeFactory.CreateProperty(bot.Properties[0], provider);
                    }
                    return provider;
                },
                additionalMetadataReferences:
                [
                    MetadataReference.CreateFromFile(typeof(ResourceData).Assembly.Location),
                    MetadataReference.CreateFromFile(Path.Combine(Path.GetDirectoryName(typeof(object).Assembly.Location)!, "System.Runtime.dll")),
                ],
                lastContractCompilation: async () =>
                {
                    var compilation = await Helpers.GetCompilationFromDirectoryAsync(
                        method: nameof(RestoresMoreDerivedFrameworkBaseWithChildOwnedOptionalProperties));
                    // The shared compilation helper also includes unrelated serialization helpers.
                    // Only the self-contained historical contract belongs in this baseline.
                    compilation = compilation.RemoveSyntaxTrees(compilation.SyntaxTrees
                        .Where(tree => Path.GetFileName(tree.FilePath) != "BotData.cs"));
                    Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
                    return compilation;
                },
                createLastContractModelBase: (previousBase, _) =>
                {
                    requestedBase = previousBase;
                    return previousBase.AreNamesEqual(new CSharpType(typeof(TrackedResourceData)))
                        ? new CSharpType(typeof(TrackedResourceData))
                        : null;
                },
                isLastContractModelBasePropertyCompatible: (mappedBase, input, previous) =>
                {
                    // Model the downstream generator's known envelope contract, including mutable,
                    // getter-only Tags. Do not relax the upstream default accessor/type policy.
                    var currentType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input.Type);
                    var validReadOnly = input.Name switch
                    {
                        "location" or "tags" => !input.IsReadOnly,
                        "id" or "name" or "type" => input.IsReadOnly,
                        _ => false,
                    };
                    return mappedBase.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))) &&
                        validReadOnly && currentType is not null && currentType.AreNamesEqual(previous.Type) &&
                        (!currentType.IsValueType || currentType.IsNullable == previous.Type.IsNullable) &&
                        previous.Name == char.ToUpperInvariant(input.Name[0]) + input.Name.Substring(1) &&
                        !previous.IsInitOnly && previous.Body.HasSetter == (input.Name == "location");
                });

            Mock.Get(CodeModelGenerator.Instance.TypeFactory)
                .Setup(factory => factory.CreateFrameworkType(typeof(ResourceLocation).FullName!))
                .Returns(typeof(ResourceLocation));
            Mock.Get(CodeModelGenerator.Instance.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateCSharpTypeCore", ItExpr.Is<InputType>(input => ReferenceEquals(input, locationType)))
                .Returns(new CSharpType(typeof(ResourceLocation)));

            if (visitor is not null)
            {
                CodeModelGenerator.Instance.AddVisitor(visitor);
            }

            var model = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ModelProvider>()
                .Single(provider => provider.Name == "BotData");

            // Prove historical candidate resolution succeeds; rejection must not be caused by a missing baseline.
            _ = model.BaseType;
            if (!existingMappedCandidate)
            {
                Assert.That(requestedBase?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True);
            }
            Assert.That(model.LastContractView, Is.Not.Null);
            Assert.That(model.CustomCodeView, Is.Null, "No handwritten inheritance partial may repair this scenario.");

            var candidate = new SystemObjectModelProvider(new CSharpType(typeof(TrackedResourceData)),
                proxyResource, model.LastContractView!.BaseTypeProvider!);
            Assert.Multiple(() =>
            {
                Assert.That(MappedModelBaseCompatibility.IsSupportedModelBase(candidate), Is.True);
                Assert.That(candidate.HasReconstructibleLastContractConstructor, Is.True);
                Assert.That(candidate.HasCompatibleLastContractProperties(), Is.True);
                Assert.That(candidate.HasCompatibleLastContractNonPropertyMembers(), Is.True);
                Assert.That(candidate.HasCompatibleLastContractInterfaces(model.LastContractView.BaseTypeProvider), Is.True);
            });
            return model;
        }
    }
}

namespace Microsoft.TypeSpec.Generator.Tests.Providers.Framework
{
    // Minimal framework stand-ins keep the upstream regression independent of an Azure SDK dependency.
    public readonly struct ResourceLocation { }

    public class ResourceData
    {
        protected ResourceData() { }

        public string Id { get; } = string.Empty;
        public string Name { get; } = string.Empty;
        public string Type { get; } = string.Empty;
    }

    public class TrackedResourceData : ResourceData
    {
        protected TrackedResourceData() { }
        public TrackedResourceData(ResourceLocation location) => Location = location;

        public ResourceLocation Location { get; set; }
        public IDictionary<string, string> Tags { get; } = new Dictionary<string, string>();
    }
}
