// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Providers
{
    internal class CodeGenNamespaceAttributeDefinition : TypeProvider
    {
        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenNamespaceAttribute";

        protected override string BuildNamespace() => CodeModelGenerator.CustomizationAttributeNamespace;

        private protected sealed override NamedTypeSymbolProvider? BuildCustomCodeView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;
        private protected sealed override NamedTypeSymbolProvider? BuildLastContractView(string? generatedTypeName = default, string? generatedTypeNamespace = default) => null;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;

        protected internal override CSharpType[] BuildImplements() => [typeof(Attribute)];

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            return [new AttributeStatement(typeof(AttributeUsageAttribute),
                [FrameworkEnumValue(AttributeTargets.Assembly)],
                [
                    new KeyValuePair<string, ValueExpression>("AllowMultiple", True)
                ])];
        }

        protected internal override PropertyProvider[] BuildProperties() =>
        [
            new PropertyProvider(
                $"Gets the original name of the type whose namespace should be changed.",
                MethodSignatureModifiers.Public,
                typeof(string),
                "TypeName",
                new AutoPropertyBody(false),
                this),
            new PropertyProvider(
                $"Gets the new namespace for the type.",
                MethodSignatureModifiers.Public,
                typeof(string),
                "Namespace",
                new AutoPropertyBody(false),
                this)
        ];

        protected internal override ConstructorProvider[] BuildConstructors()
        {
            var typeNameParameter = new ParameterProvider("typeName", $"The original name of the type.", typeof(string));
            var namespaceParameter = new ParameterProvider("namespace", $"The new namespace for the type.", typeof(string));

            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        null,
                        MethodSignatureModifiers.Public,
                        [typeNameParameter, namespaceParameter]),
                    new[]
                    {
                        This.Property("TypeName").Assign(typeNameParameter).Terminate(),
                        This.Property("Namespace").Assign(namespaceParameter).Terminate()
                    },
                this)
            ];
        }
    }
}
