// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// The deliberately narrow member contract used to prove a restored base is safe.
    /// Unrepresentable defaults and generic method constraints are not reconciled.
    /// </summary>
    internal static class ModelBaseMemberCompatibility
    {
        public static bool AreTypesCompatible(CSharpType previous, CSharpType current)
            => previous.AreNamesEqual(current) && previous.IsValueType == current.IsValueType &&
                previous.IsEnum == current.IsEnum &&
                (!previous.IsValueType || previous.IsNullable == current.IsNullable) &&
                previous.Arguments.Zip(current.Arguments).All(pair => AreTypesCompatible(pair.First, pair.Second));

        public static bool ArePropertiesCompatible(PropertyProvider previous, PropertyProvider current)
            => !previous.HasUnsupportedBaseContract && !current.HasUnsupportedBaseContract &&
                !previous.IsRef && !current.IsRef && AreTypesCompatible(previous.Type, current.Type) &&
                previous.Modifiers == current.Modifiers &&
                previous.Body.HasSetter == current.Body.HasSetter &&
                previous.IsInitOnly == current.IsInitOnly &&
                (!previous.Body.HasSetter || GetSetterModifiers(previous) == GetSetterModifiers(current));

        private static MethodSignatureModifiers GetSetterModifiers(PropertyProvider property)
        {
            var modifiers = property.Body switch
            {
                AutoPropertyBody body => body.SetterModifiers,
                MethodPropertyBody body => body.SetterModifiers,
                _ => MethodSignatureModifiers.None
            };
            return modifiers == MethodSignatureModifiers.None ? property.Modifiers & Accessibility : modifiers & Accessibility;
        }

        private const MethodSignatureModifiers Accessibility = MethodSignatureModifiers.Public |
            MethodSignatureModifiers.Protected | MethodSignatureModifiers.Internal | MethodSignatureModifiers.Private;

        public static bool AreParametersCompatible(ParameterProvider previous, ParameterProvider current)
            => previous.Name == current.Name &&
                AreTypesCompatible(previous.Type, current.Type) &&
                previous.IsRef == current.IsRef && previous.IsIn == current.IsIn && previous.IsOut == current.IsOut &&
                previous.IsParams == current.IsParams &&
                !previous.HasUnsupportedParameterModifiers && !current.HasUnsupportedParameterModifiers &&
                !previous.HasUnsupportedDefaultValue && !current.HasUnsupportedDefaultValue &&
                (previous.DefaultValue is null ||
                    TryGetDefaultValue(previous, out var previousValue) &&
                    TryGetDefaultValue(current, out var currentValue) && Equals(previousValue, currentValue));

        public static bool HasCompatibleDefaultValue(ParameterProvider previous, ParameterInfo current)
            => !previous.HasUnsupportedParameterModifiers && !previous.HasUnsupportedDefaultValue &&
                (previous.DefaultValue is null || current.IsOptional && current.HasDefaultValue &&
                    TryGetDefaultValue(previous, out var value) && Equals(value, current.DefaultValue));

        private static bool TryGetDefaultValue(ParameterProvider parameter, out object? value)
        {
            var expression = parameter.DefaultValue;
            while (expression is ScopedApi scoped)
            {
                expression = scoped.Original;
            }
            if (expression is LiteralExpression literal)
            {
                value = literal.Literal;
                return true;
            }
            if (expression == Snippet.True.Original || expression == Snippet.False.Original)
            {
                value = expression == Snippet.True.Original;
                return true;
            }
            if (expression == Snippet.Null && (!parameter.Type.IsValueType || parameter.Type.IsNullable))
            {
                value = null;
                return true;
            }
            if (expression == Snippet.Default)
            {
                if (!parameter.Type.IsValueType || parameter.Type.IsNullable)
                {
                    value = null;
                    return true;
                }
                if (parameter.Type.IsFrameworkType && parameter.Type.FrameworkType.IsPrimitive)
                {
                    value = Activator.CreateInstance(parameter.Type.FrameworkType);
                    return true;
                }
            }
            value = null;
            return false;
        }
    }
}
