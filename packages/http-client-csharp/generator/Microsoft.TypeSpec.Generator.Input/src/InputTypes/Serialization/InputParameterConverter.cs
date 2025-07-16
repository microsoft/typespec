// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputParameterConverter : JsonConverter<InputParameter>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputParameter? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputParameter>(_referenceHandler.CurrentResolver) ?? CreateInputParameter(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputParameter CreateInputParameter(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? nameInRequest = null;
            string? summary = null;
            string? doc = null;
            InputType? parameterType = null;
            string? location = null;
            InputConstant? defaultValue = null;
            string? kind = null;
            bool isRequired = false;
            bool isApiVersion = false;
            bool isContentType = false;
            bool isEndpoint = false;
            bool skipUrlEncoding = false;
            bool explode = false;
            string? arraySerializationDelimiter = null;
            string? headerCollectionPrefix = null;
            string? serverUrlTemplate = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("name", ref name)
                    || reader.TryReadString("nameInRequest", ref nameInRequest)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadComplexType("type", options, ref parameterType)
                    || reader.TryReadString("location", ref location)
                    || reader.TryReadComplexType("defaultValue", options, ref defaultValue)
                    || reader.TryReadString("kind", ref kind)
                    || reader.TryReadBoolean("isRequired", ref isRequired)
                    || reader.TryReadBoolean("isApiVersion", ref isApiVersion)
                    || reader.TryReadBoolean("isContentType", ref isContentType)
                    || reader.TryReadBoolean("isEndpoint", ref isEndpoint)
                    || reader.TryReadBoolean("skipUrlEncoding", ref skipUrlEncoding)
                    || reader.TryReadBoolean("explode", ref explode)
                    || reader.TryReadString("arraySerializationDelimiter", ref arraySerializationDelimiter)
                    || reader.TryReadString("headerCollectionPrefix", ref headerCollectionPrefix)
                    || reader.TryReadString("serverUrlTemplate", ref serverUrlTemplate)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            name = name ?? throw new JsonException("Parameter must have name");
            nameInRequest = nameInRequest ?? throw new JsonException("Parameter must have nameInRequest");
            parameterType = parameterType ?? throw new JsonException("Parameter must have type");

            if (location == null)
            {
                throw new JsonException("Parameter must have location");
            }
            Enum.TryParse<InputRequestLocation>(location, ignoreCase: true, out var requestLocation);

            if (kind == null)
            {
                throw new JsonException("Parameter must have kind");
            }
            Enum.TryParse<InputParameterKind>(kind, ignoreCase: true, out var parameterKind);

            if (parameterKind == InputParameterKind.Constant && parameterType is not InputLiteralType)
            {
                throw new JsonException($"Operation parameter '{name}' is constant, but its type is '{parameterType.Name}'.");
            }

            var parameter = new InputParameter(
                name: name,
                nameInRequest: nameInRequest,
                summary: summary,
                doc: doc,
                type: parameterType,
                location: requestLocation,
                defaultValue: defaultValue,
                kind: parameterKind,
                isRequired: isRequired,
                isApiVersion: isApiVersion,
                isContentType: isContentType,
                isEndpoint: isEndpoint,
                skipUrlEncoding: skipUrlEncoding,
                explode: explode,
                arraySerializationDelimiter: arraySerializationDelimiter,
                headerCollectionPrefix: headerCollectionPrefix,
                serverUrlTemplate: serverUrlTemplate)
            {
                Decorators = decorators ?? []
            };

            if (id != null)
            {
                resolver.AddReference(id, parameter);
            }

            return parameter;
        }
    }
}
