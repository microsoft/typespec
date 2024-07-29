// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record TypeReferenceExpression : ValueExpression
    {
        private static readonly Dictionary<Type, TypeProvider> _cache = new Dictionary<Type, TypeProvider>();
        private static readonly TypeReferenceExpression _nullType = new((CSharpType?)null);

        public CSharpType? Type { get; }

        private static readonly Dictionary<CSharpType, TypeReferenceExpression> _typeCache = new Dictionary<CSharpType, TypeReferenceExpression>();
        internal static TypeReferenceExpression FromType(CSharpType? type)
        {
            if (type is null)
                return _nullType;

            if (!_typeCache.TryGetValue(type, out var result))
            {
                result = new TypeReferenceExpression(type);
                _typeCache[type] = result;
            }
            return result;
        }

        private TypeReferenceExpression(CSharpType? type)
        {
            Type = GetTypeFromDefinition(type);
        }

        internal static CSharpType? GetTypeFromDefinition(CSharpType? type)
        {
            if (type is null || !type.IsFrameworkType)
            {
                return type;
            }
            else
            {
                if (type.FrameworkType.IsSubclassOf(typeof(TypeProvider)))
                {
                    if (!_cache.TryGetValue(type.FrameworkType, out var result))
                    {
                        result = (TypeProvider)Activator.CreateInstance(type.FrameworkType, true)!;
                        _cache[type.FrameworkType] = result;
                    }
                    return _cache[type.FrameworkType].Type;
                }
                else
                {
                    return type;
                }
            }
        }

        internal override void Write(CodeWriter writer)
        {
            writer.AppendIf($"{Type}", Type is not null);
        }
    }
}
