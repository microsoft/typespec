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
            bool shouldNotBeAsync = false,
            IReadOnlyList<MethodSignature>? currentMethodSignatures = null)
        {
            // Require parameters through the first positional type difference with every competing
            // overload. If one signature is only a type-prefix of the other, require one beyond the
            // shared prefix so calls that omit trailing arguments bind only one overload.
            int requiredParameterCount = currentMethodSignatures is not null
                ? GetMinimumRequiredParameterCount(previousMethodSignature, currentMethodSignatures)
                : hideMethod
                    ? previousMethodSignature.Parameters.Count
                    : 0;
            for (int i = 0; i < requiredParameterCount; i++)
            {
                previousMethodSignature.Parameters[i].DefaultValue = null;
            }

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
            MethodSignature previousMethodSignature,
            IReadOnlyList<MethodSignature> currentMethodSignatures)
        {
            int requiredParameterCount = 0;
            foreach (var currentMethodSignature in currentMethodSignatures)
            {
                if (currentMethodSignature.Name == previousMethodSignature.Name)
                {
                    requiredParameterCount = Math.Max(
                        requiredParameterCount,
                        GetMinimumRequiredParameterCount(previousMethodSignature, currentMethodSignature));
                }
            }

            return requiredParameterCount;
        }

        private static int GetMinimumRequiredParameterCount(
            MethodSignature previousMethodSignature,
            MethodSignature currentMethodSignature)
        {
            int sharedParameterCount = Math.Min(
                previousMethodSignature.Parameters.Count,
                currentMethodSignature.Parameters.Count);
            for (int i = 0; i < sharedParameterCount; i++)
            {
                var previousType = previousMethodSignature.Parameters[i].Type;
                var currentType = currentMethodSignature.Parameters[i].Type;
                if (!previousType.AreNamesEqual(currentType)
                    || previousType.IsNullable != currentType.IsNullable
                        && (previousType.IsValueType || currentType.IsValueType))
                {
                    return i + 1;
                }
            }

            return Math.Min(previousMethodSignature.Parameters.Count, sharedParameterCount + 1);
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
