// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    /// <summary>
    /// Shared helpers for applying backward compatibility to generated methods by comparing the
    /// current generation against a type's last contract.
    /// </summary>
    internal static class BackCompatHelper
    {
        /// <summary>
        /// Returns true when a last-contract method should be considered for back compatibility:
        /// it is public or protected and has no exact match among the current signatures.
        /// </summary>
        public static bool ShouldApplyMethodBackCompatibility(
            MethodSignature previousSignature,
            Dictionary<MethodSignature, MethodProvider> currentMethodSignatures)
        {
            if (currentMethodSignatures.ContainsKey(previousSignature))
            {
                return false;
            }

            var modifiers = previousSignature.Modifiers;
            return modifiers.HasFlag(MethodSignatureModifiers.Public) ||
                   modifiers.HasFlag(MethodSignatureModifiers.Protected);
        }

        /// <summary>
        /// Returns true when the removal of a previously-published method — identified by the enclosing
        /// type's fully-qualified name, the method name, and the parameter count — has been accepted in
        /// the ApiCompat baseline, in which case back compatibility must not resurrect or restore it.
        /// Emits an informational log entry when a suppression is honored.
        /// </summary>
        public static bool IsMethodRemovalAcceptedInBaseline(TypeProvider enclosingType, MethodSignature previousSignature)
        {
            if (CodeModelGenerator.Instance.SourceInputModel?.ApiCompatBaseline.IsMemberSuppressed(
                    enclosingType.Type.FullyQualifiedName,
                    previousSignature.Name,
                    previousSignature.Parameters.Count) != true)
            {
                return false;
            }

            CodeModelGenerator.Instance.Emitter.Info(
                $"Skipping back-compat for '{enclosingType.Type.FullyQualifiedName}.{previousSignature.Name}'; removal is accepted in the ApiCompat baseline.",
                BackCompatibilityChangeCategory.BaselineAcceptedRemovalSkipped);
            return true;
        }

        /// <summary>
        /// Finds the current method that has the same parameter set as <paramref name="previousSignature"/>
        /// (matched by name and return type) but in a different order, or null when there is none.
        /// </summary>
        public static MethodProvider? FindMethodWithSameParametersDifferentOrder(
            MethodSignature previousSignature,
            Dictionary<MethodSignature, MethodProvider> currentMethodSignatures)
        {
            foreach (var kvp in currentMethodSignatures)
            {
                var currentSignature = kvp.Key;
                if (currentSignature.Name.Equals(previousSignature.Name)
                    && currentSignature.ReturnType?.AreNamesEqual(previousSignature.ReturnType) == true
                    && MethodSignatureHelper.ContainsSameParameters(previousSignature, currentSignature))
                {
                    return kvp.Value;
                }
            }

            return null;
        }

        /// <summary>
        /// Returns true when two parameter lists match positionally by type name and parameter name
        /// (and have the same count). Used to align a current member with its last-contract counterpart.
        /// </summary>
        public static bool ParametersMatch(IReadOnlyList<ParameterProvider> params1, IReadOnlyList<ParameterProvider> params2)
        {
            if (params1.Count != params2.Count)
            {
                return false;
            }

            for (int i = 0; i < params1.Count; i++)
            {
                if (!params1[i].Type.AreNamesEqual(params2[i].Type) || params1[i].Name != params2[i].Name)
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Returns the previously-published name of a parameter whose original (spec) name is
        /// <paramref name="originalName"/>, looked up in <paramref name="lastContractView"/>. When
        /// <paramref name="methodName"/> is supplied, the search is scoped to last-contract methods
        /// whose name matches it (allowing for a sync/async pair) so a parameter name shared across
        /// methods cannot cross-match. Returns null when no match exists.
        /// </summary>
        public static string? FindPreviousParameterName(
            TypeProvider? lastContractView,
            string originalName,
            string? methodName = null)
        {
            var lastContractMethods = lastContractView?.Methods;
            if (lastContractMethods is null || lastContractMethods.Count == 0)
            {
                return null;
            }

            IEnumerable<MethodProvider> scopedMethods = lastContractMethods;
            if (methodName != null)
            {
                scopedMethods = lastContractMethods.Where(m =>
                    string.Equals(m.Signature.Name, methodName, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(m.Signature.Name, methodName + "Async", StringComparison.OrdinalIgnoreCase));
            }

            return scopedMethods
                .SelectMany(method => method.Signature.Parameters)
                .FirstOrDefault(p => string.Equals(p.Name, originalName, StringComparison.OrdinalIgnoreCase))
                ?.Name;
        }

        public static void RestorePreviousParameterNames(
            TypeProvider enclosingType,
            IReadOnlyList<MethodProvider> currentMethods)
        {
            var lastContractView = enclosingType.LastContractView;
            if (lastContractView?.Methods is not { Count: > 0 } previousMethods)
            {
                return;
            }

            foreach (var method in currentMethods)
            {
                var modifiers = method.Signature.Modifiers;
                if (!modifiers.HasFlag(MethodSignatureModifiers.Public) && !modifiers.HasFlag(MethodSignatureModifiers.Protected))
                {
                    continue;
                }

                var currentParameters = method.Signature.Parameters;
                MethodProvider? matchingPrevious = null;
                bool matchingPreviousResolved = false;

                for (int i = 0; i < currentParameters.Count; i++)
                {
                    var parameter = currentParameters[i];
                    string? preservedName;

                    var inputParameter = parameter.InputParameter;
                    if (inputParameter is not null)
                    {
                        if (!string.Equals(parameter.Name, inputParameter.Name, StringComparison.Ordinal))
                        {
                            continue;
                        }

                        var originalName = inputParameter.OriginalName;
                        if (string.IsNullOrEmpty(originalName))
                        {
                            continue;
                        }

                        preservedName = FindPreviousParameterName(lastContractView, originalName, method.Signature.Name);
                    }
                    else
                    {
                        // Positional fallback for synthesized parameters (e.g. model factory methods).
                        if (!matchingPreviousResolved)
                        {
                            matchingPrevious = FindMethodWithSameSignatureIgnoringNames(previousMethods, method.Signature);
                            matchingPreviousResolved = true;
                        }

                        var previousParameters = matchingPrevious?.Signature.Parameters;
                        preservedName = previousParameters is not null && previousParameters.Count == currentParameters.Count
                            ? previousParameters[i].Name
                            : null;
                    }

                    // A casing-only difference is still a source-breaking rename for named arguments,
                    // so compare case-sensitively and restore the previously-published spelling.
                    if (string.IsNullOrEmpty(preservedName) || string.Equals(parameter.Name, preservedName, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    // Skip the rename when applying it would collide with another current parameter's
                    // name (e.g. two same-typed parameters whose order changed between the previous and
                    // current contracts). A rename in that case would produce a duplicate parameter name
                    // and, for name-based argument lookups, silently wire the wrong value.
                    bool wouldCollide = false;
                    for (int j = 0; j < currentParameters.Count; j++)
                    {
                        if (j != i && string.Equals(currentParameters[j].Name, preservedName, StringComparison.Ordinal))
                        {
                            wouldCollide = true;
                            break;
                        }
                    }

                    if (wouldCollide)
                    {
                        continue;
                    }

                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Preserved parameter name '{preservedName}' on '{enclosingType.Name}.{method.Signature.Name}' from last contract (instead of '{parameter.Name}').",
                        BackCompatibilityChangeCategory.ParameterNamePreserved);
                    parameter.Update(name: preservedName);
                }
            }
        }

        /// <summary>
        /// Finds the last-contract method whose signature matches <paramref name="currentSignature"/> on
        /// method name plus parameter count and types (ignoring parameter names), or null when none.
        /// </summary>
        private static MethodProvider? FindMethodWithSameSignatureIgnoringNames(
            IReadOnlyList<MethodProvider> previousMethods,
            MethodSignature currentSignature)
        {
            foreach (var previousMethod in previousMethods)
            {
                if (MethodSignature.MethodSignatureComparer.Equals(currentSignature, previousMethod.Signature))
                {
                    return previousMethod;
                }
            }

            return null;
        }

        /// <summary>
        /// Restores the previous parameter order on <paramref name="methodToReorder"/> in place
        /// (updating XML docs). Returns true when a change was made.
        /// </summary>
        public static bool TryRestorePreviousParameterOrder(
            MethodProvider methodToReorder,
            MethodSignature previousSignature)
        {
            var currentSignature = methodToReorder.Signature;
            if (MethodSignatureHelper.HaveSameParametersInSameOrder(currentSignature, previousSignature))
            {
                return false;
            }

            var parametersByName = currentSignature.Parameters.ToDictionary(p => p.Name.ToVariableName());
            var reorderedParameters = new List<ParameterProvider>(currentSignature.Parameters.Count);

            foreach (var previousParam in previousSignature.Parameters)
            {
                if (parametersByName.TryGetValue(previousParam.Name, out var matchingParam))
                {
                    reorderedParameters.Add(matchingParam);
                }
            }

            if (reorderedParameters.Count != currentSignature.Parameters.Count)
            {
                return false;
            }

            foreach (var previousParam in previousSignature.Parameters)
            {
                if (parametersByName.TryGetValue(previousParam.Name, out var matchingParam)
                    && matchingParam.DefaultValue is not null
                    && previousParam.DefaultValue is not null)
                {
                    matchingParam.Update(defaultValue: previousParam.DefaultValue);
                }
            }

            var updatedSignature = new MethodSignature(
                currentSignature.Name,
                currentSignature.Description,
                currentSignature.Modifiers,
                currentSignature.ReturnType,
                currentSignature.ReturnDescription,
                reorderedParameters,
                currentSignature.Attributes,
                currentSignature.GenericArguments,
                currentSignature.GenericParameterConstraints,
                currentSignature.ExplicitInterface,
                currentSignature.NonDocumentComment);

            UpdateXmlDocProviderForParamReorder(methodToReorder.XmlDocs, updatedSignature);
            methodToReorder.Update(signature: updatedSignature, xmlDocProvider: methodToReorder.XmlDocs);

            return true;
        }

        private static void UpdateXmlDocProviderForParamReorder(
            XmlDocProvider xmlDocs,
            MethodSignature updatedSignature)
        {
            var paramDocsByName = xmlDocs.Parameters.ToDictionary(s => s.Parameter.Name);
            var reorderedParamDocs = new List<XmlDocParamStatement>(updatedSignature.Parameters.Count);

            foreach (var param in updatedSignature.Parameters)
            {
                if (paramDocsByName.TryGetValue(param.Name, out var paramDoc))
                {
                    reorderedParamDocs.Add(paramDoc);
                }
            }

            if (reorderedParamDocs.Count == xmlDocs.Parameters.Count &&
                !reorderedParamDocs.SequenceEqual(xmlDocs.Parameters))
            {
                xmlDocs.Update(parameters: reorderedParamDocs);
            }
        }

        /// <summary>
        /// Adds hidden back-compat overloads for public/protected methods that gained one or more new
        /// optional non-body parameters relative to the last contract. Each added overload matches a
        /// previously-published signature and delegates to the current method, forwarding the previous
        /// arguments and passing <c>default</c> for every new parameter. Renaming a method's parameter
        /// set this way is otherwise a source-breaking change for existing callers.
        /// </summary>
        public static void AddOverloadsForNewOptionalParameters(TypeProvider enclosingType, List<MethodProvider> methods)
        {
            if (enclosingType.LastContractView?.Methods is not { Count: > 0 } previousMethods)
            {
                return;
            }

            var currentMethods = enclosingType.CustomCodeView?.Methods is { } customMethods
                ? methods.Concat(customMethods)
                : methods;
            if (!currentMethods.Any())
            {
                return;
            }

            var currentMethodsByName = new Dictionary<string, List<MethodProvider>>();
            foreach (var method in currentMethods)
            {
                if (!currentMethodsByName.TryGetValue(method.Signature.Name, out var bucket))
                {
                    bucket = [];
                    currentMethodsByName[method.Signature.Name] = bucket;
                }
                bucket.Add(method);
            }

            foreach (var previousMethod in previousMethods)
            {
                var previousSignature = previousMethod.Signature;
                if ((!previousSignature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                     !previousSignature.Modifiers.HasFlag(MethodSignatureModifiers.Protected)) ||
                    !currentMethodsByName.TryGetValue(previousSignature.Name, out var candidates))
                {
                    continue;
                }

                // One pass over the same-named methods: bail if the previous signature still exists,
                // otherwise remember the first public/protected method that merely gained optional
                // non-body parameters.
                MethodProvider? matchedCurrent = null;
                bool previousStillExists = false;
                foreach (var candidate in candidates)
                {
                    if (MethodSignature.MethodSignatureComparer.Equals(candidate.Signature, previousSignature))
                    {
                        previousStillExists = true;
                        break;
                    }

                    var modifiers = candidate.Signature.Modifiers;
                    if (matchedCurrent is null &&
                        (modifiers.HasFlag(MethodSignatureModifiers.Public) || modifiers.HasFlag(MethodSignatureModifiers.Protected)) &&
                        HasNewOptionalNonBodyParametersOnly(previousSignature, candidate.Signature))
                    {
                        matchedCurrent = candidate;
                    }
                }

                if (previousStillExists || matchedCurrent is null)
                {
                    continue;
                }

                var overload = BuildNewOptionalParameterOverload(enclosingType, previousMethod, matchedCurrent);
                candidates.Add(overload);
                methods.Add(overload);
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Added back-compat overload for '{enclosingType.Name}.{previousSignature.Name}' to handle new optional parameter(s) introduced relative to the last contract.",
                    BackCompatibilityChangeCategory.SvcMethodNewOptionalParameterOverloadAdded);
            }
        }

        /// <summary>
        /// Returns true when <paramref name="currentSignature"/> contains all parameters of
        /// <paramref name="previousSignature"/> in the same relative order (matched by variable name and
        /// type) with the same return type, every "extra" current parameter is optional, and none of the
        /// extras are body parameters.
        /// </summary>
        public static bool HasNewOptionalNonBodyParametersOnly(
            MethodSignature previousSignature,
            MethodSignature currentSignature)
        {
            if (currentSignature.Parameters.Count <= previousSignature.Parameters.Count)
            {
                return false;
            }

            if (previousSignature.ReturnType is null
                ? currentSignature.ReturnType is not null
                : !previousSignature.ReturnType.AreNamesEqual(currentSignature.ReturnType))
            {
                return false;
            }

            // Walk current parameters and ensure previous parameters appear in the same relative order
            // (matched by variable name and type), with every "extra" parameter being optional and non-body.
            int previousIndex = 0;
            for (int currentIndex = 0; currentIndex < currentSignature.Parameters.Count; currentIndex++)
            {
                var currentParam = currentSignature.Parameters[currentIndex];

                if (previousIndex < previousSignature.Parameters.Count)
                {
                    var previousParam = previousSignature.Parameters[previousIndex];
                    if (currentParam.Name.ToVariableName() == previousParam.Name.ToVariableName() &&
                        currentParam.Type.AreNamesEqual(previousParam.Type))
                    {
                        previousIndex++;
                        continue;
                    }
                }

                if (currentParam.DefaultValue is null)
                {
                    return false;
                }

                if (currentParam.Location == ParameterLocation.Body)
                {
                    return false;
                }
            }

            return previousIndex == previousSignature.Parameters.Count;
        }

        private static MethodProvider BuildNewOptionalParameterOverload(
            TypeProvider enclosingType,
            MethodProvider previousMethod,
            MethodProvider currentMethod)
        {
            var previousSignature = previousMethod.Signature;
            var currentSignature = currentMethod.Signature;

            var previousParametersByName = new Dictionary<string, ParameterProvider>();
            foreach (var parameter in previousSignature.Parameters)
            {
                previousParametersByName.TryAdd(parameter.Name.ToVariableName(), parameter);
            }

            // Build the delegating call: forward each previous parameter and pass default for the new ones.
            var arguments = new List<ValueExpression>(currentSignature.Parameters.Count);
            foreach (var currentParam in currentSignature.Parameters)
            {
                var variableName = currentParam.Name.ToVariableName();
                ValueExpression value = previousParametersByName.TryGetValue(variableName, out var previousParam)
                    ? previousParam
                    : currentParam.DefaultValue ?? Default;
                arguments.Add(PositionalReference(variableName, value));
            }

            return new MethodProvider(
                MethodSignatureHelper.BuildBackCompatMethodSignature(previousSignature, hideMethod: true),
                Return(This.Invoke(currentSignature.Name, arguments)),
                enclosingType,
                previousMethod.XmlDocs);
        }
    }
}
