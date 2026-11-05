// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Tests.Providers.RestorationFramework;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using Assembly = System.Reflection.Assembly;

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

        [TestCase(false)]
        [TestCase(true)]
        public async Task RestoredConstructorPreservesFrameworkInitialization(bool existingMappedCandidate)
        {
            var model = await CreateModelAsync(existingMappedCandidate: existingMappedCandidate);
            model.ProcessTypeForBackCompatibility();
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(TrackedResourceData).Assembly.Location).Distinct(StringComparer.Ordinal)
                .Select(path => MetadataReference.CreateFromFile(path));
            var compilation = CSharpCompilation.Create($"RestoredBot_{Guid.NewGuid():N}",
                [CSharpSyntaxTree.ParseText(new TypeProviderWriter(model).Write().Content)], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join(Environment.NewLine,
                result.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));
            var generatedType = Assembly.Load(stream.ToArray()).GetType("Sample.Models.BotData")!;
            var location = new ResourceLocation(42);
            var instance = (TrackedResourceData)Activator.CreateInstance(generatedType, location)!;
            Assert.That(instance.Location.Value, Is.EqualTo(42));
            Assert.That(instance.Tags, Is.Not.Null,
                "The location constructor initializes Tags; assigning Location after base() does not.");
            Assert.DoesNotThrow(() => instance.Tags.Add("key", "value"));
            Assert.That(instance.Tags["key"], Is.EqualTo("value"));
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task RestoresBaseWithCompatibleChildAndAncestorName(bool existingMappedCandidate, bool cacheNameOwners)
        {
            var model = await CreateModelAsync(existingMappedCandidate: existingMappedCandidate,
                includeChildName: true, cacheNameOwners: cacheNameOwners);
            model.ProcessTypeForBackCompatibility();

            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True,
                "A compatible child/ancestor repetition of Name must not block base restoration.");
            var restored = (SystemObjectModelProvider)model.BaseModelProvider!;
            var childName = model.InputModel.Properties.Single(property => property.Name == "name");
            var ancestor = model.InputModel.BaseModel!.BaseModel!;
            var ancestorName = ancestor.Properties.Single(property => property.Name == "name");
            var projectedName = restored.Properties.Single(property => property.Name == "Name");

            Assert.Multiple(() =>
            {
                Assert.That(childName.EnclosingType, Is.SameAs(model.InputModel));
                Assert.That(ancestorName.EnclosingType, Is.SameAs(ancestor));
                Assert.That(childName.IsRequired, Is.True);
                Assert.That(ancestorName.IsRequired, Is.False);
                Assert.That(childName.Decorators.Select(decorator => decorator.Name), Does.Contain("TypeSpec.@pattern"));
                Assert.That(ancestorName.ApiVersions, Is.EqualTo(new[] { "v3", "v4" }));
                Assert.That(restored.MappedInputProperties.Count(property => property.Name == "name"), Is.EqualTo(1));
                Assert.That(restored.MappedInputProperties, Does.Contain(childName));
                Assert.That(restored.MappedInputProperties, Does.Not.Contain(ancestorName));
                Assert.That(projectedName.InputProperty, Is.SameAs(childName));
                Assert.That(projectedName.WireInfo!.IsRequired, Is.True,
                    "The effective child wire metadata must be retained.");
                Assert.That(model.Properties.Select(property => property.Name), Does.Not.Contain("Name"));
                Assert.That(model.Constructors.Any(constructor =>
                    constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                    constructor.Signature.Parameters.Count == 1 &&
                    constructor.Signature.Parameters[0].Type.Equals(new CSharpType(typeof(ResourceLocation)))), Is.True);
            });

            var sourceOwner = CodeModelGenerator.Instance.TypeFactory.CreateModel(ancestor)!;
            var sourceName = CodeModelGenerator.Instance.TypeFactory.CreateProperty(ancestorName, sourceOwner);
            Assert.That(sourceName!.EnclosingType, Is.SameAs(sourceOwner));
            Assert.That(sourceName.WireInfo!.IsRequired, Is.False,
                "The ancestor's cached property must remain unchanged.");
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task RestoresBaseWithPathNameAndAncestorPayloadName(bool existingMappedCandidate, bool cacheNameOwners)
        {
            var model = await CreateModelAsync(existingMappedCandidate: existingMappedCandidate,
                includeChildName: true, childNameIsHttpMetadata: true, cacheNameOwners: cacheNameOwners);
            model.ProcessTypeForBackCompatibility();

            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True,
                "A path-only name must not hide the ancestor's matching payload property.");
            var restored = (SystemObjectModelProvider)model.BaseModelProvider!;
            var childName = model.InputModel.Properties.Single(property => property.Name == "name");
            var ancestor = model.InputModel.BaseModel!.BaseModel!;
            var ancestorName = ancestor.Properties.Single(property => property.Name == "name");
            var projectedName = restored.Properties.Single(property => property.Name == "Name");

            var httpAlias = restored.GetMappedHttpMetadataProperties().Single();
            Assert.Multiple(() =>
            {
                Assert.That(httpAlias.Metadata, Is.SameAs(childName));
                Assert.That(httpAlias.Property, Is.SameAs(projectedName));
                Assert.That(childName.EnclosingType, Is.SameAs(model.InputModel));
                Assert.That(childName.IsHttpMetadata, Is.True);
                Assert.That(childName.IsRequired, Is.True);
                Assert.That(childName.Decorators.Select(decorator => decorator.Name), Does.Contain("TypeSpec.@pattern"));
                Assert.That(ancestorName.EnclosingType, Is.SameAs(ancestor));
                Assert.That(ancestorName.IsHttpMetadata, Is.False);
                Assert.That(ancestorName.IsRequired, Is.False);
                Assert.That(restored.MappedInputProperties.Count(property => property.Name == "name"), Is.EqualTo(1));
                Assert.That(restored.MappedInputProperties, Does.Contain(ancestorName));
                Assert.That(restored.MappedInputProperties, Does.Not.Contain(childName));
                Assert.That(projectedName.InputProperty, Is.SameAs(ancestorName));
                Assert.That(projectedName.WireInfo!.IsHttpMetadata, Is.False);
                Assert.That(projectedName.WireInfo!.IsRequired, Is.False);
                Assert.That(model.Properties.Select(property => property.Name), Does.Not.Contain("Name"));
                Assert.That(model.Constructors.Any(constructor =>
                    constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                    constructor.Signature.Parameters.Count == 1 &&
                    constructor.Signature.Parameters[0].Type.Equals(new CSharpType(typeof(ResourceLocation)))), Is.True);
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task MultiplePathDeclarationsRetainTheSamePayloadAlias(bool cacheNameOwners)
        {
            var model = await CreateModelAsync(includeChildName: true, childNameIsHttpMetadata: true,
                includeIntermediateHttpName: true, cacheNameOwners: cacheNameOwners);
            model.ProcessTypeForBackCompatibility();
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True);
            var restored = (SystemObjectModelProvider)model.BaseModelProvider!;
            var childName = model.InputModel.Properties.Single(property => property.Name == "name");
            var intermediateName = model.InputModel.BaseModel!.Properties.Single(property => property.Name == "name");
            var ancestorName = model.InputModel.BaseModel.BaseModel!.Properties.Single(property => property.Name == "name");
            var aliases = restored.GetMappedHttpMetadataProperties().ToArray();
            Assert.Multiple(() =>
            {
                Assert.That(aliases.Select(alias => alias.Metadata), Is.EqualTo(new[] { childName, intermediateName }));
                Assert.That(aliases.Select(alias => alias.Property).Distinct().Count(), Is.EqualTo(1));
                Assert.That(aliases[0].Property.InputProperty, Is.SameAs(ancestorName));
                Assert.That(aliases[0].Property.WireInfo!.IsHttpMetadata, Is.False);
                Assert.That(childName.IsHttpMetadata && intermediateName.IsHttpMetadata, Is.True);
            });
        }

        [Test]
        public async Task ConflictingChildAndAncestorNameWireIdentitiesRejectRestoration()
        {
            var model = await CreateModelAsync(includeChildName: true, childNameWire: "differentName");
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True);
        }

        [TestCase("same-owner")]
        [TestCase("same-ancestor")]
        [TestCase("different-raw-name")]
        [TestCase("weaken-requiredness")]
        [TestCase("visibility")]
        [TestCase("api-version")]
        [TestCase("ancestor-default")]
        [TestCase("ancestor-decorator")]
        [TestCase("serialization")]
        public async Task IncompatibleDuplicateDeclarationsRejectRestoration(string variant)
        {
            var model = await CreateModelAsync(includeChildName: true, duplicateNameVariant: variant);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                $"The {variant} difference must not be discarded by projection.");
        }

        [TestCase("BotData")]
        [TestCase("Resource")]
        public async Task DuplicateNameSourceOwnerVetoRejectsRestoration(string ownerName)
        {
            var visitor = new DuplicateNameOwnerVeto(ownerName);
            var model = await CreateModelAsync(includeChildName: true, visitor: visitor);
            Assert.That(visitor.VisitedSourceOwner, Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True);
        }

        [TestCase("BotData", false)]
        [TestCase("BotData", true)]
        [TestCase("Resource", false)]
        [TestCase("Resource", true)]
        public async Task DuplicateNameSourceOwnerAttributesAreNotDiscarded(string ownerName, bool cacheNameOwners)
        {
            var visitor = new DuplicateNameOwnerAttributeChange(ownerName);
            var model = await CreateModelAsync(includeChildName: true, cacheNameOwners: cacheNameOwners, visitor: visitor);
            Assert.That(visitor.VisitedSourceOwner, Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                "Restoration must not discard an attribute added to either source owner.");
        }

        [TestCase("BotData", false)]
        [TestCase("BotData", true)]
        [TestCase("Resource", false)]
        [TestCase("Resource", true)]
        public async Task DuplicateNameSourceOwnerParameterDescriptionIsNotDiscarded(string ownerName, bool cacheNameOwners)
        {
            var visitor = new DuplicateNameOwnerParameterChange(ownerName);
            var model = await CreateModelAsync(includeChildName: true, cacheNameOwners: cacheNameOwners, visitor: visitor);
            Assert.That(visitor.VisitedSourceOwner, Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                "Restoration must not discard parameter metadata changed on either source owner.");
        }

        [TestCase("BotData", false)]
        [TestCase("BotData", true)]
        [TestCase("Resource", false)]
        [TestCase("Resource", true)]
        public async Task DuplicateNameUnchangedPublicParameterVariantAllowsRestoration(string ownerName, bool cacheNameOwners)
        {
            var visitor = new DuplicateNameOwnerPublicParameterChange(ownerName, changeDescription: false);
            var model = await CreateModelAsync(includeChildName: true, cacheNameOwners: cacheNameOwners, visitor: visitor);
            Assert.That(visitor.Primary, Is.Not.Null);
            Assert.That(visitor.PublicVariant, Is.SameAs(visitor.Primary!.ToPublicInputParameter()));
            Assert.That(visitor.PublicVariant!.Description.ToString(), Is.EqualTo(visitor.OriginalDescription));
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True,
                "Materializing an unchanged public-input parameter must not veto an otherwise compatible restoration.");
        }

        [TestCase("BotData", false)]
        [TestCase("BotData", true)]
        [TestCase("Resource", false)]
        [TestCase("Resource", true)]
        public async Task DuplicateNameSourceOwnerPublicParameterVariantIsNotDiscarded(string ownerName, bool cacheNameOwners)
        {
            var visitor = new DuplicateNameOwnerPublicParameterChange(ownerName);
            var model = await CreateModelAsync(includeChildName: true, cacheNameOwners: cacheNameOwners, visitor: visitor);
            Assert.That(visitor.Primary, Is.Not.Null, "The visitor must reach the intended source owner.");
            Assert.That(visitor.PublicVariant, Is.Not.SameAs(visitor.Primary));
            Assert.That(visitor.Primary!.ToPublicInputParameter(), Is.SameAs(visitor.PublicVariant));
            Assert.That(visitor.Primary.Description.ToString(), Is.EqualTo(visitor.OriginalDescription));
            Assert.That(visitor.PublicVariant!.Description.ToString(), Is.EqualTo("Owner-specific public input documentation."));
            if (cacheNameOwners)
            {
                var source = visitor.Primary.Property!;
                Assert.That(CodeModelGenerator.Instance.TypeFactory.PropertyCache.TryGetValue(source.InputProperty!, out var cached), Is.True);
                Assert.That(cached, Is.SameAs(source), "The fixture must exercise the cached source-owner property.");
            }
            if (model.BaseType!.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))))
            {
                var projected = model.BaseModelProvider!.CanonicalView.Properties.Single(property => property.Name == "Name");
                Assert.That(projected.AsParameter.ToPublicInputParameter().Description.ToString(),
                    Is.EqualTo(visitor.PublicVariant.Description.ToString()),
                    "Projection must not discard a change made only to the source owner's public-input parameter.");
            }
            Assert.That(model.BaseType.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                "Restoration must not discard the source owner's customized public-input parameter.");
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task UniqueSourceOwnerPublicParameterVariantIsNotDiscarded(bool cacheSourceProperty, bool customizeVariant)
        {
            var visitor = new UniqueLocationPublicParameterChange(customizeVariant);
            var model = await CreateModelAsync(includeChildName: true, cacheSourceProperty: cacheSourceProperty, visitor: visitor);
            Assert.That(visitor.Primary, Is.Not.Null, "The visitor must reach the unique child-owned Location property.");
            Assert.That(visitor.Variant, Is.SameAs(visitor.Primary!.ToPublicInputParameter()));
            if (customizeVariant && model.BaseType!.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))))
            {
                var projected = model.BaseModelProvider!.CanonicalView.Properties.Single(property => property.Name == "Location");
                Assert.That(projected.AsParameter.ToPublicInputParameter().Description.ToString(),
                    Is.EqualTo(visitor.Variant!.Description.ToString()),
                    "Projection must not discard customization of the unique source-owned public-input parameter.");
            }
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(customizeVariant ? typeof(ResourceData) : typeof(TrackedResourceData))), Is.True,
                "A customized public-input variant must be preserved or veto restoration; an unchanged variant must not block it.");
        }

        [Test]
        public async Task DuplicateNameSourceOwnerMetadataIsNotDiscarded(
            [Values("BotData", "Resource")] string ownerName,
            [Values("docs", "ref")] string change,
            [Values(false, true)] bool cacheNameOwners,
            [Values(false, true)] bool childNameIsHttpMetadata)
        {
            var visitor = new DuplicateNameOwnerMetadataChange(ownerName, change);
            var model = await CreateModelAsync(includeChildName: true, childNameIsHttpMetadata: childNameIsHttpMetadata,
                cacheNameOwners: cacheNameOwners, visitor: visitor);
            Assert.That(visitor.VisitedSourceOwner, Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                "Restoration must not discard source-owner metadata from either duplicate declaration.");
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

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task ProjectionPreservesInputOwnershipAndExistingProviders(bool existingMappedCandidate, bool cacheSourceProperty)
        {
            var model = await CreateModelAsync(existingMappedCandidate: existingMappedCandidate, cacheSourceProperty: cacheSourceProperty);
            var restored = (SystemObjectModelProvider)model.BaseModelProvider!;
            var originalBase = model.InputModel.BaseModel!;
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var currentBase = factory.CreateModel(originalBase)!;
            var location = model.InputModel.Properties[0];
            var hadCachedProperty = factory.PropertyCache.TryGetValue(location, out var sourceProperty);
            _ = restored.CanonicalView.Properties;
            Assert.That(factory.PropertyCache.TryGetValue(location, out var cached), Is.EqualTo(hadCachedProperty));
            Assert.That(cached, Is.SameAs(sourceProperty));
            if (cacheSourceProperty)
            {
                Assert.That(cached!.EnclosingType, Is.SameAs(model));
            }
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
                Assert.That(currentBase.Type.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True);
                Assert.That(factory.CreateModel(originalBase), Is.SameAs(currentBase));
                Assert.That(factory.CSharpTypeMap[currentBase.Type], Is.SameAs(currentBase));
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

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task SourceOwnerHistoricalTypeNormalizationIsPreserved(bool existingMappedCandidate, bool cacheSourceProperty)
        {
            var visitor = new SourceOwnerShapeChange("historical-type");
            var model = await CreateModelAsync(existingMappedCandidate: existingMappedCandidate,
                visitor: visitor, cacheSourceProperty: cacheSourceProperty);
            model.ProcessTypeForBackCompatibility();

            Assert.That(visitor.VisitedSourceOwner, Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True,
                "A source-owner type normalization already represented by the historical member must be retained.");
            var projected = ((SystemObjectModelProvider)model.BaseModelProvider!).Properties.Single(property => property.Name == "Location");
            var source = CodeModelGenerator.Instance.TypeFactory.CreateProperty(model.InputModel.Properties[0], model)!;
            Assert.That(source.Type, Is.EqualTo(new CSharpType(typeof(ResourceLocation))));
            Assert.That(source.EnclosingType, Is.SameAs(model));
            Assert.That(projected.Type, Is.EqualTo(source.Type));
            Assert.That(model.Constructors.Any(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 1 &&
                constructor.Signature.Parameters[0].Type.Equals(new CSharpType(typeof(ResourceLocation)))), Is.True);
        }

        [TestCase("historical-type-setter", false)]
        [TestCase("historical-type-setter", true)]
        [TestCase("historical-type-attribute", false)]
        [TestCase("historical-type-attribute", true)]
        [TestCase("historical-type-doc", false)]
        [TestCase("historical-type-doc", true)]
        [TestCase("historical-type-ref", false)]
        [TestCase("historical-type-ref", true)]
        [TestCase("historical-type-description", false)]
        [TestCase("historical-type-description", true)]
        [TestCase("historical-type-parameter-name", false)]
        [TestCase("historical-type-parameter-name", true)]
        [TestCase("historical-type-parameter-default", false)]
        [TestCase("historical-type-parameter-default", true)]
        [TestCase("historical-type-parameter-attribute", false)]
        [TestCase("historical-type-parameter-attribute", true)]
        [TestCase("historical-type-parameter-validation", false)]
        [TestCase("historical-type-parameter-validation", true)]
        public async Task SourceOwnerNormalizationWithOtherChangesRejectsRestoration(string change, bool cacheSourceProperty)
        {
            var visitor = new SourceOwnerShapeChange(change);
            var model = await CreateModelAsync(visitor: visitor, cacheSourceProperty: cacheSourceProperty);
            Assert.That(visitor.VisitedSourceOwner, Is.True);
            Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                "A matching type must not mask other source-owner customizations.");
        }

        [TestCase("type", false)]
        [TestCase("type", true)]
        [TestCase("setter", false)]
        [TestCase("setter", true)]
        [TestCase("setter-accessibility", false)]
        [TestCase("setter-accessibility", true)]
        [TestCase("accessibility", false)]
        [TestCase("accessibility", true)]
        [TestCase("init-only", false)]
        [TestCase("init-only", true)]
        public async Task SourceOwnerShapeChangesAreNotDiscardedByProjection(string change, bool cacheSourceProperty)
        {
            var visitor = new SourceOwnerShapeChange(change);
            var model = await CreateModelAsync(visitor: visitor, cacheSourceProperty: cacheSourceProperty);

            Assert.Multiple(() =>
            {
                Assert.That(visitor.VisitedSourceOwner, Is.True,
                    "The regression must exercise the source-owner-specific visitor, not a missing candidate.");
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                    "Restoration must not discard a visitor's source-owner CLR customization.");
                var location = model.Properties.Single(property => property.Name == "Location");
                switch (change)
                {
                    case "type":
                        Assert.That(location.Type, Is.EqualTo(new CSharpType(typeof(int))));
                        break;
                    case "setter":
                        Assert.That(location.Body.HasSetter, Is.False);
                        break;
                    case "setter-accessibility":
                        Assert.That(((AutoPropertyBody)location.Body).SetterModifiers, Is.EqualTo(MethodSignatureModifiers.Private));
                        break;
                    case "accessibility":
                        Assert.That(location.Modifiers, Is.EqualTo(MethodSignatureModifiers.Internal));
                        break;
                    case "init-only":
                        Assert.That(location.IsInitOnly, Is.True);
                        break;
                }
            });
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task SourceOwnerInitializerIsNotDiscardedByProjection(bool cacheSourceProperty, bool changeInitializer)
        {
            var visitor = new SourceOwnerInitializerChange(changeInitializer);
            var model = await CreateModelAsync(visitor: visitor, cacheSourceProperty: cacheSourceProperty);
            var location = model.Properties.SingleOrDefault(property => property.Name == "Location");

            Assert.Multiple(() =>
            {
                Assert.That(visitor.VisitedSourceOwner, Is.True);
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.EqualTo(changeInitializer),
                    "Restoration must not discard a source-owner initializer, but should accept an unchanged body.");
                Assert.That(location is not null, Is.EqualTo(changeInitializer));
                if (changeInitializer && location is not null)
                {
                    Assert.That(location.Body, Is.InstanceOf<AutoPropertyBody>());
                    if (location.Body is AutoPropertyBody body)
                    {
                        Assert.That(body.InitializationExpression?.ToDisplayString(), Does.Contain("42"));
                        Assert.That(new TypeProviderWriter(model).Write().Content, Does.Contain("(42);"),
                            "The customized initializer must survive in the emitted model.");
                    }
                }
            });
        }

        private sealed class SourceOwnerInitializerChange(bool changeInitializer) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "location" && property?.EnclosingType is ModelProvider owner &&
                    ReferenceEquals(owner.InputModel, input.EnclosingType) && property.Body is AutoPropertyBody body)
                {
                    VisitedSourceOwner = true;
                    property.Body = body with
                    {
                        InitializationExpression = changeInitializer
                            ? Snippet.New.Instance(new CSharpType(typeof(ResourceLocation)), Snippet.Literal(42))
                            : body.InitializationExpression,
                    };
                }
                return property;
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task SourceOwnerWireNameIsNotDiscardedByProjection(bool cacheSourceProperty)
        {
            var visitor = new SourceOwnerWireNameChange();
            var model = await CreateModelAsync(visitor: visitor, cacheSourceProperty: cacheSourceProperty);

            Assert.Multiple(() =>
            {
                Assert.That(visitor.VisitedSourceOwner, Is.True);
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True,
                    "Restoration must not discard a source-owner wire customization.");
                Assert.That(model.CanonicalView.Properties.Single(property => property.Name == "Location").WireInfo?.SerializedName,
                    Is.EqualTo("customLocation"));
            });
        }

        private sealed class SourceOwnerWireNameChange : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "location" && property?.EnclosingType is ModelProvider owner &&
                    ReferenceEquals(owner.InputModel, input.EnclosingType) && property.WireInfo is { } wireInfo)
                {
                    VisitedSourceOwner = true;
                    wireInfo.SerializedName = "customLocation";
                }
                return property;
            }
        }

        [TestCase("required", false)]
        [TestCase("required", true)]
        [TestCase("removed", false)]
        [TestCase("removed", true)]
        public async Task SourceOwnerWireMetadataIsNotDiscardedByProjection(string change, bool cacheSourceProperty)
        {
            var visitor = new SourceOwnerWireMetadataChange(change);
            var model = await CreateModelAsync(visitor: visitor, cacheSourceProperty: cacheSourceProperty);

            Assert.Multiple(() =>
            {
                Assert.That(visitor.VisitedSourceOwner, Is.True);
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(ResourceData))), Is.True);
                var wireInfo = model.Properties.Single(property => property.Name == "Location").WireInfo;
                if (change == "required")
                {
                    Assert.That(wireInfo?.IsRequired, Is.True);
                }
                else
                {
                    Assert.That(wireInfo, Is.Null);
                }
            });
        }

        private sealed class SourceOwnerWireMetadataChange(string change) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "location" && property?.EnclosingType is ModelProvider owner &&
                    ReferenceEquals(owner.InputModel, input.EnclosingType) && property.WireInfo is { } wireInfo)
                {
                    VisitedSourceOwner = true;
                    property.WireInfo = change == "removed" ? null : new PropertyWireInformation(
                        wireInfo.SerializationFormat, true, wireInfo.IsReadOnly, wireInfo.IsNullable,
                        wireInfo.IsDiscriminator, wireInfo.SerializedName, wireInfo.IsHttpMetadata, wireInfo.IsApiVersion);
                }
                return property;
            }
        }

        private sealed class SourceOwnerShapeChange(string change) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name != "location" || property?.EnclosingType is not ModelProvider owner ||
                    !ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    return property;
                }
                VisitedSourceOwner = true;
                switch (change)
                {
                    case "type":
                        property.Type = new CSharpType(typeof(int));
                        break;
                    case "historical-type":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)));
                        break;
                    case "historical-type-setter":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)), body: new AutoPropertyBody(false));
                        break;
                    case "historical-type-attribute":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)),
                            attributes: [new AttributeStatement(typeof(ObsoleteAttribute))]);
                        break;
                    case "historical-type-doc":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)),
                            xmlDocs: new XmlDocProvider(new XmlDocSummaryStatement([$"Owner-specific documentation."])));
                        break;
                    case "historical-type-ref":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)), isRef: true);
                        break;
                    case "historical-type-description":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)), description: $"Owner-specific parameter documentation.");
                        break;
                    case "historical-type-parameter-name":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)));
                        property.AsParameter.Update(name: "customLocation");
                        break;
                    case "historical-type-parameter-default":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)));
                        property.AsParameter.Update(defaultValue: Snippet.Default);
                        break;
                    case "historical-type-parameter-attribute":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)));
                        property.AsParameter.Update(attributes: [new AttributeStatement(typeof(ObsoleteAttribute))]);
                        break;
                    case "historical-type-parameter-validation":
                        property.Update(type: new CSharpType(typeof(ResourceLocation)));
                        property.AsParameter.Update(validation: ParameterValidationType.AssertNotNull);
                        break;
                    case "setter":
                        property.Body = new AutoPropertyBody(false);
                        break;
                    case "setter-accessibility":
                        property.Body = new AutoPropertyBody(true, MethodSignatureModifiers.Private);
                        break;
                    case "accessibility":
                        property.Modifiers = MethodSignatureModifiers.Internal;
                        break;
                    case "init-only":
                        property.IsInitOnly = true;
                        break;
                }
                return property;
            }
        }

        private sealed class SourceOwnerVeto : LibraryVisitor
        {
            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
                => input.Name == "location" && property?.EnclosingType is ModelProvider owner &&
                    ReferenceEquals(owner.InputModel, input.EnclosingType) ? null : property;
        }

        private sealed class DuplicateNameOwnerVeto(string ownerName) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "name" && property?.EnclosingType is ModelProvider owner &&
                    owner.InputModel.Name == ownerName && ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    VisitedSourceOwner = true;
                    return null;
                }
                return property;
            }
        }

        private sealed class DuplicateNameOwnerAttributeChange(string ownerName) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "name" && property?.EnclosingType is ModelProvider owner &&
                    owner.InputModel.Name == ownerName && ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    VisitedSourceOwner = true;
                    property.Update(attributes: [new AttributeStatement(typeof(ObsoleteAttribute))]);
                }
                return property;
            }
        }

        private sealed class DuplicateNameOwnerMetadataChange(string ownerName, string change) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "name" && property?.EnclosingType is ModelProvider owner &&
                    owner.InputModel.Name == ownerName && ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    VisitedSourceOwner = true;
                    if (change == "docs")
                    {
                        property.Update(xmlDocs: new XmlDocProvider(new XmlDocSummaryStatement([$"Owner-specific documentation."])));
                    }
                    else
                    {
                        property.Update(isRef: true);
                    }
                }
                return property;
            }
        }

        private sealed class DuplicateNameOwnerParameterChange(string ownerName) : LibraryVisitor
        {
            public bool VisitedSourceOwner { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "name" && property?.EnclosingType is ModelProvider owner &&
                    owner.InputModel.Name == ownerName && ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    VisitedSourceOwner = true;
                    property.AsParameter.Update(description: $"Owner-specific parameter documentation.");
                }
                return property;
            }
        }

        private sealed class DuplicateNameOwnerPublicParameterChange(string ownerName, bool changeDescription = true) : LibraryVisitor
        {
            public ParameterProvider? Primary { get; private set; }
            public ParameterProvider? PublicVariant { get; private set; }
            public string? OriginalDescription { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "name" && property?.EnclosingType is ModelProvider owner &&
                    owner.InputModel.Name == ownerName && ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    var primary = property.AsParameter;
                    var variant = primary.ToPublicInputParameter();
                    OriginalDescription = primary.Description.ToString();
                    if (changeDescription)
                    {
                        variant.Update(description: $"Owner-specific public input documentation.");
                    }
                    Primary = primary;
                    PublicVariant = variant;
                }
                return property;
            }
        }

        private sealed class UniqueLocationPublicParameterChange(bool customizeVariant) : LibraryVisitor
        {
            public ParameterProvider? Primary { get; private set; }
            public ParameterProvider? Variant { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (input.Name == "location" && property?.EnclosingType is ModelProvider owner &&
                    owner.InputModel.Name == "BotData" && ReferenceEquals(owner.InputModel, input.EnclosingType))
                {
                    var primary = property.AsParameter;
                    var variant = primary.ToPublicInputParameter();
                    if (customizeVariant)
                    {
                        variant.Update(description: $"Owner-specific public location documentation.");
                    }
                    Primary = primary;
                    Variant = variant;
                }
                return property;
            }
        }

        private static async Task<ModelProvider> CreateModelAsync(
            bool incompatibleLocationType = false,
            bool readOnlyLocation = false,
            bool readOnlyTags = false,
            bool existingMappedCandidate = false,
            LibraryVisitor? visitor = null,
            bool cacheSourceProperty = false,
            bool includeChildName = false,
            bool childNameIsHttpMetadata = false,
            bool includeIntermediateHttpName = false,
            string? childNameWire = null,
            bool cacheNameOwners = false,
            string? duplicateNameVariant = null)
        {
            // Reproduces #12304: Bot -> ProxyResource -> Resource, with location/tags owned by Bot.
            // A downstream generator maps ProxyResource to ResourceData, while the last public
            // contract derives from TrackedResourceData. Do not make location required to restore its constructor.
            var resource = InputFactory.Model("Resource", properties:
            [
                InputFactory.Property("id", InputPrimitiveType.String, isReadOnly: true),
                InputFactory.Property("name", InputPrimitiveType.String,
                    isRequired: duplicateNameVariant == "weaken-requiredness", isReadOnly: true,
                    defaultValue: duplicateNameVariant == "ancestor-default" ? InputFactory.Constant.String("default") : null,
                    serializationOptions: includeChildName ? InputFactory.Serialization.Options(json: InputFactory.Serialization.Json("name")) : null,
                    apiVersions: includeChildName ? ["v3", "v4"] : null),
                InputFactory.Property("type", InputPrimitiveType.String, isReadOnly: true),
                .. duplicateNameVariant == "same-ancestor" ? new[] { InputFactory.Property("name", InputPrimitiveType.String,
                    isReadOnly: true, serializationOptions: InputFactory.Serialization.Options(json: InputFactory.Serialization.Json("name"))) } : [],
            ]);
            var proxyResource = InputFactory.Model("ProxyResource", properties:
                includeIntermediateHttpName
                    ? [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, isReadOnly: true,
                        isHttpMetadata: true, serializationOptions: InputFactory.Serialization.Options(json: InputFactory.Serialization.Json("name")))]
                    : [], baseModel: resource);
            var locationType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "azureLocation", "Azure.Core.azureLocation");
            var bot = InputFactory.Model("BotData", baseModel: proxyResource, properties:
            [
                InputFactory.Property("location", incompatibleLocationType ? InputPrimitiveType.Int32 : locationType,
                    isRequired: false, isReadOnly: readOnlyLocation),
                InputFactory.Property("tags", InputFactory.Dictionary(InputPrimitiveType.String),
                    isRequired: false, isReadOnly: readOnlyTags),
                .. includeChildName ? new[] { InputFactory.Property(
                    duplicateNameVariant == "different-raw-name" ? "Name" : "name", InputPrimitiveType.String,
                    isRequired: duplicateNameVariant != "weaken-requiredness", isReadOnly: true,
                    isHttpMetadata: childNameIsHttpMetadata,
                    isApiVersion: duplicateNameVariant == "api-version", wireName: childNameWire ?? "name",
                    serializationOptions: InputFactory.Serialization.Options(json: InputFactory.Serialization.Json(
                        duplicateNameVariant == "serialization" ? "differentName" : "name"))) } : [],
                .. duplicateNameVariant == "same-owner" ? new[] { InputFactory.Property("name", InputPrimitiveType.String,
                    isRequired: true, isReadOnly: true, serializationOptions: InputFactory.Serialization.Options(json: InputFactory.Serialization.Json("name"))) } : [],
            ]);
            if (includeChildName)
            {
                var childName = bot.Properties.First(property => property.Name is "name" or "Name");
                typeof(InputProperty).GetProperty(nameof(InputProperty.Decorators))!.GetSetMethod(true)!
                    .Invoke(childName, [new[] { new InputDecoratorInfo("TypeSpec.@pattern", null) }]);
                if (duplicateNameVariant == "visibility")
                {
                    childName.Update(visibility: InputVisibility.Read);
                }
                if (duplicateNameVariant == "ancestor-decorator")
                {
                    var ancestorName = resource.Properties.Single(property => property.Name == "name");
                    typeof(InputProperty).GetProperty(nameof(InputProperty.Decorators))!.GetSetMethod(true)!
                        .Invoke(ancestorName, [new[] { new InputDecoratorInfo("TypeSpec.@pattern", null) }]);
                }
            }
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
                    if (cacheNameOwners && (input == bot || input == resource))
                    {
                        CodeModelGenerator.Instance.TypeFactory.CreateProperty(input.Properties.Single(property => property.Name == "name"), provider);
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
                    var validReadOnly = input.Name.ToLowerInvariant() switch
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

            // Same-owner duplicate names are invalid as a full output model, but the base
            // projection must still reject them without relying on model-factory construction.
            var model = duplicateNameVariant is "same-owner" or "same-ancestor"
                ? CodeModelGenerator.Instance.TypeFactory.CreateModel(bot)!
                : CodeModelGenerator.Instance.OutputLibrary.TypeProviders
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

namespace Microsoft.TypeSpec.Generator.Tests.Providers.RestorationFramework
{
    // These stand-ins include a full framework constructor for the read-only ancestor properties.
    // Keep them separate from the constructor-shape fixtures below.
    public readonly struct ResourceLocation
    {
        public ResourceLocation(int value) => Value = value;
        public int Value { get; }
    }

    public class ResourceData
    {
        protected ResourceData() { }
        protected ResourceData(string id, string name, string type)
        {
            Id = id;
            Name = name;
            Type = type;
        }

        public string Id { get; } = string.Empty;
        public string Name { get; } = string.Empty;
        public string Type { get; } = string.Empty;
    }

    public class TrackedResourceData : ResourceData
    {
        protected TrackedResourceData() { }
        public TrackedResourceData(ResourceLocation location)
        {
            Location = location;
            Tags = new Dictionary<string, string>();
        }
        protected TrackedResourceData(string id, string name, string type, IDictionary<string, string> tags, ResourceLocation location)
            : base(id, name, type)
        {
            Tags = tags;
            Location = location;
        }

        public ResourceLocation Location { get; set; }
        public IDictionary<string, string> Tags { get; } = null!;
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
