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
    internal class CodeGenTypeAttributeDefinition : TypeProvider
    {
        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenTypeAttribute";

        private protected sealed override NamedTypeSymbolProvider? BuildCustomCodeView(string? generatedTypeName = default) => null;
        private protected sealed override NamedTypeSymbolProvider? BuildLastContractView() => null;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(Attribute)];

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            return [new AttributeStatement(typeof(AttributeUsageAttribute),
            [new BinaryOperatorExpression(
                "|",
                new BinaryOperatorExpression(
                    "|",
                    FrameworkEnumValue(AttributeTargets.Class),
                    FrameworkEnumValue(AttributeTargets.Enum)),
                FrameworkEnumValue(AttributeTargets.Struct))])];
        }

        protected override PropertyProvider[] BuildProperties() =>
        [
            new PropertyProvider(
                null,
                MethodSignatureModifiers.Public,
                typeof(string),
                "OriginalName",
                new AutoPropertyBody(false),
                this)
        ];

        protected override ConstructorProvider[] BuildConstructors()
        {
            var parameter = new ParameterProvider("originalName", $"The original name of the type.", typeof(string));

            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        null,
                        MethodSignatureModifiers.Public,
                        [parameter]),
                    This.Property("OriginalName").Assign(parameter).Terminate(),
                this)
            ];
        }
    }
}
