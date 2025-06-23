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
    internal class CodeGenSerializationAttributeDefinition : TypeProvider
    {
        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "CodeGenSerializationAttribute";

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
                    FrameworkEnumValue(AttributeTargets.Class),
                    FrameworkEnumValue(AttributeTargets.Struct))],
                [
                    new KeyValuePair<string, ValueExpression>("AllowMultiple", True),
                    new KeyValuePair<string, ValueExpression>("Inherited", True)
                ])];
        }

        protected override PropertyProvider[] BuildProperties() =>
        [
            new PropertyProvider(
                $"Gets or sets the property name which these hooks should apply to.",
                MethodSignatureModifiers.Public,
                typeof(string),
                "PropertyName",
                new AutoPropertyBody(false),
                this),
            new PropertyProvider(
                $"Gets or sets the serialization name of the property.",
                MethodSignatureModifiers.Public,
                typeof(string),
                "PropertySerializationName",
                new AutoPropertyBody(true),
                this),
            new PropertyProvider(
                $"Gets or sets the method name to use when serializing the property value (property name excluded).\nThe signature of the serialization hook method must be or compatible with when invoking: private void SerializeHook(Utf8JsonWriter writer);",
                MethodSignatureModifiers.Public,
                typeof(string),
                "SerializationValueHook",
                new AutoPropertyBody(true),
                this),
            new PropertyProvider(
                $"Gets or sets the method name to use when deserializing the property value from the JSON.\nprivate static void DeserializationHook(JsonProperty property, ref TypeOfTheProperty propertyValue); // if the property is required\nprivate static void DeserializationHook(JsonProperty property, ref Optional&lt;TypeOfTheProperty&gt; propertyValue); // if the property is optional",
                MethodSignatureModifiers.Public,
                typeof(string),
                "DeserializationValueHook",
                new AutoPropertyBody(true),
                this)
        ];

        protected override ConstructorProvider[] BuildConstructors()
        {
            var propertyNameParameter = new ParameterProvider("propertyName", $"The property name which these hooks apply to.", typeof(string));
            var propertySerializationNameParameter = new ParameterProvider("propertySerializationName", $"The serialization name of the property.", typeof(string));
            return
            [
                new ConstructorProvider(
                    new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [propertyNameParameter]),
                    This.Property("PropertyName").Assign(propertyNameParameter).Terminate(),
                    this),
                new ConstructorProvider(
                    new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [propertyNameParameter, propertySerializationNameParameter]),
                    new[]
                    {
                        This.Property("PropertyName").Assign(propertyNameParameter).Terminate(),
                        This.Property("PropertySerializationName").Assign(propertySerializationNameParameter).Terminate()
                    },
                    this)
            ];
        }
    }
}
