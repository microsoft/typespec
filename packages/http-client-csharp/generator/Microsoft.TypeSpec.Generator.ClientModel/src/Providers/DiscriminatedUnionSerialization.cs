// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
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
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal static class DiscriminatedUnionSerialization
    {
        internal static MethodProvider[] BuildMethods(InputUnionType union, TypeProvider serialization)
        {
            var writer = new ParameterProvider("writer", $"The JSON writer.", typeof(Utf8JsonWriter));
            var value = new ParameterProvider("value", $"The union variant to serialize.",
                ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union.BaseModel!)!);
            var element = new ParameterProvider("element", $"The JSON envelope to deserialize.", typeof(JsonElement));
            var options = new ParameterProvider("options", $"The client options for reading and writing models.", typeof(ModelReaderWriterOptions));
            var jsonWriter = writer.As<Utf8JsonWriter>();
            var jsonElement = element.As<JsonElement>();

            List<MethodBodyStatement> serialize =
            [
                new IfStatement(value.Equal(Null)) { jsonWriter.WriteNullValue(), Return() }
            ];
            foreach (var (tag, model) in union.DiscriminatedSubtypes!.OrderByDescending(entry =>
                GetTypeHierarchy(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(entry.Value)!).Count()))
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

            MethodProvider[] methods =
            [
                new MethodProvider(
                    new MethodSignature(GetSerializeMethodName(union), null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static,
                        null, null, [writer, value, options]),
                    serialize, serialization),
                new MethodProvider(
                    new MethodSignature(GetDeserializeMethodName(union), null, MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static,
                        value.Type, null, [element, options]),
                    new MethodBodyStatement[]
                    {
                        new IfStatement(jsonElement.ValueKindEqualsNull()) { Return(Null) },
                        new IfStatement(invalidEnvelope)
                        {
                            Throw(New.Instance<JsonException>(Literal($"Invalid object envelope for union '{union.Name}'.")))
                        },
                        new SwitchStatement(discriminator.GetString(), [.. cases])
                    }, serialization)
            ];
            var suppressions = ExperimentalApiHelpers.MergeSuppressions(
                ExperimentalApiHelpers.GetReferenceSuppressions(union.BaseModel),
                union.DiscriminatedSubtypes!.Values.SelectMany(model => ExperimentalApiHelpers.GetReferenceSuppressions(model)),
                union.DiscriminatedSubtypes!.Values.SelectMany(model => ExperimentalApiHelpers.GetReferenceSuppressions(
                    ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(model))));
            foreach (var method in methods)
            {
                method.Update(suppressions: suppressions);
            }
            return methods;
        }

        private static IEnumerable<CSharpType> GetTypeHierarchy(CSharpType type)
        {
            var visited = new HashSet<CSharpType>();
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            for (CSharpType? current = type; current is not null && visited.Add(current);)
            {
                if (factory.CSharpTypeMap.TryGetValue(current, out var provider) && provider is ModelProvider model)
                {
                    yield return model.Type;
                    current = model.BaseType;
                }
                else if (string.IsNullOrEmpty(current.Namespace) &&
                    factory.CSharpTypeMap.Values.OfType<ModelProvider>().FirstOrDefault(model => model.Name == current.Name) is { } generated)
                {
                    yield return generated.Type;
                    current = generated.BaseType;
                }
                else
                {
                    yield return current;
                    current = ScmCodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                        current.Namespace, current.Name, current.DeclaringType?.Name)?.BaseType ?? current.BaseType;
                }
            }
        }

        private static string GetSerializeMethodName(InputUnionType union) => $"Serialize{GetMethodSuffix(union)}";

        private static string GetDeserializeMethodName(InputUnionType union) => $"Deserialize{GetMethodSuffix(union)}";

        private static string GetMethodSuffix(InputUnionType union)
        {
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            var inputs = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace;
            var model = factory.CreateModel(union.BaseModel!)!;
            var baseTypes = GetTypeHierarchy(model.Type).Skip(1).ToHashSet();
            var baseModels = inputs.Models.Where(candidate => candidate != union.BaseModel &&
                baseTypes.Contains(factory.CreateCSharpType(candidate)!)).ToArray();
            var reserved = new HashSet<string>(StringComparer.Ordinal) { model.Name };
            var memberNames = new HashSet<string>(StringComparer.Ordinal) { model.Name };
            foreach (var inputModel in new[] { union.BaseModel! }.Concat(baseModels)
                .Concat(union.BaseModel!.GetAllDerivedModels())
                .Concat(inputs.Models.Where(candidate =>
                    GetTypeHierarchy(factory.CreateCSharpType(candidate)!).Skip(1).Contains(model.Type))).Distinct())
            {
                var provider = factory.CreateModel(inputModel)!;
                reserved.Add(provider.Name);
                memberNames.UnionWith(provider.CanonicalView.Properties.Select(property => property.Name));
                memberNames.UnionWith(provider.CanonicalView.Fields.Select(field => field.Name));
                if (provider.CustomCodeView is { } custom)
                {
                    memberNames.UnionWith(custom.Properties.Select(property => property.Name));
                    memberNames.UnionWith(custom.Fields.Select(field => field.Name));
                    memberNames.UnionWith(custom.Methods.Select(method => method.Signature.Name));
                }
            }
            foreach (var baseModel in baseModels)
            {
                foreach (var inherited in inputs.Unions
                    .Where(candidate => candidate.BaseModel == baseModel && RequiresEnvelope(candidate)))
                {
                    reserved.Add(GetMethodSuffix(inherited));
                }
            }
            foreach (var candidate in inputs.Unions
                .Where(candidate => candidate.BaseModel == union.BaseModel && RequiresEnvelope(candidate)))
            {
                var name = $"{(candidate.IsExactName ? candidate.Name : candidate.Name.ToIdentifierName())}Union";
                var suffix = name;
                var index = 0;
                while (memberNames.Contains($"Serialize{suffix}") || memberNames.Contains($"Deserialize{suffix}") ||
                    !reserved.Add(suffix))
                {
                    suffix = $"{name}{++index}";
                }
                if (candidate == union)
                {
                    return suffix;
                }
            }
            throw new InvalidOperationException($"Union '{union.Name}' is not registered in the input library.");
        }

        internal static bool RequiresEnvelope(InputType? type) => type switch
        {
            InputUnionType { External: null, BaseModel: { External: null }, EnvelopePropertyName: not null } union =>
                ScmCodeModelGenerator.Instance.TypeFactory.HasCompatibleDiscriminatedUnionBase(union),
            InputNullableType { External: null } nullable => RequiresEnvelope(nullable.Type),
            InputArrayType { External: null } array => RequiresEnvelope(array.ValueType),
            InputDictionaryType { External: null } dictionary => RequiresEnvelope(dictionary.ValueType),
            _ => false
        };

        internal static bool RequiresEnvelope(InputType? type, CSharpType valueType) => type switch
        {
            InputUnionType union when RequiresEnvelope(union) =>
                valueType.WithNullable(false).Equals(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union.BaseModel!)!),
            InputNullableType { External: null } nullable => RequiresEnvelope(nullable.Type, valueType),
            InputArrayType { External: null } array => valueType.IsList && !valueType.IsReadOnlyMemory &&
                RequiresEnvelope(array.ValueType, valueType.ElementType),
            InputDictionaryType { External: null } dictionary => valueType.IsDictionary && RequiresEnvelope(dictionary.ValueType, valueType.ElementType),
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
                return Static(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union.BaseModel!)!)
                    .Invoke(GetSerializeMethodName(union), [writer, value, options]).Terminate();
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
                value = Static(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union.BaseModel!)!)
                    .Invoke(GetDeserializeMethodName(union), [element, options]);
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
