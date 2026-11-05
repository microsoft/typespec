// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cspell:ignore Assem

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Reflection;
using System.Runtime.CompilerServices;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Reconciles input ownership when a historical framework base retains the currently mapped CLR base.
    /// The projection is local to the restored model; neither input models nor cached providers are changed.
    /// </summary>
    internal static class MappedModelBaseUpgrade
    {
        internal static bool IsDerivedFromCurrentMappedBase(ModelProvider model, CSharpType candidateType)
            => model.InputModel.BaseModel is { } inputBase &&
                CodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase) is SystemObjectModelProvider current &&
                current.SystemType.IsFrameworkType && candidateType.IsFrameworkType &&
                current.SystemType.FrameworkType != typeof(object) &&
                current.SystemType.FrameworkType != candidateType.FrameworkType &&
                current.SystemType.FrameworkType.IsAssignableFrom(candidateType.FrameworkType);

        internal static bool TryCreate(
            ModelProvider model,
            CSharpType candidateType,
            TypeProvider historicalBase,
            [NotNullWhen(true)] out SystemObjectModelProvider? provider)
        {
            provider = null;
            if (model.InputModel.BaseModel is not { } inputBase)
            {
                return false;
            }
            var historical = new SystemObjectModelProvider(candidateType, inputBase, historicalBase, [], isMappedBaseUpgrade: true);
            if (!MappedModelBaseCompatibility.IsSupportedModelBase(historical))
            {
                return false;
            }

            var factory = CodeModelGenerator.Instance.TypeFactory;
            var historicalProperties = historical.Properties;
            List<InputModelProperty>? properties = null;
            List<(InputModelProperty Metadata, int Index)>? httpMetadataSlots = null;
            Dictionary<PropertyProvider, (InputModelProperty Property, PropertyProvider Source, PropertyProvider Unvisited, int Index)>? matchedProperties = null;
            var visited = new HashSet<InputModelType>();
            for (var input = model.InputModel; input is not null; input = input.BaseModel)
            {
                if (!visited.Add(input))
                {
                    return false;
                }
                var owner = ReferenceEquals(input, model.InputModel) ? model : factory.CreateModel(input);
                if (owner is null)
                {
                    return false;
                }
                HashSet<PropertyProvider>? matchedInOwner = null;
                foreach (var property in input.Properties)
                {
                    if (!MappedModelBaseCompatibility.TryMatchHistoricalProperty(
                        candidateType, property, historicalProperties, out var match))
                    {
                        return false;
                    }
                    if (match is null)
                    {
                        continue;
                    }

                    matchedInOwner ??= new(ReferenceEqualityComparer.Instance);
                    if (!matchedInOwner.Add(match) ||
                        !PreservesSourceOwnerProperty(owner, property, match, out var sourceProperty, out var unvisitedProperty))
                    {
                        return false;
                    }

                    matchedProperties ??= new(ReferenceEqualityComparer.Instance);
                    if (matchedProperties.TryGetValue(match, out var effective))
                    {
                        // A path-only child declaration must not replace the ancestor's payload
                        // metadata. Otherwise keep the nearest declaration in the derived-to-base walk.
                        bool useInheritedPayload = effective.Property.IsHttpMetadata && !property.IsHttpMetadata;
                        if (!PreservesSourceOwnerDetails(effective.Source, effective.Unvisited) ||
                            !PreservesSourceOwnerDetails(sourceProperty, unvisitedProperty) ||
                            !AreCompatibleReadOnlyDeclarations(effective.Property, property, useInheritedPayload))
                        {
                            return false;
                        }
                        if (property.IsHttpMetadata)
                        {
                            (httpMetadataSlots ??= []).Add((property, effective.Index));
                        }
                        if (useInheritedPayload)
                        {
                            properties![effective.Index] = property;
                            matchedProperties[match] = (property, sourceProperty, unvisitedProperty, effective.Index);
                        }
                        continue;
                    }
                    properties ??= [];
                    if (property.IsHttpMetadata)
                    {
                        (httpMetadataSlots ??= []).Add((property, properties.Count));
                    }
                    matchedProperties.Add(match, (property, sourceProperty, unvisitedProperty, properties.Count));
                    properties.Add(property);
                }
            }

            // This model-local projection must not replace the input-keyed TypeFactory provider:
            // other children still use its current mapping and source-owned property cache.
            var httpMetadataAliases = httpMetadataSlots?.Select(slot => (slot.Metadata, Projected: properties![slot.Index])).ToArray();
            provider = new SystemObjectModelProvider(candidateType, inputBase, historicalBase, properties ?? [],
                isMappedBaseUpgrade: true, httpMetadataAliases: httpMetadataAliases);
            return true;
        }

        private static bool AreCompatibleReadOnlyDeclarations(
            InputModelProperty effective, InputModelProperty inherited, bool ignoreHttpMetadata)
            => effective.IsReadOnly && inherited.IsReadOnly &&
                // A descendant may strengthen an optional ancestor, but must not weaken it.
                (effective.IsRequired || !inherited.IsRequired) &&
                effective.Name == inherited.Name &&
                string.Equals(effective.SerializedName, inherited.SerializedName, StringComparison.Ordinal) &&
                effective.IsApiVersion == inherited.IsApiVersion &&
                effective.Access == inherited.Access && effective.DefaultValue is null && inherited.DefaultValue is null &&
                effective.Experimental is null && inherited.Experimental is null && inherited.Decorators.Count == 0 &&
                MappedModelBaseCompatibility.AreMappedPropertyShapesCompatible(effective, inherited,
                    ignoreRequiredness: true, ignoreHttpMetadata: ignoreHttpMetadata);

        private static bool PreservesSourceOwnerProperty(ModelProvider owner, InputModelProperty input,
            PropertyProvider historicalProperty, [NotNullWhen(true)] out PropertyProvider? current,
            [NotNullWhen(true)] out PropertyProvider? unvisited)
        {
            unvisited = null;
            // Honor cached visitor results, including removals, without populating the cache during
            // potentially recursive property conversion.
            current = CodeModelGenerator.Instance.TypeFactory.PropertyCache.TryGetValue(input, out var cached)
                ? cached
                : CodeModelGenerator.Instance.TypeFactory.CreateUncachedProperty(input, owner);
            if (current is null || owner.IsPropertySuppressed(current) ||
                current.Name != historicalProperty.Name ||
                HasCustomAlias(owner, input, current.Name, historicalProperty.Name))
            {
                return false;
            }

            // Projection recreates the property under the framework owner and restores its shipped
            // CLR shape. Reject source-owner factory/visitor changes that this process would discard.
            // Compare to the unvisited source property, not the historical member: ordinary input
            // properties can legitimately have a different shape from their mapped CLR counterparts.
            return PropertyProvider.TryCreate(input, owner, out unvisited) &&
                unvisited is not null && PreservesSourceType(current, unvisited, historicalProperty) &&
                PreservesSourceParameterMetadata(current, unvisited) &&
                current.Modifiers == unvisited.Modifiers && current.IsInitOnly == unvisited.IsInitOnly &&
                current.Body is AutoPropertyBody currentBody && unvisited.Body is AutoPropertyBody unvisitedBody &&
                currentBody.HasSetter == unvisitedBody.HasSetter &&
                currentBody.SetterModifiers == unvisitedBody.SetterModifiers &&
                Equals(currentBody.InitializationExpression, unvisitedBody.InitializationExpression) &&
                (current.WireInfo is { } wireInfo
                    ? wireInfo.IsEquivalentTo(unvisited.WireInfo)
                    : unvisited.WireInfo is null);
        }

        private static bool PreservesSourceType(PropertyProvider current, PropertyProvider unvisited, PropertyProvider historicalProperty)
        {
            if (current.Type.Equals(unvisited.Type))
            {
                return true;
            }

            // A source-owner normalization is not lost when the projected property has exactly
            // the same historical CLR type. Keep every other owner-specific change as a veto.
            return current.Type.Equals(historicalProperty.Type) && PreservesSourceOwnerDetails(current, unvisited);
        }

        private static bool PreservesSourceOwnerDetails(PropertyProvider current, PropertyProvider unvisited)
            => current.IsRef == unvisited.IsRef && current.IsDiscriminator == unvisited.IsDiscriminator &&
                current.IsAdditionalProperties == unvisited.IsAdditionalProperties &&
                Equals(current.ExplicitInterface, unvisited.ExplicitInterface) &&
                ReferenceEquals(current.BackingField, unvisited.BackingField) &&
                ReferenceEquals(current.BaseProperty, unvisited.BaseProperty) &&
                current.OriginalName == unvisited.OriginalName &&
                current.Attributes.Count == 0 && unvisited.Attributes.Count == 0 &&
                current.Suppressions.Count == 0 && unvisited.Suppressions.Count == 0 &&
                PreservesSourceParameterMetadata(current, unvisited) &&
                HasEquivalentSourceDocs(current, unvisited);

        private static bool PreservesSourceParameterMetadata(PropertyProvider current, PropertyProvider unvisited)
        {
            // A description can be changed without materializing the lazy parameter. Do not create
            // a parameter on the shared source property merely to inspect its metadata.
            if (!string.Equals(current.CustomDescription?.ToString(), unvisited.CustomDescription?.ToString(), StringComparison.Ordinal))
            {
                return false;
            }
            if (current.CachedParameter is not { } parameter)
            {
                return true;
            }
            var original = unvisited.AsParameter;
            return HasEquivalentParameterMetadata(parameter, original, current, unvisited, isPublicVariant: false) &&
                (parameter.CachedPublicInputParameter is not { } publicVariant ||
                    HasEquivalentParameterMetadata(publicVariant, original.ToPublicInputParameter(), current, unvisited, isPublicVariant: true));
        }

        private static bool HasEquivalentParameterMetadata(ParameterProvider parameter, ParameterProvider original,
            PropertyProvider current, PropertyProvider unvisited, bool isPublicVariant)
        {
            var currentType = isPublicVariant ? current.Type.InputType : current.Type;
            var originalType = isPublicVariant ? unvisited.Type.InputType : unvisited.Type;
            return parameter.Name == current.Name.ToVariableName() && original.Name == unvisited.Name.ToVariableName() &&
                parameter.Type.Equals(currentType) && original.Type.Equals(originalType) &&
                string.Equals(parameter.Description.ToString(), original.Description.ToString(), StringComparison.Ordinal) &&
                parameter.IsRef == original.IsRef && parameter.IsOut == original.IsOut &&
                parameter.IsIn == original.IsIn && parameter.IsParams == original.IsParams &&
                parameter.IsExactName == original.IsExactName &&
                parameter.HasUnsupportedDefaultValue == original.HasUnsupportedDefaultValue &&
                parameter.HasUnsupportedParameterModifiers == original.HasUnsupportedParameterModifiers &&
                parameter.DefaultValue is null && original.DefaultValue is null &&
                parameter.InitializationValue is null && original.InitializationValue is null &&
                parameter.Attributes.Count == 0 && original.Attributes.Count == 0 &&
                ReferenceEquals(parameter.Property, current) && ReferenceEquals(original.Property, unvisited) &&
                parameter.Field is null && original.Field is null &&
                parameter.InputParameter is null && original.InputParameter is null &&
                parameter.SpreadSource is null && original.SpreadSource is null &&
                parameter.Location == original.Location && parameter.Validation == original.Validation &&
                parameter.WireInfo.SerializedName == parameter.Name && original.WireInfo.SerializedName == original.Name &&
                parameter.WireInfo.SerializationFormat == original.WireInfo.SerializationFormat;
        }

        private static bool HasEquivalentSourceDocs(PropertyProvider current, PropertyProvider unvisited)
        {
            if (!string.Equals(current.Description?.ToString(), unvisited.Description?.ToString(), StringComparison.Ordinal))
            {
                return false;
            }
            if (current.XmlDocs is not { } currentDocs)
            {
                return unvisited.XmlDocs is null;
            }
            if (unvisited.XmlDocs is not { } unvisitedDocs)
            {
                return false;
            }
            return currentDocs.Summary?.ToDisplayString() == unvisitedDocs.Summary?.ToDisplayString() &&
                currentDocs.Parameters.Select(item => item.ToDisplayString()).SequenceEqual(unvisitedDocs.Parameters.Select(item => item.ToDisplayString())) &&
                currentDocs.Exceptions.Select(item => item.ToDisplayString()).SequenceEqual(unvisitedDocs.Exceptions.Select(item => item.ToDisplayString())) &&
                currentDocs.Returns?.ToDisplayString() == unvisitedDocs.Returns?.ToDisplayString() &&
                currentDocs.Inherit?.ToDisplayString() == unvisitedDocs.Inherit?.ToDisplayString();
        }

        private static bool HasCustomAlias(ModelProvider owner, InputModelProperty input, string generatedName, string inheritedName)
        {
            if (owner.CustomCodeView is not { } custom ||
                custom.Properties.Count == 0 && custom.Fields.Count == 0)
            {
                return false;
            }
            var identities = new HashSet<string>(StringComparer.Ordinal)
            {
                input.Name, MappedModelBaseCompatibility.GetInputPropertyClrName(input), generatedName,
            };
            return custom.Properties.Select(property => (property.Name, property.OriginalName))
                .Concat(custom.Fields.Select(field => (field.Name, field.OriginalName)))
                .Any(member => member.Name != inheritedName && member.OriginalName is { } original &&
                    (identities.Contains(original) || identities.Contains(original.ToIdentifierName())));
        }

        internal static bool CanReplaceCurrentBase(ModelProvider model, SystemObjectModelProvider candidate)
        {
            if (model.InputModel.BaseModel is not { } inputBase ||
                !IsDerivedFromCurrentMappedBase(model, candidate.SystemType) ||
                CodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase) is not SystemObjectModelProvider current ||
                !PreservesFrameworkMembers(current.SystemType.FrameworkType, candidate.SystemType.FrameworkType) ||
                candidate.GetAdditionalSerializationProperties().Any(property =>
                    property.IsInitOnly || !ModelProvider.HasAccessibleInheritedSetter(property)))
            {
                return false;
            }

            var visited = new HashSet<InputModelType>();
            for (var input = model.InputModel.BaseModel; input is not null; input = input.BaseModel)
            {
                if (!visited.Add(input) || input.External is not null || input.AdditionalProperties is not null ||
                    input.DiscriminatorProperty is not null || input.DiscriminatorValue is not null ||
                    CodeModelGenerator.Instance.TypeFactory.CreateModel(input)?.CustomCodeView is not null ||
                    !input.Properties.All(property => candidate.Properties.Any(previous =>
                        CodeModelGenerator.Instance.TypeFactory.IsLastContractModelBasePropertyCompatible(
                            candidate.SystemType, property, previous))))
                {
                    return false;
                }
            }
            return true;
        }

        private static bool PreservesFrameworkMembers(Type ancestor, Type candidate)
        {
            const BindingFlags flags = BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
            var ancestorMembers = ancestor.GetMembers(flags).Where(IsAccessible).ToLookup(member => member.Name);
            for (var type = candidate; type is not null && type != ancestor; type = type.BaseType)
            {
                foreach (var member in type.GetMembers(flags | BindingFlags.DeclaredOnly))
                {
                    var inherited = ancestorMembers[member.Name].ToArray();
                    if (inherited.Length == 0 || member is ConstructorInfo)
                    {
                        continue;
                    }

                    if (member is EventInfo currentEvent)
                    {
                        if (!inherited.Any(previous => OverridesMember(currentEvent, previous)))
                        {
                            return false;
                        }
                        continue;
                    }
                    // A field-like event override has a private synthesized field with the event's name.
                    // It is storage for the override, not a separately introduced hiding member.
                    if (member is FieldInfo { IsPrivate: true } field &&
                        field.IsDefined(typeof(CompilerGeneratedAttribute), inherit: false) &&
                        type.GetEvent(field.Name, flags | BindingFlags.DeclaredOnly) is { } declaredEvent &&
                        inherited.Any(previous => OverridesMember(declaredEvent, previous)))
                    {
                        continue;
                    }

                    // Inheritance retains the ancestor's API unless a nearer declaration hides it.
                    // Permit real overrides, but not new overloads or same-name members that change binding.
                    if (!inherited.Any(previous => OverridesMember(member, previous)))
                    {
                        return false;
                    }
                }
            }
            return true;
        }

        private static bool OverridesMember(MemberInfo? current, MemberInfo? previous)
            => (current, previous) switch
            {
                (EventInfo value, EventInfo original) =>
                    OverridesMember(value.AddMethod, original.AddMethod) &&
                    OverridesMember(value.RemoveMethod, original.RemoveMethod),
                (PropertyInfo value, PropertyInfo original) => OverridesMember(value.GetMethod, original.GetMethod),
                (MethodInfo { IsVirtual: true } value, MethodInfo original) =>
                    value.GetBaseDefinition() != value &&
                    value.GetBaseDefinition() == original.GetBaseDefinition(),
                _ => false,
            };

        private static bool IsAccessible(MemberInfo member) => member switch
        {
            MethodBase value => value.IsPublic || value.IsFamily || value.IsFamilyOrAssembly,
            PropertyInfo value => value.GetAccessors(nonPublic: true).Any(IsAccessible),
            FieldInfo value => value.IsPublic || value.IsFamily || value.IsFamilyOrAssembly,
            EventInfo value => value.AddMethod is not null && IsAccessible(value.AddMethod),
            Type value => value.IsNestedPublic || value.IsNestedFamily || value.IsNestedFamORAssem,
            _ => false,
        };
    }
}
