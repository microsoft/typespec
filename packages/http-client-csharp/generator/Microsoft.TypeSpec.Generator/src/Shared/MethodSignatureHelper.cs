// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.ComponentModel;
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

            HashSet<ParameterProvider> method1Parameters = [.. method1.Parameters];
            foreach (var method2Param in method2.Parameters)
            {
                if (!method1Parameters.Contains(method2Param))
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
    }
}
