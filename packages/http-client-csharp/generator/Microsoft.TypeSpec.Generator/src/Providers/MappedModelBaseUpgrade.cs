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
            HashSet<PropertyProvider>? matchedProperties = null;
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

                    if (!(matchedProperties ??= []).Add(match) ||
                        !PreservesSourceOwnerProperty(owner, property, match))
                    {
                        return false;
                    }
                    (properties ??= []).Add(property);
                }
            }

            provider = new SystemObjectModelProvider(candidateType, inputBase, historicalBase, properties ?? [], isMappedBaseUpgrade: true);
            return true;
        }

        private static bool PreservesSourceOwnerProperty(ModelProvider owner, InputModelProperty input,
            PropertyProvider historicalProperty)
        {
            var factory = CodeModelGenerator.Instance.TypeFactory;
            // Honor cached visitor results, including removals, without populating the cache during
            // potentially recursive property conversion.
            var current = factory.PropertyCache.TryGetValue(input, out var cached)
                ? cached
                : factory.CreateUncachedProperty(input, owner);
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
            return PropertyProvider.TryCreate(input, owner, out var unvisited) &&
                unvisited is not null && current.Type.Equals(unvisited.Type) &&
                current.Modifiers == unvisited.Modifiers && current.IsInitOnly == unvisited.IsInitOnly &&
                current.Body is AutoPropertyBody currentBody && unvisited.Body is AutoPropertyBody unvisitedBody &&
                currentBody.HasSetter == unvisitedBody.HasSetter &&
                currentBody.SetterModifiers == unvisitedBody.SetterModifiers;
        }

        private static bool HasCustomAlias(ModelProvider owner, InputModelProperty input, string generatedName, string inheritedName)
        {
            if (owner.CustomCodeView is not { } custom)
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
                    property.IsInitOnly || !ModelProvider.HasAccessibleInheritedSetter(property) &&
                        !candidate.CanPopulateInheritedCollection(property)))
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
                        if (!inherited.OfType<EventInfo>().Any(previous => OverridesEvent(currentEvent, previous)))
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
                        inherited.OfType<EventInfo>().Any(previous => OverridesEvent(declaredEvent, previous)))
                    {
                        continue;
                    }

                    // Inheritance retains the ancestor's API unless a nearer declaration hides it.
                    // Permit real overrides, but not new overloads or same-name members that change binding.
                    var method = member switch
                    {
                        MethodInfo value => value,
                        PropertyInfo value => value.GetMethod,
                        _ => null,
                    };
                    if (method is not { IsVirtual: true } || method.GetBaseDefinition() == method ||
                        !inherited.Any(previous => previous switch
                        {
                            MethodInfo value => value.GetBaseDefinition() == method.GetBaseDefinition(),
                            PropertyInfo value => value.GetMethod?.GetBaseDefinition() == method.GetBaseDefinition(),
                            _ => false,
                        }))
                    {
                        return false;
                    }
                }
            }
            return true;
        }

        private static bool OverridesEvent(EventInfo current, EventInfo previous)
            => OverridesAccessor(current.AddMethod, previous.AddMethod) &&
                OverridesAccessor(current.RemoveMethod, previous.RemoveMethod);

        private static bool OverridesAccessor(MethodInfo? current, MethodInfo? previous)
            => current is { IsVirtual: true } && previous is not null &&
                current.GetBaseDefinition() != current &&
                current.GetBaseDefinition() == previous.GetBaseDefinition();

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
