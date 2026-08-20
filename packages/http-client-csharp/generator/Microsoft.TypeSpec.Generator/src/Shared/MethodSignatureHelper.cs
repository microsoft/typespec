// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator
{
    internal class MethodSignatureHelper
    {
        internal static bool IsPublicApi(MethodSignatureModifiers modifiers)
            => (modifiers.HasFlag(MethodSignatureModifiers.Public) || modifiers.HasFlag(MethodSignatureModifiers.Protected))
                && !modifiers.HasFlag(MethodSignatureModifiers.Private);

        internal static bool ContainsSameParameters(MethodSignature method1, MethodSignature method2)
        {
            var count = method1.Parameters.Count;
            if (count != method2.Parameters.Count)
            {
                return false;
            }

            HashSet<ParameterProvider> method1Parameters = new(method1.Parameters, new ParameterProviderVariableNameComparer());
            foreach (var method2Param in method2.Parameters)
            {
                if (!method1Parameters.Contains(method2Param))
                {
                    return false;
                }
            }

            return true;
        }

        internal static bool HaveSameParametersInSameOrder(MethodSignature method1, MethodSignature method2)
        {
            if (method1.Parameters.Count != method2.Parameters.Count)
            {
                return false;
            }

            for (int i = 0; i < method1.Parameters.Count; i++)
            {
                if (method1.Parameters[i].Name.ToVariableName() != method2.Parameters[i].Name.ToVariableName())
                {
                    return false;
                }
            }

            return true;
        }

        internal static MethodSignature BuildBackCompatMethodSignature(
            MethodSignature previousMethodSignature,
            bool hideMethod,
            bool shouldNotBeAsync = false)
        {
            if (hideMethod)
            {
                RequireMinimumParameterPrefix(previousMethodSignature);
            }

            return CreateBackCompatSignature(previousMethodSignature, hideMethod, shouldNotBeAsync);
        }

        internal static MethodSignature BuildBackCompatMethodSignature(
            MethodSignature previousMethodSignature,
            bool hideMethod,
            IReadOnlyList<MethodSignature> currentMethodSignatures,
            bool shouldNotBeAsync = false)
        {
            RequireMinimumParameterPrefix(previousMethodSignature, currentMethodSignatures);

            return CreateBackCompatSignature(previousMethodSignature, hideMethod, shouldNotBeAsync);
        }

        /// <summary>
        /// Removes the default values from the leading parameters of <paramref name="signature"/> so it
        /// can no longer be called with fewer arguments than the prefix that distinguishes it from
        /// <paramref name="currentMethodSignatures"/>. When no overloads are supplied there is nothing to
        /// compare against and every parameter becomes required.
        /// </summary>
        internal static void RequireMinimumParameterPrefix(
            MethodSignature signature,
            IReadOnlyList<MethodSignature>? currentMethodSignatures = null,
            bool preservePublishedMinimumArgumentCount = true)
        {
            int requiredParameterCount = currentMethodSignatures is null
                ? signature.Parameters.Count
                : GetMinimumRequiredParameterCount(
                    signature,
                    currentMethodSignatures,
                    preservePublishedMinimumArgumentCount);

            for (int i = 0; i < requiredParameterCount; i++)
            {
                signature.Parameters[i].DefaultValue = null;
            }
        }

        private static MethodSignature CreateBackCompatSignature(
            MethodSignature previousMethodSignature,
            bool hideMethod,
            bool shouldNotBeAsync)
        {
            var modifiers = shouldNotBeAsync
                ? previousMethodSignature.Modifiers & ~MethodSignatureModifiers.Async
                : previousMethodSignature.Modifiers;

            var attributes = hideMethod
                ? [.. previousMethodSignature.Attributes, new AttributeStatement(typeof(EditorBrowsableAttribute), Snippet.FrameworkEnumValue(EditorBrowsableState.Never))]
                : previousMethodSignature.Attributes;
            return new MethodSignature(
                previousMethodSignature.Name,
                previousMethodSignature.Description,
                modifiers,
                previousMethodSignature.ReturnType,
                previousMethodSignature.ReturnDescription,
                previousMethodSignature.Parameters,
                Attributes: attributes);
        }

        private static int GetMinimumRequiredParameterCount(
            MethodSignature targetMethodSignature,
            IReadOnlyList<MethodSignature> competingMethodSignatures,
            bool preservePublishedMinimumArgumentCount)
        {
            int requiredParameterCount = 0;
            foreach (var competingMethodSignature in competingMethodSignatures)
            {
                if (competingMethodSignature.Name == targetMethodSignature.Name)
                {
                    requiredParameterCount = Math.Max(
                        requiredParameterCount,
                        GetMinimumRequiredParameterCount(
                            targetMethodSignature,
                            competingMethodSignature,
                            preservePublishedMinimumArgumentCount));
                }
            }

            return requiredParameterCount;
        }

        private static int GetMinimumRequiredParameterCount(
            MethodSignature targetMethodSignature,
            MethodSignature competingMethodSignature,
            bool preservePublishedMinimumArgumentCount)
        {
            if (competingMethodSignature.Parameters.Any(p => p.IsRef || p.IsOut))
            {
                return 0;
            }

            int targetMinimumArgumentCount = GetMinimumArgumentCount(targetMethodSignature);
            int competingMinimumArgumentCount = GetMinimumArgumentCount(competingMethodSignature);
            int competingMaximumArgumentCount = competingMethodSignature.Parameters.Any(p => p.IsParams)
                ? int.MaxValue
                : competingMethodSignature.Parameters.Count;

            // No argument count can reach both overloads, so the target needs no additional
            // required parameters.
            if (Math.Max(targetMinimumArgumentCount, competingMinimumArgumentCount) >
                Math.Min(targetMethodSignature.Parameters.Count, competingMaximumArgumentCount))
            {
                return 0;
            }

            // When the target is a published signature, do not raise its minimum argument count to
            // address overlap with a competitor that cannot apply to its shorter calls.
            if (preservePublishedMinimumArgumentCount &&
                competingMinimumArgumentCount > targetMinimumArgumentCount)
            {
                return 0;
            }

            // Require only the prefix up to and including the first position whose parameter type
            // differs. Any call supplying that many arguments can no longer bind to the competing
            // overload, so every trailing parameter keeps the optionality it had previously.
            int overlappingParameterCount = Math.Min(
                targetMethodSignature.Parameters.Count,
                competingMethodSignature.Parameters.Count);
            for (int i = 0; i < overlappingParameterCount; i++)
            {
                if (!targetMethodSignature.Parameters[i].Type.AreNamesEqual(competingMethodSignature.Parameters[i].Type))
                {
                    return Math.Max(i + 1, targetMinimumArgumentCount);
                }
            }

            // The shorter signature is a positional prefix of the other, so no argument count
            // distinguishes them. Fall back to requiring every parameter.
            return targetMethodSignature.Parameters.Count;
        }

        private static int GetMinimumArgumentCount(MethodSignature methodSignature)
        {
            int count = 0;
            foreach (var parameter in methodSignature.Parameters)
            {
                if (parameter.DefaultValue is not null || parameter.IsParams)
                {
                    break;
                }

                count++;
            }

            return count;
        }

        private sealed class ParameterProviderVariableNameComparer : IEqualityComparer<ParameterProvider>
        {
            public bool Equals(ParameterProvider? x, ParameterProvider? y)
            {
                if (ReferenceEquals(x, y))
                {
                    return true;
                }

                if (x is null || y is null)
                {
                    return false;
                }

                return x.Type.AreNamesEqual(y.Type)
                    && x.Name.ToVariableName() == y.Name.ToVariableName()
                    && x.Attributes.SequenceEqual(y.Attributes);
            }

            public int GetHashCode(ParameterProvider obj)
            {
                return HashCode.Combine(obj.Name.ToVariableName());
            }
        }
    }
}
