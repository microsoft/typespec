// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;

namespace AutoRest.CSharp.Output.Models.Types
{
    // TODO -- eventually we should combine everything in this class into TypeProvider
    internal abstract class ExpressionTypeProvider : TypeProvider
    {
        internal static IEnumerable<ExpressionTypeProvider> GetHelperProviders()
        {
            yield return ChangeTrackingListProvider.Instance;
            yield return OptionalTypeProvider.Instance;
        }

        protected ExpressionTypeProvider(string defaultNamespace, SourceInputModel? sourceInputModel)
            : base(defaultNamespace, sourceInputModel)
        {
            DeclarationModifiers = TypeSignatureModifiers.Partial | TypeSignatureModifiers.Public;
        }

        private IReadOnlyList<string>? _usings;
        public IReadOnlyList<string> Usings => _usings ??= BuildUsings().ToArray();

        public TypeSignatureModifiers DeclarationModifiers { get; protected init; }

        protected virtual IEnumerable<string> BuildUsings()
        {
            yield break;
        }

        [EditorBrowsable(EditorBrowsableState.Never)]
        protected override string DefaultAccessibility { get; } = "public";

        public virtual CSharpType? Inherits { get; protected init; }

        private IReadOnlyList<CSharpType>? _implements;
        public virtual IReadOnlyList<CSharpType> Implements => _implements ??= BuildImplements().ToArray();

        private IReadOnlyList<PropertyDeclaration>? _properties;
        public virtual IReadOnlyList<PropertyDeclaration> Properties => _properties ??= BuildProperties().ToArray();

        private IReadOnlyList<Method>? _methods;
        public IReadOnlyList<Method> Methods => _methods ??= BuildMethods().ToArray();

        private IReadOnlyList<Method>? _constructors;
        public IReadOnlyList<Method> Constructors => _constructors ??= BuildConstructors().ToArray();

        private IReadOnlyList<FieldDeclaration>? _fields;
        public IReadOnlyList<FieldDeclaration> Fields => _fields ??= BuildFields().ToArray();

        protected virtual IEnumerable<PropertyDeclaration> BuildProperties()
        {
            yield break;
        }

        protected virtual IEnumerable<FieldDeclaration> BuildFields()
        {
            yield break;
        }

        protected virtual IEnumerable<CSharpType> BuildImplements()
        {
            yield break;
        }

        protected virtual IEnumerable<Method> BuildMethods()
        {
            yield break;
        }

        protected virtual IEnumerable<Method> BuildConstructors()
        {
            yield break;
        }
    }
}
