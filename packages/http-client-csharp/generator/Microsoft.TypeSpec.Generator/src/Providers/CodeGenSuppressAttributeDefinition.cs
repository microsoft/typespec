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
    internal class CodeGenSuppressAttributeDefinition : TypeProvider
    {
        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenSuppressAttribute";

        private protected sealed override NamedTypeSymbolProvider? BuildCustomCodeView(string? generatedTypeName = default) => null;
        private protected sealed override NamedTypeSymbolProvider? BuildLastContractView() => null;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(Attribute)];

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            return
            [
                    new AttributeStatement(typeof(AttributeUsageAttribute),
                [new BinaryOperatorExpression(
                    "|",
                new BinaryOperatorExpression(
                    "|",
                    FrameworkEnumValue(AttributeTargets.Class),
                    FrameworkEnumValue(AttributeTargets.Enum)),
                FrameworkEnumValue(AttributeTargets.Struct))],
                [new KeyValuePair<string, ValueExpression>("AllowMultiple", True)]),
            ];
        }

        protected override PropertyProvider[] BuildProperties() =>
        [
            new PropertyProvider(
                null,
                MethodSignatureModifiers.Public,
                typeof(string),
                "Member",
                new AutoPropertyBody(false),
                this),
            new PropertyProvider(
                null,
                MethodSignatureModifiers.Public,
                typeof(Type[]),
                "Parameters",
                new AutoPropertyBody(false),
                this)
        ];

        protected override ConstructorProvider[] BuildConstructors()
        {
            var memberParameter = new ParameterProvider("member", $"The member to suppress.", typeof(string));
            var parameterParameters = new ParameterProvider("parameters", $"The types of the parameters of the member.", typeof(Type[]), isParams: true);

            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        null,
                        MethodSignatureModifiers.Public,
                        [memberParameter, parameterParameters]),
                    new[]
                        {
                            This.Property("Member").Assign(memberParameter).Terminate(),
                            This.Property("Parameters").Assign(parameterParameters).Terminate()
                        },
                this)
            ];
        }
    }
}
