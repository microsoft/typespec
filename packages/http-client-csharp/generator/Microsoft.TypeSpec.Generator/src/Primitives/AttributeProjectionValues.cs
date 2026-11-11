// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    // Created with the canonical metadata projection, before its owned list is
    // exposed. Observing the projection never forces an attribute getter/Write.
    internal sealed class AttributeProjectionValues
    {
        private readonly ImmutableArray<ValueExpression> _roots;
        private readonly List<(ScopedApi Node, ValueExpression Child, long Revision)> _wrappers = [];
        private readonly List<DeclaredTypeSnapshot> _types = [];
        private readonly bool _supported;

        internal AttributeProjectionValues(IReadOnlyList<ValueExpression> values)
        {
            if (!ContractCollections.TryCopy(values, out _roots))
            {
                return;
            }
            foreach (var root in _roots)
            {
                var value = root;
                var visited = new HashSet<ValueExpression>(ReferenceEqualityComparer.Instance);
                while (value is ScopedApi wrapper && AttributeSnapshot.IsKnownWrapper(wrapper))
                {
                    if (!visited.Add(value))
                    {
                        return;
                    }
                    _wrappers.Add((wrapper, wrapper.Original, wrapper.DeclarationRevision));
                    value = wrapper.Original;
                }
                if (value is LiteralExpression literal && IsImmutableConstant(literal.Literal))
                {
                    continue;
                }
                if (value.GetType() == typeof(TypeOfExpression) &&
                    DeclaredTypeSnapshot.TryCapture(((TypeOfExpression)value).Type, out var type))
                {
                    _types.Add(type!);
                    continue;
                }
                return;
            }
            _supported = true;
        }

        internal bool IsCurrent(IReadOnlyList<ValueExpression> values) => _supported &&
            ContractCollections.SameReferences(values, _roots) &&
            _wrappers.All(item => item.Node.DeclarationRevision == item.Revision && ReferenceEquals(item.Node.Original, item.Child)) &&
            _types.All(type => type.IsCurrent());

        private static bool IsImmutableConstant(object? value) => value is null or string or bool or char or byte or sbyte or
            short or ushort or int or uint or long or ulong or float or double or decimal || value.GetType().IsEnum;
    }
}
