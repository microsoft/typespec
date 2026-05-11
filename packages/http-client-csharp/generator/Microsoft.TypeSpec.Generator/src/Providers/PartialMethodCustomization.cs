// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Helpers used to honor C# <c>partial</c> method declarations supplied in customer code
    /// when emitting generated method signatures and bodies.
    /// </summary>
    /// <remarks>
    /// A library author can declare an unimplemented <c>partial</c> method on a generated
    /// <see cref="TypeProvider"/> to customize the method's signature (modifiers, name, parameter
    /// names) while keeping the generator-emitted body. The generator detects the partial
    /// declaration on <see cref="TypeProvider.CustomCodeView"/> and uses the helpers in this class
    /// to:
    /// <list type="number">
    /// <item>find a matching custom partial signature for a generated method,</item>
    /// <item>clone the generator's <see cref="ParameterProvider"/>s with the customer-chosen names
    /// while preserving generator metadata (so the body keeps compiling), and</item>
    /// <item>build a final <see cref="MethodSignature"/> with <c>partial</c> applied and all
    /// parameters required (a C# constraint on partial method implementations).</item>
    /// </list>
    /// These helpers are exposed publicly so that downstream emitters (for example the management
    /// emitter, which wraps <c>ClientProvider</c>s in its own public-surface providers) can reuse
    /// the same matching and parameter-cloning behavior in their own method builders.
    /// </remarks>
    public static class PartialMethodCustomization
    {
        /// <summary>
        /// Attempts to find a customer-declared <c>partial</c> method on <paramref name="enclosingType"/>'s
        /// <see cref="TypeProvider.CustomCodeView"/> matching the given method name and parameter list
        /// (matched by parameter type names, position-sensitive).
        /// </summary>
        /// <param name="enclosingType">The generated type whose custom code view should be searched.</param>
        /// <param name="methodName">The generated method's name.</param>
        /// <param name="parameters">The generated method's parameter list (in declaration order).</param>
        /// <param name="customSignature">When the method returns <c>true</c>, set to the matching partial signature from custom code.</param>
        /// <returns><c>true</c> when a matching partial declaration was found; <c>false</c> otherwise.</returns>
        public static bool TryFindCustomSignature(
            TypeProvider enclosingType,
            string methodName,
            IReadOnlyList<ParameterProvider> parameters,
            out MethodSignature? customSignature)
        {
            customSignature = null;

            if (enclosingType is null)
            {
                return false;
            }

            var customMethods = enclosingType.CustomCodeView?.Methods;
            if (customMethods == null || customMethods.Count == 0)
            {
                return false;
            }

            MethodSignature? firstMatch = null;
            foreach (var customMethod in customMethods)
            {
                if (!customMethod.IsPartialMethod)
                {
                    continue;
                }

                var candidate = customMethod.Signature;
                if (candidate.Name != methodName || candidate.Parameters.Count != parameters.Count)
                {
                    continue;
                }

                bool match = true;
                for (int i = 0; i < parameters.Count; i++)
                {
                    // The customer's CSharpType may not carry a namespace (when referencing a
                    // not-yet-generated type, Roslyn returns an empty namespace). AreNamesEqual
                    // handles that by falling back to name-only comparison and also recurses into
                    // generic type arguments.
                    if (!candidate.Parameters[i].Type.AreNamesEqual(parameters[i].Type))
                    {
                        match = false;
                        break;
                    }
                }

                if (!match)
                {
                    continue;
                }

                if (firstMatch != null)
                {
                    // C# itself disallows duplicate signatures in the same type, so this should be
                    // unreachable in well-formed custom code. Surface it as a clear build-time error
                    // rather than silently picking one declaration over another.
                    throw new InvalidOperationException(
                        $"Multiple partial method declarations on '{enclosingType.Type.Name}' match the generated method '{methodName}' " +
                        $"with {parameters.Count} parameter(s). Each generated method may be customized by at most one partial declaration.");
                }

                firstMatch = candidate;
            }

            customSignature = firstMatch;
            return firstMatch != null;
        }

        /// <summary>
        /// Produces a new parameter list whose entries take their names (and modifier flags such
        /// as default value, ref/out/in/params) from <paramref name="customParameters"/> while
        /// preserving every other piece of generator metadata from <paramref name="generatorParameters"/>
        /// (such as <see cref="ParameterProvider.Location"/>, <see cref="ParameterProvider.WireInfo"/>,
        /// <see cref="ParameterProvider.SpreadSource"/>, <see cref="ParameterProvider.InputParameter"/>,
        /// validation, property/field references, and so on).
        /// </summary>
        /// <param name="generatorParameters">The parameters originally produced by the generator.
        /// Body construction depends on the metadata carried by these instances.</param>
        /// <param name="customParameters">The parameters from the customer's partial signature.
        /// Must have the same count as <paramref name="generatorParameters"/>.</param>
        /// <param name="removeDefaults">When <c>true</c>, drop default values on the cloned
        /// parameters. Required for partial method implementations.</param>
        public static IReadOnlyList<ParameterProvider> RenameAndCloneParameters(
            IReadOnlyList<ParameterProvider> generatorParameters,
            IReadOnlyList<ParameterProvider> customParameters,
            bool removeDefaults)
        {
            if (generatorParameters is null) throw new ArgumentNullException(nameof(generatorParameters));
            if (customParameters is null) throw new ArgumentNullException(nameof(customParameters));
            if (generatorParameters.Count != customParameters.Count)
            {
                throw new ArgumentException(
                    $"Parameter counts differ ({generatorParameters.Count} vs {customParameters.Count}).",
                    nameof(customParameters));
            }

            var renamed = new ParameterProvider[generatorParameters.Count];
            for (int i = 0; i < generatorParameters.Count; i++)
            {
                renamed[i] = CloneParameterWithName(
                    generatorParameters[i],
                    customParameters[i].Name,
                    removeDefaults);
            }

            return renamed;
        }

        /// <summary>
        /// Builds a <see cref="MethodSignature"/> for a partial method implementation using
        /// <paramref name="customSignature"/> (modifiers, name, return type, attributes, and
        /// other signature metadata) and the supplied <paramref name="implementationParameters"/>.
        /// The result has <see cref="MethodSignatureModifiers.Partial"/> applied.
        /// </summary>
        /// <param name="customSignature">The customer's partial declaration signature.</param>
        /// <param name="implementationParameters">The parameters to use for the implementation.
        /// Must all be required (no default values) per the C# partial method rules.</param>
        public static MethodSignature BuildPartialSignature(
            MethodSignature customSignature,
            IReadOnlyList<ParameterProvider> implementationParameters)
        {
            if (customSignature is null) throw new ArgumentNullException(nameof(customSignature));
            if (implementationParameters is null) throw new ArgumentNullException(nameof(implementationParameters));

            return new MethodSignature(
                customSignature.Name,
                customSignature.Description,
                customSignature.Modifiers | MethodSignatureModifiers.Partial,
                customSignature.ReturnType,
                customSignature.ReturnDescription,
                implementationParameters,
                customSignature.Attributes,
                customSignature.GenericArguments,
                customSignature.GenericParameterConstraints,
                customSignature.ExplicitInterface,
                customSignature.NonDocumentComment);
        }

        // Clones a ParameterProvider with a new name (and optionally without its default value)
        // while preserving all generator metadata. Returns the source unchanged when no change is
        // needed.
        private static ParameterProvider CloneParameterWithName(
            ParameterProvider source,
            string newName,
            bool removeDefault)
        {
            if (source.Name == newName && !(removeDefault && source.DefaultValue != null))
            {
                return source;
            }

            return new ParameterProvider(
                newName,
                source.Description,
                source.Type,
                defaultValue: removeDefault ? null : source.DefaultValue,
                isRef: source.IsRef,
                isOut: source.IsOut,
                isIn: source.IsIn,
                isParams: source.IsParams,
                attributes: source.Attributes,
                property: source.Property,
                field: source.Field,
                initializationValue: source.InitializationValue,
                location: source.Location,
                wireInfo: source.WireInfo,
                validation: source.Validation,
                inputParameter: source.InputParameter)
            {
                SpreadSource = source.SpreadSource,
            };
        }
    }
}
