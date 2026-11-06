// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Immutable;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed class ProviderParameterSnapshot
    {
        private readonly ParameterProvider _parameter;
        private readonly long _revision;
        private readonly DeclaredTypeSnapshot _type;
        private readonly ImmutableArray<AttributeStatement> _attributes;
        private readonly ImmutableArray<AttributeSnapshot> _attributeSnapshots;
        private readonly ValueExpression? _defaultValue;
        private readonly long? _defaultKeywordRevision;
        private readonly long? _defaultWrapperRevision;

        private ProviderParameterSnapshot(ParameterProvider parameter, DeclaredTypeSnapshot type,
            ImmutableArray<AttributeStatement> attributes, ImmutableArray<AttributeSnapshot> snapshots)
        {
            _parameter = parameter;
            _revision = parameter.DeclarationRevision;
            _type = type;
            _attributes = attributes;
            _attributeSnapshots = snapshots;
            _defaultValue = parameter.DefaultValue;
            _defaultKeywordRevision = (parameter.DefaultValue as KeywordExpression)?.DeclarationRevision;
            _defaultWrapperRevision = (parameter.DefaultValue as ScopedApi)?.DeclarationRevision;
        }

        internal static bool TryCapture(ParameterProvider parameter, out ProviderParameterSnapshot? snapshot)
        {
            snapshot = null;
            if (!DeclaredTypeSnapshot.TryCapture(parameter.Type, out var type) ||
                !ContractCollections.TryCopy(parameter.Attributes, out var attributes)) { return false; }
            var children = ImmutableArray.CreateBuilder<AttributeSnapshot>();
            foreach (var attribute in attributes)
            {
                if (!AttributeSnapshot.TryCapture(attribute, out var child)) { return false; }
                children.Add(child!);
            }
            snapshot = new(parameter, type!, attributes, children.ToImmutable());
            return true;
        }

        internal bool IsCurrent() => _parameter.DeclarationRevision == _revision && ReferenceEquals(_parameter.Type, _type.Identity) &&
            _type.IsCurrent() && ReferenceEquals(_parameter.DefaultValue, _defaultValue) &&
            (_defaultValue is not KeywordExpression keyword || keyword.DeclarationRevision == _defaultKeywordRevision) &&
            (_defaultValue is not ScopedApi wrapper || wrapper.DeclarationRevision == _defaultWrapperRevision) &&
            ContractCollections.SameReferences(_parameter.Attributes, _attributes) && _attributeSnapshots.All(a => a.IsCurrent());
    }
}
