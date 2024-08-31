// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.CodeAnalysis;
using TypeSpec.Generator.Primitives;

namespace TypeSpec.Generator
{
    internal static class NamedTypeSymbolExtensions
    {
        public static bool IsSameType(this INamedTypeSymbol symbol, CSharpType type)
        {
            if (type.IsValueType && type.IsNullable)
            {
                if (symbol.ConstructedFrom.SpecialType != SpecialType.System_Nullable_T)
                    return false;
                return IsSameType((INamedTypeSymbol)symbol.TypeArguments.Single(), type.WithNullable(false));
            }

            if (symbol.ContainingNamespace.ToString() != type.Namespace || symbol.Name != type.Name || symbol.TypeArguments.Length != type.Arguments.Count)
            {
                return false;
            }

            for (int i = 0; i < type.Arguments.Count; ++i)
            {
                if (!IsSameType((INamedTypeSymbol)symbol.TypeArguments[i], type.Arguments[i]))
                {
                    return false;
                }
            }
            return true;
        }
    }
}
