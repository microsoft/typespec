// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputQueryParameterConverter : JsonConverter<InputQueryParameter>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputQueryParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputQueryParameter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputQueryParameter>(_referenceHandler.CurrentResolver) ?? ReadInputQueryParameter(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputQueryParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputQueryParameter ReadInputQueryParameter(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            var parameter = new InputQueryParameter(
                name: null!,
                summary: null,
                doc: null,
                type: null!,
                isRequired: false,
                isReadOnly: false,
                access: null,
                serializedName: null!,
                collectionFormat: null,
                explode: false,
                isApiVersion: false,
                defaultValue: null,
                kind: default,
                arraySerializationDelimiter: null);
            resolver.AddReference(id, parameter);

            string? name = null;
            string? summary = null;
            string? doc = null;
            string? serializedName = null;
            bool isApiVersion = false;
            InputConstant? defaultValue = null;
            string? kind = default;
            string? arraySerializationDelimiter = null;
            InputType? type = null;
            bool isReadOnly = false;
            bool isOptional = false;
            string? access = null;
            string? collectionFormat = null;
            bool explode = false;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("type", options, ref type)
                    || reader.TryReadBoolean("readOnly", ref isReadOnly)
                    || reader.TryReadBoolean("optional", ref isOptional)
                    || reader.TryReadString("access", ref access)
                    || reader.TryReadString("collectionFormat", ref collectionFormat)
                    || reader.TryReadString("serializedName", ref serializedName)
                    || reader.TryReadBoolean("isApiVersion", ref isApiVersion)
                    || reader.TryReadComplexType("defaultValue", options, ref defaultValue)
                    || reader.TryReadString("parameterKind", ref kind)
                    || reader.TryReadString("arraySerializationDelimiter", ref arraySerializationDelimiter)
                    || reader.TryReadBoolean("explode", ref explode)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            parameter.Name = name ?? throw new JsonException($"{nameof(InputQueryParameter)} must have a name.");
            parameter.Summary = summary;
            parameter.Doc = doc;
            parameter.Type = type ?? throw new JsonException($"{nameof(InputQueryParameter)} must have a type.");
            parameter.IsRequired = !isOptional;
            parameter.IsReadOnly = isReadOnly;
            parameter.Access = access;
            parameter.CollectionFormat = collectionFormat;
            parameter.Explode = explode;
            parameter.Decorators = decorators ?? [];
            parameter.SerializedName = serializedName ?? throw new JsonException($"{nameof(InputQueryParameter)} must have a serializedName.");
            parameter.IsApiVersion = isApiVersion;
            parameter.DefaultValue = defaultValue;

            if (kind == null)
            {
                throw new JsonException("Parameter must have kind");
            }
            Enum.TryParse<InputParameterKind>(kind, ignoreCase: true, out var parameterKind);

            if (parameterKind == InputParameterKind.Constant && type is not InputLiteralType)
            {
                throw new JsonException($"Parameter '{name}' is constant, but its type is '{type.Name}'.");
            }
            parameter.Kind = parameterKind;
            parameter.ArraySerializationDelimiter = arraySerializationDelimiter;

            return parameter;
        }
    }
}
