// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
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

            return (previousSignature.Modifiers & (MethodSignatureModifiers.Public | MethodSignatureModifiers.Protected)) != 0;
        }

        /// <summary>
        /// Returns true when the removal of a previously-published method — identified by the enclosing
        /// type's fully-qualified name, the method name, and the exact parameter types — has been
        /// accepted in the ApiCompat baseline, in which case back compatibility must not resurrect or
        /// restore it. Emits an informational log entry when a suppression is honored.
        /// </summary>
        public static bool IsMethodRemovalAcceptedInBaseline(TypeProvider enclosingType, MethodSignature previousSignature)
        {
            var parameterTypes = new CSharpType[previousSignature.Parameters.Count];
            for (int i = 0; i < parameterTypes.Length; i++)
            {
                parameterTypes[i] = previousSignature.Parameters[i].Type;
            }

            if (CodeModelGenerator.Instance.SourceInputModel?.ApiCompatBaseline.IsMethodRemovalSuppressed(
                    enclosingType.Type.FullyQualifiedName,
                    previousSignature.Name,
                    parameterTypes) != true)
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
                if (parametersByName.TryGetValue(previousParam.Name.ToVariableName(), out var matchingParam))
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
                if (parametersByName.TryGetValue(previousParam.Name.ToVariableName(), out var matchingParam)
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
        /// Adds hidden back-compat overloads for public/protected methods whose signature changed in a
        /// recoverable way relative to the last contract: either one or more new optional non-body
        /// parameters were added, or a value-type parameter's nullability was removed (<c>T?</c> became
        /// <c>T</c>). Both scenarios are detected in a single scan of the current methods so they are not
        /// re-classified once per scenario, and each produces a hidden overload reproducing the
        /// previously-published signature that delegates to the current method. When both scenarios apply
        /// to the same previous signature, the new-optional-parameter overload is preferred because it
        /// forwards the shared parameters directly rather than unwrapping a nullable value type.
        /// </summary>
        public static void AddBackCompatOverloads(TypeProvider enclosingType, List<MethodProvider> methods)
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
                if ((previousSignature.Modifiers & (MethodSignatureModifiers.Public | MethodSignatureModifiers.Protected)) == 0 ||
                    !currentMethodsByName.TryGetValue(previousSignature.Name, out var candidates))
                {
                    continue;
                }

                bool previousStillExistsIgnoringNullability = false;
                bool previousStillExistsIncludingNullability = false;
                MethodProvider? newOptionalMatch = null;
                MethodProvider? nullabilityMatch = null;
                MethodProvider? optionalityMatch = null;

                foreach (var candidate in candidates)
                {
                    var candidateSignature = candidate.Signature;
                    bool candidateIsAccessible = (candidateSignature.Modifiers & (MethodSignatureModifiers.Public | MethodSignatureModifiers.Protected)) != 0;

                    if (MethodSignatureBase.SignatureComparerIncludingNullability.Equals(candidateSignature, previousSignature))
                    {
                        if (candidateIsAccessible && IsSingleNullableParameterOptionalToRequired(previousSignature, candidateSignature))
                        {
                            optionalityMatch = candidate;
                        }
                        else
                        {
                            previousStillExistsIncludingNullability = true;
                        }
                        break;
                    }

                    if (MethodSignature.MethodSignatureComparer.Equals(candidateSignature, previousSignature))
                    {
                        previousStillExistsIgnoringNullability = true;
                    }

                    // The remaining scenarios add a public/protected shim, so only accessible candidates matter.
                    if (!candidateIsAccessible)
                    {
                        continue;
                    }

                    if (newOptionalMatch is null && HasNewOptionalNonBodyParametersOnly(previousSignature, candidateSignature))
                    {
                        newOptionalMatch = candidate;
                    }

                    if (nullabilityMatch is null && HasRelaxedNullableValueTypeParametersOnly(previousSignature, candidateSignature))
                    {
                        nullabilityMatch = candidate;
                    }
                }

                if (previousStillExistsIncludingNullability)
                {
                    continue;
                }

                // Prefer, in order: the optionality-restoration overload (identical types, a nullable
                // parameter became required), then the new-optional-parameter overload (forwards shared
                // parameters directly), then the nullability overload (which unwraps the previously-nullable
                // value type with .Value). The new-optional scenario only applies when the signature no
                // longer exists even when parameter nullability is ignored.
                bool canAddNewOptional = !previousStillExistsIgnoringNullability && newOptionalMatch is not null;
                if (optionalityMatch is null && !canAddNewOptional && nullabilityMatch is null)
                {
                    continue;
                }

                if (IsMethodRemovalAcceptedInBaseline(enclosingType, previousSignature))
                {
                    continue;
                }

                var (overload, category, reason) = true switch
                {
                    _ when optionalityMatch is not null => (
                        BuildOptionalityRestorationOverload(enclosingType, previousMethod, optionalityMatch),
                        BackCompatibilityChangeCategory.SvcMethodParameterOptionalityRestorationOverloadAdded,
                        "to restore a nullable parameter that changed from optional to required relative to the last contract."),
                    _ when canAddNewOptional => (
                        BuildNewOptionalParameterOverload(enclosingType, previousMethod, newOptionalMatch!),
                        BackCompatibilityChangeCategory.SvcMethodNewOptionalParameterOverloadAdded,
                        "to handle new optional parameter(s) introduced relative to the last contract."),
                    _ => (
                        BuildChangedParameterNullabilityOverload(enclosingType, previousMethod, nullabilityMatch!),
                        BackCompatibilityChangeCategory.SvcMethodParameterNullabilityChangeOverloadAdded,
                        "to preserve a parameter whose nullability was removed relative to the last contract."),
                };

                // Do not add if the new overload would be identical to an existing method
                if (candidates.Any(c =>
                    MethodSignatureBase.SignatureComparer.Equals(c.Signature, overload.Signature)
                    && !MethodProviderHelpers.DiffersByValueTypeParameterNullability(c.Signature, overload.Signature)))
                {
                    continue;
                }

                candidates.Add(overload);
                methods.Add(overload);
                CodeModelGenerator.Instance.Emitter.Debug(
                    $"Added back-compat overload for '{enclosingType.Name}.{previousSignature.Name}' {reason}",
                    category);
            }
        }

        // Returns true when both signatures have the same return type (matched by name); a null return type
        // matches only another null return type. Compares in both directions so that a return type whose
        // (possibly generic) parts are unresolved in the customization compilation still matches by name.
        private static bool ReturnTypesMatch(MethodSignature previous, MethodSignature current)
        {
            if (previous.ReturnType is null || current.ReturnType is null)
            {
                return previous.ReturnType is null && current.ReturnType is null;
            }

            return previous.ReturnType.AreNamesEqual(current.ReturnType) || current.ReturnType.AreNamesEqual(previous.ReturnType);
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

            if (!ReturnTypesMatch(previousSignature, currentSignature))
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

                if (currentParam.Location is ParameterLocation.Body or ParameterLocation.Unknown)
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
            // Named argument syntax cannot be combined with 'ref'/'out', so when any parameter is passed by
            // reference every argument is forwarded positionally instead (the arguments are already built in
            // the current method's parameter order).
            bool hasByRefParameter = currentSignature.Parameters.Any(p => p.IsRef || p.IsOut);

            var arguments = new List<ValueExpression>(currentSignature.Parameters.Count);
            var nullGuards = new List<MethodBodyStatement>();
            foreach (var currentParam in currentSignature.Parameters)
            {
                var variableName = currentParam.Name.ToVariableName();
                ValueExpression value = previousParametersByName.TryGetValue(variableName, out var previousParam)
                    ? ForwardParameter(previousParam, currentParam.Type, nullGuards)
                    : currentParam.DefaultValue ?? Default;

                AddForwardedArgument(arguments, currentParam, value, hasByRefParameter);
            }

            var body = BuildDelegatingBody(enclosingType, currentSignature, arguments, nullGuards);

            // Preserve the previous parameter optionality when every previous parameter is required in the
            // current method: the current method then cannot bind a call that omits a trailing parameter, so
            // this hidden overload can keep its optional defaults without creating an ambiguous call site,
            // and callers that omitted an optional parameter still compile. Otherwise the defaults are
            // stripped (BuildBackCompatMethodSignature does this) to avoid an ambiguous call with the current
            // method over a shared optional parameter (e.g. a trailing optional CancellationToken); in that
            // case the current method itself still serves the omitting callers.
            int requiredCurrentParameterCount = currentSignature.Parameters.Count(p => p.DefaultValue is null);
            var preservedDefaults = requiredCurrentParameterCount >= previousSignature.Parameters.Count
                ? previousSignature.Parameters.Select(p => p.DefaultValue).ToArray()
                : null;

            // The shim delegates without awaiting, so it must not be declared 'async'.
            var signature = MethodSignatureHelper.BuildBackCompatMethodSignature(previousSignature, hideMethod: true, shouldNotBeAsync: true);

            if (preservedDefaults is not null)
            {
                for (int i = 0; i < signature.Parameters.Count; i++)
                {
                    signature.Parameters[i].DefaultValue = preservedDefaults[i];
                }
            }

            return new MethodProvider(
                signature,
                body,
                enclosingType,
                previousMethod.XmlDocs);
        }

        // Forwards a previous parameter to the current method. When the parameter's value-type nullability
        // was removed (T? -> T) it is unwrapped with .Value and a null-guard is appended (T? does not
        // implicitly convert to T, and the guard turns a null argument into a clear ArgumentNullException);
        // otherwise it is forwarded unchanged.
        private static ValueExpression ForwardParameter(
            ParameterProvider previousParam,
            CSharpType currentParamType,
            List<MethodBodyStatement> nullGuards)
        {
            if (IsNullabilityRelaxedValueType(previousParam.Type, currentParamType))
            {
                nullGuards.Add(ArgumentSnippets.AssertNotNull(previousParam));
                return previousParam.Property(nameof(Nullable<int>.Value));
            }

            return previousParam;
        }

        private static void AddForwardedArgument(
            List<ValueExpression> arguments,
            ParameterProvider currentParam,
            ValueExpression value,
            bool hasByRefParameter)
        {
            if (hasByRefParameter)
            {
                arguments.Add(currentParam.IsRef || currentParam.IsOut
                    ? value.AsArgument(isRef: currentParam.IsRef, isOut: currentParam.IsOut)
                    : value);
            }
            else
            {
                arguments.Add(PositionalReference(currentParam.Name.ToVariableName(), value));
            }
        }

        // Builds the shim body that forwards to the current method: any argument null-guards followed by the
        // delegating call (returned directly, or terminated for a void return).
        private static MethodBodyStatement BuildDelegatingBody(
            TypeProvider enclosingType,
            MethodSignature currentSignature,
            IReadOnlyList<ValueExpression> arguments,
            List<MethodBodyStatement>? nullGuards = null)
        {
            var invocationTarget = currentSignature.Modifiers.HasFlag(MethodSignatureModifiers.Static)
                ? Static(enclosingType.Type)
                : This;
            var delegatingCall = invocationTarget.Invoke(currentSignature.Name, arguments);
            var returnType = currentSignature.ReturnType;
            bool returnsVoid = returnType is null || (returnType.IsFrameworkType && returnType.FrameworkType == typeof(void));
            MethodBodyStatement delegatingStatement = returnsVoid
                ? delegatingCall.Terminate()
                : Return(delegatingCall);

            if (nullGuards is { Count: > 0 })
            {
                nullGuards.Add(delegatingStatement);
                return nullGuards;
            }

            return delegatingStatement;
        }

        // Builds a hidden (EditorBrowsable.Never) overload signature from a previous signature, replacing
        // its parameters and clearing the 'async' modifier (the shim delegates without awaiting).
        private static MethodSignature BuildHiddenOverloadSignature(
            MethodSignature previousSignature,
            IReadOnlyList<ParameterProvider> parameters)
        {
            return new MethodSignature(
                previousSignature.Name,
                previousSignature.Description,
                previousSignature.Modifiers & ~MethodSignatureModifiers.Async,
                previousSignature.ReturnType,
                previousSignature.ReturnDescription,
                parameters,
                Attributes: [new(typeof(EditorBrowsableAttribute), FrameworkEnumValue(EditorBrowsableState.Never))]);
        }

        /// <summary>
        /// Returns true when <paramref name="currentSignature"/> has the same name, parameter count, and
        /// return type as <paramref name="previousSignature"/>, every parameter matches by name and type,
        /// and at least one parameter differs only in that a nullable value type (<c>T?</c>) became its
        /// non-nullable form (<c>T</c>).
        /// </summary>
        public static bool HasRelaxedNullableValueTypeParametersOnly(
            MethodSignature previousSignature,
            MethodSignature currentSignature)
        {
            if (previousSignature.Parameters.Count != currentSignature.Parameters.Count)
            {
                return false;
            }

            if (!ReturnTypesMatch(previousSignature, currentSignature))
            {
                return false;
            }

            bool foundNullabilityChange = false;
            for (int i = 0; i < currentSignature.Parameters.Count; i++)
            {
                var previousParam = previousSignature.Parameters[i];
                var currentParam = currentSignature.Parameters[i];

                if (previousParam.Name.ToVariableName() != currentParam.Name.ToVariableName())
                {
                    return false;
                }

                // An unchanged parameter (identical type, including nullability).
                if (previousParam.Type.AreNamesEqual(currentParam.Type, checkNullability: true))
                {
                    continue;
                }

                // A value-type parameter whose nullability was removed (T? -> T).
                if (IsNullabilityRelaxedValueType(previousParam.Type, currentParam.Type))
                {
                    // A ref/out parameter cannot be forwarded through .Value
                    if (currentParam.IsRef || currentParam.IsOut || previousParam.IsRef || previousParam.IsOut)
                    {
                        return false;
                    }

                    foundNullabilityChange = true;
                    continue;
                }

                // Any other difference disqualifies the method from this scenario.
                return false;
            }

            return foundNullabilityChange;
        }

        private static bool IsNullabilityRelaxedValueType(CSharpType previousType, CSharpType currentType)
        {
            if (previousType is not { IsValueType: true, IsNullable: true })
            {
                return false;
            }

            // The current parameter resolved to the non-nullable value type. Compare names in both
            // directions so a type that is unresolved in the customization compilation still matches by name.
            if (currentType is { IsValueType: true, IsNullable: false })
            {
                return previousType.AreNamesEqual(currentType) || currentType.AreNamesEqual(previousType);
            }

            return !currentType.IsNullable
               && !currentType.IsFrameworkType
               && string.IsNullOrEmpty(currentType.Namespace)
               && currentType.Name == previousType.Name;
        }

        private static MethodProvider BuildChangedParameterNullabilityOverload(
            TypeProvider enclosingType,
            MethodProvider previousMethod,
            MethodProvider currentMethod)
        {
            var previousSignature = previousMethod.Signature;
            var currentSignature = currentMethod.Signature;

            // Making the changed (nullability-relaxed) parameter required avoids an ambiguous call site
            // with the current (non-nullable) method, but that is only necessary when the current
            // parameter is itself optional. When the current parameter is required, the previous optional
            // default is preserved: the current required overload wins for concrete values while this
            // optional overload still binds for omitted/null callers, so omit-callers do not break.
            // To keep a valid required-before-optional ordering, strip defaults from every parameter up to
            // and including the last one that must become required.
            int lastRequiredIndex = -1;
            for (int i = 0; i < previousSignature.Parameters.Count; i++)
            {
                if (IsNullabilityRelaxedValueType(previousSignature.Parameters[i].Type, currentSignature.Parameters[i].Type)
                    && currentSignature.Parameters[i].DefaultValue is not null)
                {
                    lastRequiredIndex = i;
                }
            }

            var shimParameters = new ParameterProvider[previousSignature.Parameters.Count];
            for (int i = 0; i < shimParameters.Length; i++)
            {
                var previousParam = previousSignature.Parameters[i];
                shimParameters[i] = PartialMethodCustomization.CloneParameterWithName(
                    previousParam,
                    previousParam.Name,
                    removeDefault: i <= lastRequiredIndex);
            }

            // Build the delegating call, unwrapping each previously-nullable value-type argument with .Value
            // (guarded first) to match the current non-nullable parameter type.
            bool hasByRefParameter = currentSignature.Parameters.Any(p => p.IsRef || p.IsOut);
            var arguments = new List<ValueExpression>(currentSignature.Parameters.Count);
            var nullGuards = new List<MethodBodyStatement>();
            for (int i = 0; i < currentSignature.Parameters.Count; i++)
            {
                var currentParam = currentSignature.Parameters[i];
                var value = ForwardParameter(shimParameters[i], currentParam.Type, nullGuards);
                AddForwardedArgument(arguments, currentParam, value, hasByRefParameter);
            }

            var body = BuildDelegatingBody(enclosingType, currentSignature, arguments, nullGuards);
            var signature = BuildHiddenOverloadSignature(previousSignature, shimParameters);

            return new MethodProvider(
                signature,
                body,
                enclosingType,
                previousMethod.XmlDocs);
        }

        // Given two signatures already known to have equal parameter count and types (including nullability),
        // e.g. verified via SignatureComparerIncludingNullability, returns true when their only difference is
        // that exactly one nullable parameter changed from optional to required and dropping it in a
        // reduced-arity overload stays unambiguous (its type differs from every other parameter's type).
        internal static bool IsSingleNullableParameterOptionalToRequired(
            MethodSignature previousSignature,
            MethodSignature currentSignature)
        {
            if (!ReturnTypesMatch(previousSignature, currentSignature))
            {
                return false;
            }

            int becameRequiredIndex = -1;
            for (int i = 0; i < currentSignature.Parameters.Count; i++)
            {
                var previousParam = previousSignature.Parameters[i];
                var currentParam = currentSignature.Parameters[i];

                if (previousParam.Name.ToVariableName() != currentParam.Name.ToVariableName())
                {
                    return false;
                }

                if (previousParam.DefaultValue is not null && currentParam.DefaultValue is null)
                {
                    // Only a nullable parameter is in scope, and only a single one so the reduced-arity
                    // overload stays unambiguous.
                    if (!currentParam.Type.IsNullable || becameRequiredIndex != -1)
                    {
                        return false;
                    }
                    becameRequiredIndex = i;
                }
            }

            if (becameRequiredIndex == -1)
            {
                return false;
            }

            // The reduced-arity overload drops the became-required parameter; a single positional argument
            // could bind to both overloads if any remaining parameter shares its (underlying) type.
            var droppedType = currentSignature.Parameters[becameRequiredIndex].Type;
            for (int i = 0; i < currentSignature.Parameters.Count; i++)
            {
                if (i != becameRequiredIndex && droppedType.AreNamesEqual(currentSignature.Parameters[i].Type))
                {
                    return false;
                }
            }

            return true;
        }

        private static MethodProvider BuildOptionalityRestorationOverload(
            TypeProvider enclosingType,
            MethodProvider previousMethod,
            MethodProvider currentMethod)
        {
            var previousSignature = previousMethod.Signature;
            var currentSignature = currentMethod.Signature;

            // Find the single nullable parameter that changed from optional to required.
            int droppedIndex = -1;
            for (int i = 0; i < currentSignature.Parameters.Count; i++)
            {
                if (previousSignature.Parameters[i].DefaultValue is not null && currentSignature.Parameters[i].DefaultValue is null)
                {
                    droppedIndex = i;
                    break;
                }
            }

            var droppedParameter = previousSignature.Parameters[droppedIndex];

            // The overload reproduces the previous signature without the dropped parameter, preserving the
            // previous optionality of the remaining parameters.
            var shimParameters = previousSignature.Parameters.Where((_, i) => i != droppedIndex).ToList();

            // Delegate to the current (required) method, supplying the dropped parameter's previous default.
            bool hasByRefParameter = currentSignature.Parameters.Any(p => p.IsRef || p.IsOut);
            var arguments = new List<ValueExpression>(currentSignature.Parameters.Count);
            for (int i = 0; i < currentSignature.Parameters.Count; i++)
            {
                var currentParam = currentSignature.Parameters[i];
                ValueExpression value = i == droppedIndex
                    ? droppedParameter.DefaultValue ?? Default
                    : previousSignature.Parameters[i];
                AddForwardedArgument(arguments, currentParam, value, hasByRefParameter);
            }

            var body = BuildDelegatingBody(enclosingType, currentSignature, arguments);
            var signature = BuildHiddenOverloadSignature(previousSignature, shimParameters);
            var xmlDocs = BuildXmlDocsWithoutParameter(previousMethod.XmlDocs, droppedParameter.Name.ToVariableName());

            return new MethodProvider(
                signature,
                body,
                enclosingType,
                xmlDocs);
        }

        // Rebuilds an XML doc provider without any reference to the dropped parameter: its &lt;param&gt;
        // entry is removed and every &lt;exception&gt; that referenced it is rebuilt without that
        // &lt;paramref&gt; (exceptions that referenced only the dropped parameter are removed entirely).
        // This avoids stale-doc compile errors (CS1572/CS1734) on the reduced-arity overload.
        private static XmlDocProvider BuildXmlDocsWithoutParameter(XmlDocProvider docs, string droppedVariableName)
        {
            var filteredParameters = docs.Parameters
                .Where(p => p.Parameter.Name.ToVariableName() != droppedVariableName)
                .ToList();

            var filteredExceptions = new List<XmlDocExceptionStatement>(docs.Exceptions.Count);
            foreach (var exceptionDoc in docs.Exceptions)
            {
                var remaining = exceptionDoc.Parameters
                    .Where(p => p.Name.ToVariableName() != droppedVariableName)
                    .ToList();

                // Drop an exception that referenced only the removed parameter; keep an unrelated one as-is;
                // otherwise rebuild it without the removed paramref.
                if (exceptionDoc.Parameters.Count > 0 && remaining.Count == 0)
                {
                    continue;
                }

                filteredExceptions.Add(remaining.Count == exceptionDoc.Parameters.Count
                    ? exceptionDoc
                    : new XmlDocExceptionStatement(exceptionDoc.ExceptionType, remaining));
            }

            return new XmlDocProvider(docs.Summary, filteredParameters, filteredExceptions, docs.Returns, docs.Inherit);
        }
    }
}
