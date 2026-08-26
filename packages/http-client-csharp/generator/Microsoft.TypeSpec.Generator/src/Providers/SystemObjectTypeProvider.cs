// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents a type from an external assembly (system or referenced assembly) that is not part of the current generation.
    /// This provider is used when a generated model inherits from a type that exists in a referenced assembly
    /// but doesn't have a Roslyn type symbol available in the customization compilation.
    /// </summary>
    internal sealed class SystemObjectTypeProvider : TypeProvider
    {
        private readonly CSharpType _type;

        public SystemObjectTypeProvider(CSharpType type)
        {
            _type = type ?? throw new ArgumentNullException(nameof(type));

            if (string.IsNullOrEmpty(_type.Namespace))
            {
                throw new ArgumentException("Type must have a namespace", nameof(type));
            }
        }

        private protected sealed override TypeProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;
        private protected sealed override TypeProvider? BuildLastContractView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;

        protected override string BuildRelativeFilePath() => throw new InvalidOperationException("This type should not be writing in generation");

        protected override string BuildName() => _type.Name;

        protected override string BuildNamespace() => _type.Namespace;

        protected override IReadOnlyList<AttributeStatement> BuildAttributes() => [];

        protected override CSharpType? BuildBaseType() => _type.BaseType;

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            // Default to public class since we don't have symbol information
            return TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;
        }

        protected internal override FieldProvider[] BuildFields() => [];

        protected internal override PropertyProvider[] BuildProperties() => [];

        protected internal override ConstructorProvider[] BuildConstructors() => [];

        protected internal override MethodProvider[] BuildMethods() => [];

        protected override bool GetIsEnum() => false;

        protected override CSharpType BuildEnumUnderlyingType() => throw new InvalidOperationException("This type is not an enum");
    }
}
