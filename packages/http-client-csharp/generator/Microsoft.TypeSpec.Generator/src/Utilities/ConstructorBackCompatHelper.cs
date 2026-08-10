// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Owns constructor-specific compatibility policy. Structural changes are planned before a
    /// constructor is materialized; late processing is limited to accessibility preservation.
    /// </summary>
    internal static class ConstructorBackCompatHelper
    {
        public static bool TryRestoreInitializationParameters(
            ModelProvider model,
            MethodSignatureModifiers currentModifiers,
            IReadOnlyList<ParameterProvider> currentParameters,
            out IReadOnlyList<ParameterProvider> restoredParameters)
        {
            restoredParameters = currentParameters;
            if (currentModifiers.HasFlag(MethodSignatureModifiers.Static)
                || (!MethodSignatureHelper.IsPublicApi(currentModifiers) && !IsPrivateProtected(currentModifiers))
                || model.LastContractView?.Constructors is not { Count: > 0 } previousConstructors)
            {
                return false;
            }

            IReadOnlyList<ParameterProvider>? candidate = null;
            foreach (var previousConstructor in previousConstructors)
            {
                if (!IsEligiblePreviousConstructor(model, previousConstructor)
                    || !TryCreateRestoredParameters(currentParameters, previousConstructor.Signature.Parameters, out var restored))
                {
                    continue;
                }

                // Multiple viable previous overloads make the intended contract ambiguous.
                if (candidate is not null)
                {
                    return false;
                }
                candidate = restored;
                candidate = restored;
            }

            if (candidate is null)
            {
                return false;
            }

            restoredParameters = candidate;
            for (int i = 0; i < currentParameters.Count; i++)
            {
                if (!string.Equals(currentParameters[i].Name, restoredParameters[i].Name, StringComparison.Ordinal)
                    || !ReferenceEquals(currentParameters[i], restoredParameters[i]))
                {
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Restored parameter '{restoredParameters[i].Name}' at position {i} on constructor '{model.Name}' from last contract (current generated name was '{currentParameters[i].Name}').",
                        BackCompatibilityChangeCategory.ParameterNamePreserved);
                }
            }

            return true;
        }

        public static IReadOnlyList<ConstructorProvider> ApplyLateCompatibility(
            TypeProvider type,
            IEnumerable<ConstructorProvider> originalConstructors)
        {
            List<ConstructorProvider> constructors = [.. originalConstructors];
            if (!type.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract)
                || type.LastContractView?.Constructors is not { Count: > 0 } previousConstructors)
            {
                return constructors;
            }

            foreach (var previousConstructor in previousConstructors)
            {
                if (!IsEligiblePreviousConstructor(type, previousConstructor))
                {
                    continue;
                }

                var currentConstructor = constructors.FirstOrDefault(c =>
                    IsPrivateProtected(c.Signature.Modifiers)
                    && HaveSameParameterIdentity(c.Signature.Parameters, previousConstructor.Signature.Parameters));
                if (currentConstructor is null)
                {
                    continue;
                }

                var restoredModifiers = previousConstructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)
                    ? MethodSignatureModifiers.Public
                    : MethodSignatureModifiers.Protected;
                currentConstructor.Signature.Update(modifiers: restoredModifiers);
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Promoted constructor '{type.Name}({string.Join(", ", currentConstructor.Signature.Parameters.Select(p => p.Type.ToString()))})' from 'private protected' to '{restoredModifiers.ToString().ToLowerInvariant()}' to match last contract.",
                    BackCompatibilityChangeCategory.ConstructorModifierPreserved);
            }

            return constructors;
        }

        public static bool IsEligiblePreviousConstructor(TypeProvider type, ConstructorProvider previousConstructor)
        {
            if (!MethodSignatureHelper.IsPublicApi(previousConstructor.Signature.Modifiers)
                || previousConstructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static))
            {
                return false;
            }

            return !IsRemovalAcceptedInBaseline(type, previousConstructor.Signature);
        }

        public static bool HaveSameParameterIdentity(
            IReadOnlyList<ParameterProvider> first,
            IReadOnlyList<ParameterProvider> second)
        {
            if (first.Count != second.Count)
            {
                return false;
            }

            for (int i = 0; i < first.Count; i++)
            {
                if (!HaveSameParameterIdentity(first[i], second[i]))
                {
                    return false;
                }
            }

            return true;
        }

        internal static bool TryCreateRestoredParameters(
            IReadOnlyList<ParameterProvider> currentParameters,
            IReadOnlyList<ParameterProvider> previousParameters,
            out IReadOnlyList<ParameterProvider> restoredParameters)
        {
            restoredParameters = currentParameters;
            if (currentParameters.Count != previousParameters.Count
                || previousParameters.Select(p => p.Name).Distinct(StringComparer.Ordinal).Count() != previousParameters.Count)
            {
                return false;
            }

            int matchingNameCount = previousParameters.Count(previous =>
                currentParameters.Any(current => string.Equals(current.Name, previous.Name, StringComparison.OrdinalIgnoreCase)));
            if (matchingNameCount != 0 && matchingNameCount != previousParameters.Count)
            {
                return false;
            }

            var orderedCurrentParameters = new ParameterProvider[currentParameters.Count];
            if (matchingNameCount == previousParameters.Count)
            {
                var used = new HashSet<ParameterProvider>(ReferenceEqualityComparer.Instance);
                for (int i = 0; i < previousParameters.Count; i++)
                {
                    var matches = currentParameters
                        .Where(current => !used.Contains(current)
                            && string.Equals(current.Name, previousParameters[i].Name, StringComparison.OrdinalIgnoreCase))
                        .Take(2)
                        .ToArray();
                    if (matches.Length != 1 || !HaveSameParameterIdentity(matches[0], previousParameters[i]))
                    {
                        return false;
                    }

                    orderedCurrentParameters[i] = matches[0];
                    used.Add(matches[0]);
                }
            }
            else
            {
                for (int i = 0; i < currentParameters.Count; i++)
                {
                    if (!HaveSameParameterIdentity(currentParameters[i], previousParameters[i]))
                    {
                        return false;
                    }

                    orderedCurrentParameters[i] = currentParameters[i];
                }
            }

            bool changed = orderedCurrentParameters
                .Where((parameter, i) =>
                    !ReferenceEquals(parameter, currentParameters[i])
                    || !string.Equals(parameter.Name, previousParameters[i].Name, StringComparison.Ordinal))
                .Any();
            if (!changed
                || orderedCurrentParameters.Any(p => p.Attributes.Count > 0 || p.InitializationValue is not null))
            {
                return false;
            }

            var candidate = orderedCurrentParameters
                .Select((parameter, i) => PartialMethodCustomization.CloneParameterWithName(
                    parameter,
                    previousParameters[i].Name,
                    removeDefault: false,
                    forceClone: true))
                .ToArray();
            if (!HaveSameParameterIdentity(candidate, previousParameters) || !HasLegalParameterOrder(candidate))
            {
                return false;
            }

            restoredParameters = candidate;
            return true;
        }

        private static bool HaveSameParameterIdentity(ParameterProvider first, ParameterProvider second)
            => TypesMatchForOverload(first.Type, second.Type)
                && first.IsRef == second.IsRef
                && first.IsOut == second.IsOut
                && first.IsIn == second.IsIn
                && first.IsParams == second.IsParams;

        private static bool TypesMatchForOverload(CSharpType first, CSharpType second)
        {
            if (!first.AreNamesEqual(second)
                || (first.IsValueType && first.IsNullable != second.IsNullable))
            {
                return false;
            }

            for (int i = 0; i < first.Arguments.Count; i++)
            {
                if (!TypesMatchForOverload(first.Arguments[i], second.Arguments[i]))
                {
                    return false;
                }
            }

            return true;
        }

        private static bool HasLegalParameterOrder(IReadOnlyList<ParameterProvider> parameters)
        {
            bool sawOptional = false;
            for (int i = 0; i < parameters.Count; i++)
            {
                var parameter = parameters[i];
                if (parameter.IsParams)
                {
                    if (i != parameters.Count - 1 || parameter.DefaultValue is not null)
                    {
                        return false;
                    }

                    continue;
                }

                if (parameter.DefaultValue is not null)
                {
                    sawOptional = true;
                }
                else if (sawOptional)
                {
                    return false;
                }
            }

            return true;
        }

        private static bool IsPrivateProtected(MethodSignatureModifiers modifiers)
            => modifiers.HasFlag(MethodSignatureModifiers.Private)
                && modifiers.HasFlag(MethodSignatureModifiers.Protected);

        private static bool IsRemovalAcceptedInBaseline(TypeProvider type, ConstructorSignature previousSignature)
        {
            var parameterTypes = previousSignature.Parameters.Select(p => p.Type).ToArray();
            if (CodeModelGenerator.Instance.SourceInputModel?.ApiCompatBaseline.IsMethodRemovalSuppressed(
                    type.Type.FullyQualifiedName,
                    ".ctor",
                    parameterTypes) != true)
            {
                return false;
            }

            CodeModelGenerator.Instance.Emitter.Info(
                $"Skipping back-compat for '{type.Type.FullyQualifiedName}..ctor'; removal is accepted in the ApiCompat baseline.",
                BackCompatibilityChangeCategory.BaselineAcceptedRemovalSkipped);
            return true;
        }
    }
}
