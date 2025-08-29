// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputPathParameterConverter : JsonConverter<InputPathParameter>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputPathParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputPathParameter Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputPathParameter>(_referenceHandler.CurrentResolver) ?? ReadInputPathParameter(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputPathParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        internal static InputPathParameter ReadInputPathParameter(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            var parameter = new InputPathParameter(
                name: null!,
                summary: null,
                doc: null,
                type: null!,
                isRequired: false,
                isReadOnly: false,
                access: null,
                allowReserved: false,
                serializedName: null!,
                isApiVersion: false,
                defaultValue: null,
                scope: default,
                explode: false,
                skipUrlEncoding: false,
                serverUrlTemplate: null);
            resolver.AddReference(id, parameter);

            string? name = null;
            string? summary = null;
            string? doc = null;
            string? serializedName = null;
            bool isApiVersion = false;
            bool explode = false;
            bool skipUrlEncoding = false;
            InputConstant? defaultValue = null;
            string? scope = null;
            InputType? type = null;
            bool isReadOnly = false;
            bool isOptional = false;
            string? access = null;
            string? serverUrlTemplate = null;
            bool allowReserved = false;
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
                    || reader.TryReadBoolean("allowReserved", ref allowReserved)
                    || reader.TryReadString("serverUrlTemplate", ref serverUrlTemplate)
                    || reader.TryReadString("serializedName", ref serializedName)
                    || reader.TryReadBoolean("isApiVersion", ref isApiVersion)
                    || reader.TryReadComplexType("defaultValue", options, ref defaultValue)
                    || reader.TryReadString("scope", ref scope)
                    || reader.TryReadBoolean("explode", ref explode)
                    || reader.TryReadBoolean("skipUrlEncoding", ref skipUrlEncoding)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            parameter.Name = name ?? throw new JsonException($"{nameof(InputPathParameter)} must have a name.");
            parameter.Summary = summary;
            parameter.Doc = doc;
            parameter.Type = type ?? throw new JsonException($"{nameof(InputPathParameter)} must have a type.");
            parameter.IsRequired = !isOptional;
            parameter.IsReadOnly = isReadOnly;
            parameter.Access = access;
            parameter.AllowReserved = allowReserved;
            parameter.ServerUrlTemplate = serverUrlTemplate;
            parameter.Decorators = decorators ?? [];
            parameter.SerializedName = serializedName ?? throw new JsonException($"{nameof(InputPathParameter)} must have a serializedName.");
            parameter.IsApiVersion = isApiVersion;
            parameter.DefaultValue = defaultValue;

            if (scope == null)
            {
                throw new JsonException("Parameter must have a scope");
            }
            Enum.TryParse<InputParameterScope>(scope, ignoreCase: true, out var parsedScope);

            if (parsedScope == InputParameterScope.Constant && type is not InputLiteralType)
            {
                throw new JsonException($"Parameter '{name}' is constant, but its type is '{type.Name}'.");
            }
            parameter.Scope = parsedScope;
            parameter.Explode = explode;
            parameter.SkipUrlEncoding = skipUrlEncoding;

            return parameter;
        }
    }
}
