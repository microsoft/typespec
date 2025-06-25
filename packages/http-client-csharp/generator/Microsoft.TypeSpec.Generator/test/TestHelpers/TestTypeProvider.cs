// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal class TestTypeProvider : TypeProvider
    {
        private readonly TypeSignatureModifiers? _declarationModifiers;
        private readonly MethodProvider[] _methods;
        private readonly FieldProvider[] _fields;
        private readonly PropertyProvider[] _properties;
        private readonly ConstructorProvider[] _constructors;

        private readonly string _name;
        protected override string BuildRelativeFilePath() => $"{Name}.cs";

        protected override string BuildName() => _name;

        protected override string BuildNamespace() => "Test";

        protected override MethodProvider[] BuildMethods() => _methods;
        protected override TypeProvider[] BuildNestedTypes() => NestedTypesInternal ?? base.BuildNestedTypes();

        protected override FieldProvider[] BuildFields() => _fields;
        protected override PropertyProvider[] BuildProperties() => _properties;
        protected override ConstructorProvider[] BuildConstructors() => _constructors;

        public static readonly TypeProvider Empty = new TestTypeProvider();

        internal TestTypeProvider(
            string? name = null,
            TypeSignatureModifiers? declarationModifiers = null,
            IEnumerable<MethodProvider>? methods = null,
            IEnumerable<FieldProvider>? fields = null,
            IEnumerable<PropertyProvider>? properties = null,
            IEnumerable<ConstructorProvider>? constructors = null,
            IEnumerable<TypeProvider>? nestedTypes = null)
        {
            _declarationModifiers = declarationModifiers;
            _methods = methods?.ToArray() ?? [];
            _fields = fields?.ToArray() ?? [];
            _properties = properties?.ToArray() ?? [];
            _constructors = constructors?.ToArray() ?? [];
            NestedTypesInternal = nestedTypes?.ToArray() ?? [];
            _name = name ?? "TestName";
        }

        internal TypeProvider[]? NestedTypesInternal { get; set; }

        protected override TypeSignatureModifiers BuildDeclarationModifiers() => _declarationModifiers ?? base.BuildDeclarationModifiers();
    }
}
