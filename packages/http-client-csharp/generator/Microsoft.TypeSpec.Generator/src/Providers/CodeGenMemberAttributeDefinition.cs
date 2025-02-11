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
    internal class CodeGenMemberAttributeDefinition : TypeProvider
    {
        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenMemberAttribute";

        private protected sealed override NamedTypeSymbolProvider? GetCustomCodeView() => null;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [new CodeGenTypeAttributeDefinition().Type];

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            return [new AttributeStatement(typeof(AttributeUsageAttribute),
                new BinaryOperatorExpression(
                    "|",
                    FrameworkEnumValue(AttributeTargets.Property),
                    FrameworkEnumValue(AttributeTargets.Field)))];
        }
        protected override ConstructorProvider[] BuildConstructors()
        {
            var parameter = new ParameterProvider("originalName", FormattableStringHelpers.Empty, typeof(string));

            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        null,
                        MethodSignatureModifiers.Public,
                        [parameter],
                        Initializer: new ConstructorInitializer(IsBase: true, [parameter])),
                    MethodBodyStatement.Empty,
                this)
            ];
        }
    }
}
