// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
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
            var writer = ScmKnownParameters.Utf8JsonWriter;
            var value = new ParameterProvider("value", $"The union variant to serialize.",
                GetModelType(GetBaseModel(union)));
            var element = ScmKnownParameters.JsonElement;
            var options = ScmKnownParameters.Options;
            var subtypes = union.DiscriminatedSubtypes ??
                throw new InvalidOperationException($"Union '{union.Name}' has no discriminated payloads.");
            var jsonWriter = writer.As<Utf8JsonWriter>();
            var jsonElement = element.As<JsonElement>();

            List<MethodBodyStatement> serialize =
            [
                new IfStatement(value.Equal(Null)) { jsonWriter.WriteNullValue(), Return() }
            ];
            // Derived variants must match before their ancestors, including customized CLR bases.
            foreach (var (tag, model) in subtypes.OrderByDescending(entry =>
                GetTypeHierarchy(GetModelType(entry.Value)).Count()))
            {
                var type = GetModelType(model);
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
            var cases = subtypes.Select(entry => new SwitchCaseStatement(
                Literal(entry.Key),
                Return(MrwSerializationTypeDefinition.GetDeserializationMethodInvocationForType(
                    GetModelType(entry.Value),
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
                subtypes.Values.SelectMany(model => ExperimentalApiHelpers.GetReferenceSuppressions(model)),
                subtypes.Values.SelectMany(model => ExperimentalApiHelpers.GetReferenceSuppressions(GetModelType(model))));
            foreach (var method in methods)
            {
                method.Update(suppressions: suppressions);
            }
            return methods;
        }

        private static IEnumerable<CSharpType> GetTypeHierarchy(CSharpType type)
        {
            var visited = new HashSet<CSharpType>();
            for (CSharpType? current = type; current is not null && visited.Add(current);)
            {
                if (ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(current, out var provider) && provider is ModelProvider model)
                {
                    yield return model.Type;
                    current = model.BaseType;
                }
                else if (string.IsNullOrEmpty(current.Namespace) &&
                    ScmCodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.Values.OfType<ModelProvider>().FirstOrDefault(model => model.Name == current.Name) is { } generated)
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
            var inputs = ScmCodeModelGenerator.Instance.InputLibrary.InputNamespace;
            var inputBase = GetBaseModel(union);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase) ??
                throw new InvalidOperationException($"Unable to create the base model for union '{union.Name}'.");
            var baseTypes = GetTypeHierarchy(model.Type).Skip(1).ToHashSet();
            var baseModels = inputs.Models.Where(candidate => candidate != union.BaseModel &&
                ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(candidate) is { } type &&
                baseTypes.Contains(type)).ToArray();
            var reserved = new HashSet<string>(StringComparer.Ordinal) { model.Name };
            var memberNames = new HashSet<string>(StringComparer.Ordinal) { model.Name };
            foreach (var type in baseTypes)
            {
                var custom = ScmCodeModelGenerator.Instance.SourceInputModel.FindForTypeInCurrentCompilation(
                    type.Namespace, type.Name, type.DeclaringType?.Name, includeReferencedAssemblies: true);
                if (custom is not null)
                {
                    memberNames.UnionWith(custom.Properties.Select(property => property.Name));
                    memberNames.UnionWith(custom.Fields.Select(field => field.Name));
                    memberNames.UnionWith(custom.Methods.Select(method => method.Signature.Name));
                }
            }
            foreach (var inputModel in new[] { inputBase }.Concat(baseModels)
                .Concat(inputBase.GetAllDerivedModels())
                .Concat(inputs.Models.Where(candidate =>
                    ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(candidate) is { } type &&
                    GetTypeHierarchy(type).Skip(1).Contains(model.Type))).Distinct())
            {
                var provider = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
                if (provider is null)
                {
                    continue;
                }
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

        internal static bool RequiresEnvelope(InputType? type, CSharpType? valueType = null) => type switch
        {
            InputUnionType { External: null, BaseModel: { External: null } model, EnvelopePropertyName: not null } union =>
                ScmCodeModelGenerator.Instance.TypeFactory.HasCompatibleDiscriminatedUnionBase(union) &&
                (valueType is null || valueType.WithNullable(false).Equals(GetModelType(model))),
            InputNullableType { External: null } nullable => RequiresEnvelope(nullable.Type, valueType),
            InputArrayType { External: null } array => valueType is null
                ? RequiresEnvelope(array.ValueType)
                : valueType.IsList && !valueType.IsReadOnlyMemory && RequiresEnvelope(array.ValueType, valueType.ElementType),
            InputDictionaryType { External: null } dictionary => valueType is null
                ? RequiresEnvelope(dictionary.ValueType)
                : valueType.IsDictionary && RequiresEnvelope(dictionary.ValueType, valueType.ElementType),
            _ => false
        };

        internal static bool UsesJsonRequest(InputOperation operation) =>
            operation.RequestMediaTypes?.All(IsJsonMediaType) != false;

        internal static bool IsJsonMediaType(string contentType)
        {
            var mediaType = contentType.Split(';', 2)[0].Trim();
            return mediaType.Equals("application/json", StringComparison.OrdinalIgnoreCase) ||
                mediaType.EndsWith("+json", StringComparison.OrdinalIgnoreCase);
        }

        private static InputModelType GetBaseModel(InputUnionType union) => union.BaseModel ??
            throw new InvalidOperationException($"Union '{union.Name}' has no declared base model.");

        private static CSharpType GetModelType(InputModelType model) =>
            ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(model) ??
            throw new InvalidOperationException($"Unable to resolve C# type for union model '{model.Name}'.");

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
                return Static(GetModelType(GetBaseModel(union)))
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
                value = Static(GetModelType(GetBaseModel(union)))
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
