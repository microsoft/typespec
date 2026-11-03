// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed class DeclaredTypeSnapshot
    {
        internal CSharpType Identity { get; }
        internal string Name { get; }
        internal string Namespace { get; }
        internal bool IsNullable { get; }
        internal bool IsValueType { get; }
        internal ImmutableArray<DeclaredTypeSnapshot> Arguments { get; }
        private readonly long _version;
        private readonly DeclaredTypeSnapshot? _declaring;

        private DeclaredTypeSnapshot(CSharpType type, ImmutableArray<DeclaredTypeSnapshot> arguments, DeclaredTypeSnapshot? declaring)
        {
            Identity = type;
            Name = type.Name;
            Namespace = type.Namespace;
            IsNullable = type.IsNullable;
            IsValueType = type.IsValueType;
            Arguments = arguments;
            _version = type.IdentityVersion;
            _declaring = declaring;
        }

        internal static bool TryCapture(CSharpType type, out DeclaredTypeSnapshot? snapshot) =>
            TryCapture(type, new HashSet<CSharpType>(ReferenceEqualityComparer.Instance), out snapshot);

        private static bool TryCapture(CSharpType type, HashSet<CSharpType> ancestors, out DeclaredTypeSnapshot? snapshot)
        {
            snapshot = null;
            if (type is null || !ancestors.Add(type) || type.IsLiteral || type.HasUnionMetadata || !ContractCollections.TryCopy(type.Arguments, out var arguments))
            {
                return false;
            }
            var children = ImmutableArray.CreateBuilder<DeclaredTypeSnapshot>();
            foreach (var argument in arguments)
            {
                if (!TryCapture(argument, ancestors, out var child)) { return false; }
                children.Add(child!);
            }
            DeclaredTypeSnapshot? declaring = null;
            if (type.DeclaringType is { } parent && !TryCapture(parent, ancestors, out declaring)) { return false; }
            ancestors.Remove(type);
            snapshot = new(type, children.ToImmutable(), declaring);
            return true;
        }

        internal bool IsCurrent() => Identity.IdentityVersion == _version && Identity.Name == Name && Identity.Namespace == Namespace &&
            ContractCollections.SameReferences(Identity.Arguments, Arguments.Select(a => a.Identity).ToImmutableArray()) &&
            Arguments.All(a => a.IsCurrent()) && ReferenceEquals(Identity.DeclaringType, _declaring?.Identity) && (_declaring?.IsCurrent() ?? true);
    }
}
