// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal class TestTypeProvider : TypeProvider
    {
        private readonly TypeSignatureModifiers? _declarationModifiers;
        private readonly MethodProvider[] _methods;
        private readonly PropertyProvider[] _properties;
        private readonly ConstructorProvider[] _constructors;
        private readonly MethodBodyStatement[] _attributes;
        private readonly string _name;
        private readonly string _namespace;
        protected override string BuildRelativeFilePath() => $"{Name}.cs";

        protected override string BuildName() => _name;

        protected override string BuildNamespace() => _namespace;

        protected internal override PropertyProvider[] BuildProperties() => _properties;

        protected internal override MethodProvider[] BuildMethods() => _methods;

        protected internal override ConstructorProvider[] BuildConstructors() => _constructors;
        protected override TypeProvider[] BuildNestedTypes() => NestedTypesInternal ?? base.BuildNestedTypes();

        protected override IReadOnlyList<MethodBodyStatement> BuildAttributes() => _attributes;

        public static readonly TypeProvider Empty = new TestTypeProvider();

        internal TestTypeProvider(
            string? name = null,
            TypeSignatureModifiers? declarationModifiers = null,
            IEnumerable<MethodProvider>? methods = null,
            IEnumerable<PropertyProvider>? properties = null,
            string? ns = null,
            IEnumerable<ConstructorProvider>? constructors = null,
            IEnumerable<MethodBodyStatement>? attributes = null)
        {
            _declarationModifiers = declarationModifiers;
            _methods = methods?.ToArray() ?? [];
            _properties = properties?.ToArray() ?? [];
            _constructors = constructors?.ToArray() ?? [];
            _attributes = attributes?.ToArray() ?? [];
            _name = name ?? "TestName";
            _namespace = ns ?? "Test";
        }

        internal TypeProvider[]? NestedTypesInternal { get; set; }

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _declarationModifiers ?? base.BuildDeclarationModifiers();
    }
}
