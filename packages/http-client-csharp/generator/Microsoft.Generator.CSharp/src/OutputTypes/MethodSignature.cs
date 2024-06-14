// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents a method signature.
    /// </summary>
    /// <param name="Name">The name of the method.</param>
    /// <param name="Summary">The summary of the method.</param>
    /// <param name="Description">The description of the method.</param>
    /// <param name="Modifiers">The modifiers of the method.</param>
    /// <param name="ReturnType">The return type of the method.</param>
    /// <param name="ReturnDescription">The description of the return value.</param>
    /// <param name="Parameters">The parameters of the method.</param>
    /// <param name="Attributes">The attributes of the method.</param>
    /// <param name="GenericArguments">The generic arguments of the method.</param>
    /// <param name="GenericParameterConstraints">The generic parameter constraints of the method.</param>
    /// <param name="ExplicitInterface">The explicit interface of the method.</param>
    /// <param name="NonDocumentComment">The non-document comment of the method.</param>
    public sealed record MethodSignature(string Name, FormattableString? Summary, FormattableString? Description, MethodSignatureModifiers Modifiers, CSharpType? ReturnType, FormattableString? ReturnDescription, IReadOnlyList<ParameterProvider> Parameters, IReadOnlyList<AttributeStatement>? Attributes = null, IReadOnlyList<CSharpType>? GenericArguments = null, IReadOnlyList<WhereExpression>? GenericParameterConstraints = null, CSharpType? ExplicitInterface = null, string? NonDocumentComment = null)
        : MethodSignatureBase(Name, Summary, Description, NonDocumentComment, Modifiers, Parameters, Attributes ?? Array.Empty<AttributeStatement>())
    {
        public static IEqualityComparer<MethodSignature> ParameterAndReturnTypeEqualityComparer = new MethodSignatureParameterAndReturnTypeEqualityComparer();

        /// <summary>
        /// Gets the C# reference string for the method.
        /// </summary>
        public FormattableString GetCRef() => $"{Name}({Parameters.GetTypesFormattable()})";

        private class MethodSignatureParameterAndReturnTypeEqualityComparer : IEqualityComparer<MethodSignature>
        {
            public bool Equals(MethodSignature? x, MethodSignature? y)
            {
                if (ReferenceEquals(x, y))
                {
                    return true;
                }

                if (x is null || y is null)
                {
                    return false;
                }

                var result = x.Name == x.Name
                    && x.ReturnType == y.ReturnType
                    && x.Parameters.SequenceEqual(y.Parameters);
                return result;
            }

            public int GetHashCode([DisallowNull] MethodSignature obj)
            {
                return HashCode.Combine(obj.Name, obj.ReturnType);
            }
        }
    }
}
