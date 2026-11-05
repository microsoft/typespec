// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class ModelProviderSnippets
    {
        public static ValueExpression GetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, IReadOnlyList<string> propertySegments)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments, out _, out _);
        }

        /// <summary>
        /// Builds a property-access expression for the given segment path and also returns the leaf
        /// <see cref="PropertyProvider"/> so callers can inspect its type (e.g. to apply enum serialization).
        /// </summary>
        public static ValueExpression GetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, IReadOnlyList<string> propertySegments, out PropertyProvider leafProperty)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments, out leafProperty, out _);
        }

        /// <summary>
        /// Builds a property-access expression, optionally requiring each segment to match its input property.
        /// </summary>
        public static ValueExpression GetPropertyExpression(this ModelProvider model, ValueExpression modelVariable,
            IReadOnlyList<string> propertySegments, out PropertyProvider leafProperty, bool requireInputName)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments, out leafProperty, out _, requireInputName);
        }

        /// <summary>
        /// Builds a property-access expression and reports whether an intermediate null-conditional access was emitted.
        /// </summary>
        public static ValueExpression GetPropertyExpression(this ModelProvider model, ValueExpression modelVariable,
            IReadOnlyList<string> propertySegments, out PropertyProvider leafProperty, out bool hasConditionalAccess, bool requireInputName)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments, out leafProperty, out hasConditionalAccess, requireInputName);
        }

        public static AssignmentExpression SetPropertyExpression(this ModelProvider model, ValueExpression modelVariable, ValueExpression value, IReadOnlyList<string> propertySegments)
        {
            return model.BuildPropertyAccessExpression(modelVariable, propertySegments, out _, out _).Assign(value);
        }

        private static ValueExpression BuildPropertyAccessExpression(this ModelProvider model, ValueExpression modelVariable,
            IReadOnlyList<string> propertySegments, out PropertyProvider leafProperty, out bool hasConditionalAccess, bool requireInputName = false)
        {
            ModelProvider currentModel = model;
            ValueExpression propertyAccessExpression = modelVariable;
            PropertyProvider? property = null;
            hasConditionalAccess = false;

            for (int i = 0; i < propertySegments.Count; i++)
            {
                property = FindPropertyInModelHierarchy(currentModel, propertySegments[i], requireInputName);
                var hasCovariantOverride = requireInputName && EnsureInheritedPropertyIsNotHidden(currentModel, property);

                propertyAccessExpression = propertyAccessExpression.Property(property.Name);

                if (i < propertySegments.Count - 1)
                {
                    // A covariant override changes the C# type of the access. Navigate through
                    // the source property's type so later segments do not bind to hidden members.
                    if (hasCovariantOverride)
                    {
                        propertyAccessExpression = propertyAccessExpression.CastTo(property.Type.WithNullable(false));
                    }
                    if (NeedsNullableConditional(property))
                    {
                        propertyAccessExpression = propertyAccessExpression.NullConditional();
                        hasConditionalAccess = true;
                    }
                    currentModel = CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap[property.Type] as ModelProvider
                        ?? throw new System.InvalidOperationException($"Cannot navigate the property path through '{property.Name}' because its type is not a model.");
                }
            }

            leafProperty = property
                ?? throw new System.InvalidOperationException("Cannot build a property-access expression from an empty segment path.");
            return propertyAccessExpression;
        }

        /// <summary>
        /// Searches for a property in the model and its base models by matching either the
        /// property's serialized (wire) name or its client name. Method-parameter segments carry
        /// the client name, which can differ from the wire name (e.g. <c>@query("band_index") bandIndex</c>).
        /// </summary>
        private static PropertyProvider FindPropertyInModelHierarchy(ModelProvider model, string segmentName, bool requireInputName)
        {
            if (requireInputName)
            {
                return FindInputPropertyInModelHierarchy(model, segmentName);
            }

            // Properties may only be populated on the canonical view at this stage.
            var properties = model.CanonicalView.Properties;

            // Try to find the property by wire name, then by client name (segments carry the
            // camelCase client name; the C# property name is PascalCase).
            var property = properties.FirstOrDefault(p => p.WireInfo?.SerializedName == segmentName)
                ?? properties.FirstOrDefault(p => p.InputProperty?.Name == segmentName)
                ?? properties.FirstOrDefault(p => string.Equals(p.Name, segmentName, System.StringComparison.OrdinalIgnoreCase));
            if (property != null)
            {
                return property;
            }

            // If not found, search in the base model hierarchy
            if (model.BaseModelProvider != null)
            {
                return FindPropertyInModelHierarchy(model.BaseModelProvider, segmentName, requireInputName: false);
            }

            // If not found anywhere, throw an exception with a helpful message
            throw new System.InvalidOperationException(
                $"Property with name '{segmentName}' not found in model '{model.Name}' or its base models.");
        }

        private static PropertyProvider FindInputPropertyInModelHierarchy(ModelProvider model, string segmentName)
        {
            InputModelProperty? source = null;
            var visitedInputs = new HashSet<InputModelType>(ReferenceEqualityComparer.Instance);
            for (InputModelType? current = model.InputModel; current is not null && visitedInputs.Add(current); current = current.BaseModel)
            {
                var matches = current.Properties.Where(property => property.Name == segmentName).ToArray();
                if (matches.Length > 1)
                {
                    throw new System.InvalidOperationException($"Ambiguous input property '{segmentName}' in model '{current.Name}'.");
                }
                if (matches is [var match])
                {
                    source = match;
                    break;
                }
            }
            if (source is null)
            {
                throw new System.InvalidOperationException($"Input property '{segmentName}' was not found in model '{model.Name}' or its input base models.");
            }

            var properties = new HashSet<PropertyProvider>(ReferenceEqualityComparer.Instance);
            var visitedModels = new HashSet<ModelProvider>(ReferenceEqualityComparer.Instance);
            for (ModelProvider? current = model; current is not null && visitedModels.Add(current); current = current.BaseModelProvider)
            {
                // An explicit custom replacement is the intended output owner of an external
                // base property, even though the framework provider still exposes that input.
                var replacements = current.ExternalPropertyReplacements
                    .Where(property => ReferenceEquals(property.InputProperty, source)).ToArray();
                if (replacements.Length > 1)
                {
                    throw new System.InvalidOperationException($"Input property '{segmentName}' in model '{model.Name}' has ambiguous custom replacements.");
                }
                if (replacements is [var replacement])
                {
                    return replacement;
                }
                foreach (var property in current.CanonicalView.Properties.Where(property => ReferenceEquals(property.InputProperty, source)))
                {
                    properties.Add(property);
                }
                if (current is SystemObjectModelProvider mappedBase)
                {
                    foreach (var alias in mappedBase.GetMappedHttpMetadataProperties().Where(alias => ReferenceEquals(alias.Metadata, source)))
                    {
                        properties.Add(alias.Property);
                    }
                }
            }
            return properties.Count switch
            {
                1 => properties.Single(),
                0 => throw new System.InvalidOperationException($"Input property '{segmentName}' in model '{model.Name}' has no accessible property mapping."),
                _ => throw new System.InvalidOperationException($"Input property '{segmentName}' in model '{model.Name}' has ambiguous property mappings."),
            };
        }

        private static bool EnsureInheritedPropertyIsNotHidden(ModelProvider model, PropertyProvider property)
        {
            var hasCovariantOverride = false;
            var visited = new HashSet<ModelProvider>(ReferenceEqualityComparer.Instance);
            for (ModelProvider? current = model; current is not null && visited.Add(current); current = current.BaseModelProvider)
            {
                var properties = current.CanonicalView.Properties;
                if (properties.Any(candidate => ReferenceEquals(candidate, property)) &&
                    (ReferenceEquals(property.EnclosingType, current) || ReferenceEquals(property.EnclosingType, current.CustomCodeView)))
                {
                    var readable = !property.Modifiers.HasFlag(MethodSignatureModifiers.Static) && property.ExplicitInterface is null &&
                        (current is SystemObjectModelProvider mappedBase
                            ? property.Modifiers.HasFlag(MethodSignatureModifiers.Public) && HasPublicFrameworkGetter(mappedBase, property.Name)
                            : property.EnclosingType is NamedTypeSymbolProvider customOwner
                                ? customOwner.HasReadableInstancePropertyInSameAssembly(property.Name)
                                : property.Modifiers.HasFlag(MethodSignatureModifiers.Public) ||
                                    (property.Modifiers.HasFlag(MethodSignatureModifiers.Internal) && !property.Modifiers.HasFlag(MethodSignatureModifiers.Private)));
                    if (!readable)
                    {
                        throw new System.InvalidOperationException($"Property '{property.Name}' is not accessible to the client.");
                    }
                    return hasCovariantOverride;
                }

                var sameNameProperties = properties.Where(candidate => candidate.Name == property.Name && !ReferenceEquals(candidate, property)).ToArray();
                var validOverrides = sameNameProperties.Length > 0 && sameNameProperties.All(candidate =>
                    candidate.Modifiers.HasFlag(MethodSignatureModifiers.Override));
                hasCovariantOverride |= validOverrides && sameNameProperties.Any(candidate => !candidate.Type.Equals(property.Type));
                if (sameNameProperties.Length > 0 && !validOverrides ||
                    current.CanonicalView.Fields.Any(field => field.Name == property.Name))
                {
                    throw new System.InvalidOperationException($"Inherited property '{property.Name}' is hidden in model '{current.Name}'.");
                }

                if (current.CustomCodeView is NamedTypeSymbolProvider custom &&
                    custom.DeclaredMemberNames.Contains(property.Name, System.StringComparer.Ordinal))
                {
                    var customProperties = custom.Properties.Where(candidate => candidate.Name == property.Name).ToArray();
                    var onlyValidOverride = customProperties.Length > 0 && customProperties.All(candidate =>
                        candidate.Modifiers.HasFlag(MethodSignatureModifiers.Override));
                    hasCovariantOverride |= onlyValidOverride && customProperties.Any(candidate => !candidate.Type.Equals(property.Type));
                    if (!onlyValidOverride || custom.Fields.Any(field => field.Name == property.Name) ||
                        custom.Methods.Any(method => method.Signature.Name == property.Name))
                    {
                        throw new System.InvalidOperationException($"Inherited property '{property.Name}' is hidden in model '{current.Name}'.");
                    }
                }
            }
            throw new System.InvalidOperationException($"The declaring model for property '{property.Name}' could not be resolved from '{model.Name}'.");
        }

        private static bool HasPublicFrameworkGetter(SystemObjectModelProvider mappedBase, string name)
        {
            if (!mappedBase.SystemType.IsFrameworkType)
            {
                return false;
            }
            // Examine the exposed property/accessor contract only; do not inspect method bodies.
            var properties = mappedBase.SystemType.FrameworkType.GetProperties(BindingFlags.Instance | BindingFlags.Public)
                .Where(property => property.Name == name).ToArray();
            return properties is [var property] && property.GetIndexParameters().Length == 0 &&
                property.GetMethod is { IsPublic: true, IsStatic: false };
        }

        private static bool NeedsNullableConditional(PropertyProvider property)
        {
            return !property.Type.IsValueType || property.InputProperty?.Type is InputNullableType;
        }
    }
}
