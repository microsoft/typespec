// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Collections.Immutable;
using System.Diagnostics.CodeAnalysis;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.SourceInput
{
    internal static class SourceInputHelper
    {
        internal static IEnumerable<ITypeSymbol> GetSymbols(INamespaceSymbol namespaceSymbol)
        {
            foreach (var childNamespaceSymbol in namespaceSymbol.GetNamespaceMembers())
            {
                foreach (var symbol in GetSymbols(childNamespaceSymbol))
                {
                    yield return symbol;
                }
            }

            foreach (INamedTypeSymbol symbol in namespaceSymbol.GetTypeMembers())
            {
                yield return symbol;
            }
        }

        internal static bool TryGetExistingMethod(INamedTypeSymbol? type, MethodSignature signature, [MaybeNullWhen(false)] out IMethodSymbol method)
        {
            if (type is null)
            {
                method = null;
                return false;
            }

            foreach (var member in type.GetMembers())
            {
                if (member.Name != signature.Name)
                {
                    continue;
                }

                if (member is not IMethodSymbol candidate)
                {
                    continue;
                }

                if (signature.ExplicitInterface is { })
                {
                    if (candidate.MethodKind != MethodKind.ExplicitInterfaceImplementation)
                    {
                        continue;
                    }
                }
                else
                {
                    if (candidate.MethodKind != MethodKind.Ordinary)
                    {
                        continue;
                    }
                }

                if (TypesAreEqual(candidate.Parameters, signature.Parameters))
                {
                    method = candidate;
                    return true;
                }
            }

            method = null;
            return false;
        }

        private static bool TypesAreEqual(ImmutableArray<IParameterSymbol> candidateParameters, IReadOnlyList<ParameterProvider> signatureParameters)
        {
            if (candidateParameters.Length != signatureParameters.Count)
            {
                return false;
            }

            for (var i = 0; i < candidateParameters.Length; i++)
            {
                var candidateParameterType = candidateParameters[i].Type;
                var signatureParameterType = signatureParameters[i].Type;
                if (candidateParameterType is not INamedTypeSymbol typeSymbol || !typeSymbol.IsSameType(signatureParameterType))
                {
                    return false;
                }
            }

            return true;
        }
    }
}
