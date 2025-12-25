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

        internal static MethodSignature BuildBackCompatMethodSignature(MethodSignature previousMethodSignature, bool hideMethod)
        {
            if (hideMethod)
            {
                // make all parameter required to avoid ambiguous call sites if necessary
                foreach (var param in previousMethodSignature.Parameters)
                {
                    param.DefaultValue = null;
                }
            }

            var attributes = hideMethod
                ? [.. previousMethodSignature.Attributes, new AttributeStatement(typeof(EditorBrowsableAttribute), Snippet.FrameworkEnumValue(EditorBrowsableState.Never))]
                : previousMethodSignature.Attributes;
            return new MethodSignature(
                previousMethodSignature.Name,
                previousMethodSignature.Description,
                previousMethodSignature.Modifiers,
                previousMethodSignature.ReturnType,
                previousMethodSignature.ReturnDescription,
                previousMethodSignature.Parameters,
                Attributes: attributes);
        }

        private sealed class ParameterProviderVariableNameComparer : IEqualityComparer<ParameterProvider>
        {
            public bool Equals(ParameterProvider? x, ParameterProvider? y)
            {
                if (ReferenceEquals(x, y))
                    return true;
                if (x is null || y is null)
                    return false;

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
