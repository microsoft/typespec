// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal sealed class DiscriminatedUnionSerializationProvider(InputUnionType union) : InternalHelperProvider(union)
    {
        protected override string BuildName() => $"{(union.IsExactName ? union.Name : union.Name.ToIdentifierName())}UnionSerialization";

        protected override string BuildNamespace() => string.IsNullOrEmpty(union.Namespace)
            ? base.BuildNamespace()
            : ScmCodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(union.Namespace);

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Models", BuildNamespace(), $"{Name}.cs");

        protected override MethodProvider[] BuildMethods()
        {
            var writer = new ParameterProvider("writer", FormattableStringHelpers.Empty, typeof(Utf8JsonWriter));
            var value = new ParameterProvider("value", FormattableStringHelpers.Empty,
                ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union.BaseModel!)!);
            var element = new ParameterProvider("element", FormattableStringHelpers.Empty, typeof(JsonElement));
            var options = new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(ModelReaderWriterOptions));
            var jsonWriter = writer.As<Utf8JsonWriter>();
            var jsonElement = element.As<JsonElement>();

            List<MethodBodyStatement> serialize =
            [
                new IfStatement(value.Equal(Null)) { jsonWriter.WriteNullValue(), Return() }
            ];
            foreach (var (tag, model) in union.DiscriminatedSubtypes!.OrderByDescending(entry => entry.Value.GetAllBaseModels().Count()))
            {
                var type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(model)!;
                var matches = value.Is(new DeclarationExpression(type, "variant", out var variant));
                serialize.Add(new IfStatement(matches)
                {
                    jsonWriter.WriteStartObject(),
                    jsonWriter.WritePropertyName(union.DiscriminatorPropertyName!),
                    jsonWriter.WriteStringValue(Literal(tag)),
                    jsonWriter.WritePropertyName(union.EnvelopePropertyName!),
                    jsonWriter.WriteObjectValue(variant.As(type), options),
                    jsonWriter.WriteEndObject(),
                    Return()
                });
            }
            serialize.Add(Throw(New.Instance<ArgumentException>(
                Literal($"The value is not a variant of union '{union.Name}'."), Nameof(value))));

            var hasDiscriminator = jsonElement.TryGetProperty(union.DiscriminatorPropertyName!, out var discriminator);
            var hasPayload = jsonElement.TryGetProperty(union.EnvelopePropertyName!, out var payload);
            var invalidEnvelope = jsonElement.ValueKind().NotEqual(FrameworkEnumValue(JsonValueKind.Object))
                .Or(Not(hasDiscriminator))
                .Or(Not(discriminator.ValueKindEqualsString()))
                .Or(Not(hasPayload))
                .Or(payload.ValueKind().NotEqual(FrameworkEnumValue(JsonValueKind.Object)));
            var cases = union.DiscriminatedSubtypes!.Select(entry => new SwitchCaseStatement(
                Literal(entry.Key),
                Return(MrwSerializationTypeDefinition.GetDeserializationMethodInvocationForType(
                    ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(entry.Value)!,
                    payload, payload.GetUtf8Bytes(), options)))).ToList();
            cases.Add(SwitchCaseStatement.Default(Throw(New.Instance<JsonException>(
                Literal($"Unknown discriminator value for union '{union.Name}'.")))));

            return
            [
                new MethodProvider(
                    new MethodSignature("Serialize", null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static,
                        null, null, [writer, value, options]),
                    serialize, this),
                new MethodProvider(
                    new MethodSignature("Deserialize", null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static,
                        value.Type, null, [element, options]),
                    new MethodBodyStatement[]
                    {
                        new IfStatement(jsonElement.ValueKindEqualsNull()) { Return(Null) },
                        new IfStatement(invalidEnvelope)
                        {
                            Throw(New.Instance<JsonException>(Literal($"Invalid object envelope for union '{union.Name}'.")))
                        },
                        new SwitchStatement(discriminator.GetString(), [.. cases])
                    }, this)
            ];
        }

        internal static bool RequiresEnvelope(InputType? type) => type switch
        {
            InputUnionType { BaseModel: not null, EnvelopePropertyName: not null } => true,
            InputNullableType nullable => RequiresEnvelope(nullable.Type),
            InputArrayType array => RequiresEnvelope(array.ValueType),
            InputDictionaryType dictionary => RequiresEnvelope(dictionary.ValueType),
            _ => false
        };

        internal static MethodBodyStatement SerializeValue(
            InputType inputType,
            CSharpType valueType,
            ValueExpression value,
            ScopedApi<Utf8JsonWriter> writer,
            ScopedApi<ModelReaderWriterOptions> options)
        {
            if (inputType is InputNullableType nullable)
            {
                return SerializeValue(nullable.Type, valueType, value, writer, options);
            }
            if (inputType is InputUnionType union)
            {
                return Static(ScmCodeModelGenerator.Instance.TypeFactory.CreateDiscriminatedUnionSerialization(union).Type)
                    .Invoke("Serialize", [writer, value, options]).Terminate();
            }

            MethodBodyStatement serialize;
            if (inputType is InputArrayType array)
            {
                serialize = new MethodBodyStatement[]
                {
                    writer.WriteStartArray(),
                    new ForEachStatement("item", value.As(valueType), out var item)
                    {
                        SerializeValue(array.ValueType, valueType.ElementType, item, writer, options)
                    },
                    writer.WriteEndArray()
                };
            }
            else if (inputType is InputDictionaryType dictionary)
            {
                serialize = new MethodBodyStatement[]
                {
                    writer.WriteStartObject(),
                    new ForEachStatement("item", new DictionaryExpression(valueType, value), out KeyValuePairExpression item)
                    {
                        writer.WritePropertyName(item.Key),
                        SerializeValue(dictionary.ValueType, valueType.ElementType, item.Value, writer, options)
                    },
                    writer.WriteEndObject()
                };
            }
            else
            {
                throw new InvalidOperationException($"Expected an enveloped union or collection, not '{inputType.Name}'.");
            }
            return new IfElseStatement(value.Equal(Null), writer.WriteNullValue(), serialize);
        }

        internal static MethodBodyStatement DeserializeValue(
            InputType inputType,
            CSharpType valueType,
            ScopedApi<JsonElement> element,
            ScopedApi<ModelReaderWriterOptions> options,
            out ValueExpression value)
        {
            if (inputType is InputNullableType nullable)
            {
                return DeserializeValue(nullable.Type, valueType, element, options, out value);
            }
            if (inputType is InputUnionType union)
            {
                value = Static(ScmCodeModelGenerator.Instance.TypeFactory.CreateDiscriminatedUnionSerialization(union).Type)
                    .Invoke("Deserialize", [element, options]);
                return MethodBodyStatement.Empty;
            }

            var result = new VariableExpression(valueType, "unionValue");
            MethodBodyStatement deserialize;
            if (inputType is InputArrayType array)
            {
                deserialize = new MethodBodyStatement[]
                {
                    Declare("array", New.List(valueType.ElementType), out var list),
                    ForEachStatement.Create("item", element.EnumerateArray(), out ScopedApi<JsonElement> item).Add(
                        new MethodBodyStatement[]
                        {
                            DeserializeValue(array.ValueType, valueType.ElementType, item, options, out var itemValue),
                            list.Add(itemValue)
                        }),
                    result.Assign(list).Terminate()
                };
            }
            else if (inputType is InputDictionaryType dictionary)
            {
                deserialize = new MethodBodyStatement[]
                {
                    Declare("dictionary", New.Dictionary(typeof(string), valueType.ElementType), out var dict),
                    ForEachStatement.Create("property", element.EnumerateObject(), out ScopedApi<JsonProperty> property).Add(
                        new MethodBodyStatement[]
                        {
                            DeserializeValue(dictionary.ValueType, valueType.ElementType, property.Value(), options, out var itemValue),
                            dict.Add(property.Name(), itemValue)
                        }),
                    result.Assign(dict).Terminate()
                };
            }
            else
            {
                throw new InvalidOperationException($"Expected an enveloped union or collection, not '{inputType.Name}'.");
            }
            value = result;
            return new MethodBodyStatement[]
            {
                Declare(result, Null),
                new IfStatement(Not(element.ValueKindEqualsNull())) { deserialize }
            };
        }
    }
}
