// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests
{
    /// <summary>
    /// A sample generator-specific custom-code attribute definition that a derived generator could contribute
    /// via <c>AddCustomCodeAttributeProvider</c>. Used to validate that custom code referencing the attribute is
    /// parsed and the attribute is registered on the parsed type.
    /// </summary>
    public class TestCustomCodeAttributeDefinition : CustomCodeAttributeDefinition
    {
        public const string AttributeNamespace = "Sample.Customizations";

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenCustomAttribute";

        protected override string BuildNamespace() => AttributeNamespace;

        protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
            TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;

        protected internal override CSharpType[] BuildImplements() => [typeof(Attribute)];

        protected internal override PropertyProvider[] BuildProperties() =>
        [
            new PropertyProvider(
                null,
                MethodSignatureModifiers.Public,
                typeof(string),
                "Value",
                new AutoPropertyBody(false),
                this)
        ];

        protected internal override ConstructorProvider[] BuildConstructors()
        {
            var parameter = new ParameterProvider("value", $"The custom value.", typeof(string));

            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(
                        Type,
                        null,
                        MethodSignatureModifiers.Public,
                        [parameter]),
                    This.Property("Value").Assign(parameter).Terminate(),
                    this)
            ];
        }
    }
}
