// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    /// <summary>
    /// Represents the base class for a method signature.
    /// </summary>
    /// <param name="Name">The name of the method.</param>
    /// <param name="Description">The description of the method.</param>
    /// <param name="NonDocumentComment">The non-document comment of the method.</param>
    /// <param name="Modifiers">The modifiers of the method.</param>
    /// <param name="Parameters">The parameters of the method.</param>
    /// <param name="Attributes">The attributes of the method.</param>
    public abstract class MethodSignatureBase
    {
        public MethodSignatureBase(string name,
            FormattableString? description,
            string? nonDocumentComment,
            MethodSignatureModifiers modifiers,
            IReadOnlyList<ParameterProvider> parameters,
            IReadOnlyList<AttributeStatement> attributes,
            CSharpType? returnType)
        {
            if (modifiers.HasFlag(MethodSignatureModifiers.Implicit) && returnType == null)
            {
                throw new ArgumentNullException(nameof(returnType), "Implicit operator must specify a return type.");
            }
            Name = name;
            Attributes = attributes;
            Parameters = parameters;
            Modifiers = modifiers;
            NonDocumentComment = nonDocumentComment;
            Description = description;
            ReturnType = returnType;
        }

        public CSharpType? ReturnType { get; private set; }

        public IReadOnlyList<AttributeStatement> Attributes { get; internal set; }

        public IReadOnlyList<ParameterProvider> Parameters { get; internal set; }

        public MethodSignatureModifiers Modifiers { get; internal set; }

        public string? NonDocumentComment { get; internal set; }

        public FormattableString? Description { get; internal set; }

        public string Name { get; internal set; }

        public void Update(string? name = default, FormattableString? description = default, string? nonDocumentComment = default, MethodSignatureModifiers? modifiers = default, IReadOnlyList<ParameterProvider>? parameters = default, IReadOnlyList<AttributeStatement>? attributes = default, CSharpType? returnType = default)
        {
            if (name != null)
            {
                Name = name;
            }
            if (description != null)
            {
                Description = description;
            }
            if (nonDocumentComment != null)
            {
                NonDocumentComment = nonDocumentComment;
            }
            if (modifiers != null)
            {
                Modifiers = modifiers.Value;
            }
            if (parameters != null)
            {
                Parameters = parameters;
            }
            if (attributes != null)
            {
                Attributes = attributes;
            }
            if (returnType != null)
            {
                ReturnType = returnType;
            }
        }

        public static readonly IEqualityComparer<MethodSignatureBase> SignatureComparer = new MethodSignatureBaseEqualityComparer();

        private class MethodSignatureBaseEqualityComparer : IEqualityComparer<MethodSignatureBase>
        {
            public bool Equals(MethodSignatureBase? x, MethodSignatureBase? y)
            {
                if (ReferenceEquals(x, y))
                {
                    return true;
                }

                if (x is null || y is null)
                {
                    return false;
                }

                if (x.Parameters.Count != y.Parameters.Count)
                {
                    return false;
                }

                bool xIsOperator = x.Modifiers.HasFlag(MethodSignatureModifiers.Operator);
                bool yIsOperator = y.Modifiers.HasFlag(MethodSignatureModifiers.Operator);
                if (xIsOperator != yIsOperator)
                {
                    return false;
                }

                // For operators, we need to also check the return type and operator type (explicit vs implicit)
                // since operators can have the same "name" (the target type) but different signatures
                if (xIsOperator)
                {
                    // Check explicit vs implicit - both flags must match
                    bool xIsExplicit = x.Modifiers.HasFlag(MethodSignatureModifiers.Explicit);
                    bool yIsExplicit = y.Modifiers.HasFlag(MethodSignatureModifiers.Explicit);
                    bool xIsImplicit = x.Modifiers.HasFlag(MethodSignatureModifiers.Implicit);
                    bool yIsImplicit = y.Modifiers.HasFlag(MethodSignatureModifiers.Implicit);
                    if (xIsExplicit != yIsExplicit || xIsImplicit != yIsImplicit)
                    {
                        return false;
                    }

                    // For operators, the return type is crucial for matching.
                    // Nullability is part of the conversion-operator signature in C#
                    // (e.g., `implicit operator T(string)` and `implicit operator T?(string)`
                    // are distinct), so we compare both the type name and the nullability.
                    if (x.ReturnType != null && y.ReturnType != null)
                    {
                        if (!x.ReturnType.AreNamesEqual(y.ReturnType)
                            || x.ReturnType.IsNullable != y.ReturnType.IsNullable)
                        {
                            return false;
                        }
                    }
                    else if (x.ReturnType != y.ReturnType) // One is null, the other is not
                    {
                        return false;
                    }

                    // Compare user-defined operators by symbol; conversion operators are fully identified by modifiers/return type/params.
                    if (!xIsImplicit && !xIsExplicit
                        && NormalizeOperatorName(GetFullMethodName(x)) != NormalizeOperatorName(GetFullMethodName(y)))
                    {
                        return false;
                    }
                }
                else if (GetFullMethodName(x) != GetFullMethodName(y))
                {
                    return false;
                }

                for (int i = 0; i < x.Parameters.Count; i++)
                {
                    if (!x.Parameters[i].Type.AreNamesEqual(y.Parameters[i].Type))
                    {
                        return false;
                    }
                }

                return true;
            }

            public int GetHashCode([DisallowNull] MethodSignatureBase obj)
            {
                return HashCode.Combine(obj.Name, obj.ReturnType);
            }

            private static string GetFullMethodName(MethodSignatureBase method)
            {
                if (method is MethodSignature methodSignature)
                {
                    return methodSignature.FullMethodName;
                }

                return method.Name;
            }

            private static string NormalizeOperatorName(string name)
            {
                // Strip Roslyn's "operator " prefix so "operator ==" matches "==".
                const string operatorPrefix = "operator ";
                return name.StartsWith(operatorPrefix, StringComparison.Ordinal)
                    ? name.Substring(operatorPrefix.Length)
                    : name;
            }
        }
    }
}
