// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal class CodeGenTypeAttributeDefinition : TypeProvider
    {
        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenTypeAttribute";

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Internal | TypeSignatureModifiers.Class;

        protected override CSharpType[] BuildImplements() => [typeof(Attribute)];

        protected override IReadOnlyList<AttributeStatement> BuildAttributes()
        {
            return [new AttributeStatement(typeof(AttributeUsageAttribute),
                new BinaryOperatorExpression(
                    "|",
                    FrameworkEnumValue(AttributeTargets.Class),
                    FrameworkEnumValue(AttributeTargets.Struct)))];
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
            var parameter = new ParameterProvider("originalName", FormattableStringHelpers.Empty, typeof(string));

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
