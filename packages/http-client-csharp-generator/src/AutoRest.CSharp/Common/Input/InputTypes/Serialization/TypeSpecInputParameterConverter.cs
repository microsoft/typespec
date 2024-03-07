// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Serialization;

namespace AutoRest.CSharp.Common.Input
{
    internal sealed class TypeSpecInputParameterConverter : JsonConverter<InputParameter>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecInputParameterConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputParameter? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) => ReadInputParameter(ref reader, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputParameter value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private static InputParameter? ReadInputParameter(ref Utf8JsonReader reader, JsonSerializerOptions options, ReferenceResolver resolver)
            => reader.ReadReferenceAndResolve<InputParameter>(resolver) ?? CreateInputParameter(ref reader, null, null, options, resolver);

        public static InputParameter CreateInputParameter(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            var isFirstProperty = id == null && name == null;

            string? nameInRequest = null;
            string? description = null;
            InputType? parameterType = null;
            string? location = null;
            InputConstant? defaultValue = null;
            VirtualParameter? virtualParameter = null;
            InputParameter? groupBy = null;
            string? kind = null;
            bool isRequired = false;
            bool isApiVersion = false;
            bool isResourceParameter = false;
            bool isContentType = false;
            bool isEndpoint = false;
            bool skipUrlEncoding = false;
            bool explode = false;
            string? arraySerializationDelimiter = null;
            string? headerCollectionPrefix = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadString(nameof(InputParameter.Name), ref name)
                    || reader.TryReadString(nameof(InputParameter.NameInRequest), ref nameInRequest)
                    || reader.TryReadString(nameof(InputParameter.Description), ref description)
                    || reader.TryReadWithConverter(nameof(InputParameter.Type), options, ref parameterType)
                    || reader.TryReadString(nameof(InputParameter.Location), ref location)
                    || reader.TryReadWithConverter(nameof(InputParameter.DefaultValue), options, ref defaultValue)
                    || reader.TryReadWithConverter(nameof(InputParameter.VirtualParameter), options, ref virtualParameter)
                    || reader.TryReadWithConverter(nameof(InputParameter.GroupedBy), options, ref groupBy)
                    || reader.TryReadString(nameof(InputParameter.Kind), ref kind)
                    || reader.TryReadBoolean(nameof(InputParameter.IsRequired), ref isRequired)
                    || reader.TryReadBoolean(nameof(InputParameter.IsApiVersion), ref isApiVersion)
                    || reader.TryReadBoolean(nameof(InputParameter.IsResourceParameter), ref isResourceParameter)
                    || reader.TryReadBoolean(nameof(InputParameter.IsContentType), ref isContentType)
                    || reader.TryReadBoolean(nameof(InputParameter.IsEndpoint), ref isEndpoint)
                    || reader.TryReadBoolean(nameof(InputParameter.SkipUrlEncoding), ref skipUrlEncoding)
                    || reader.TryReadBoolean(nameof(InputParameter.Explode), ref explode)
                    || reader.TryReadString(nameof(InputParameter.ArraySerializationDelimiter), ref arraySerializationDelimiter)
                    || reader.TryReadString(nameof(InputParameter.HeaderCollectionPrefix), ref headerCollectionPrefix);

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
            Enum.TryParse<RequestLocation>(location, ignoreCase: true, out var requestLocation);

            if (kind == null)
            {
                throw new JsonException("Parameter must have kind");
            }
            Enum.TryParse<InputOperationParameterKind>(kind, ignoreCase: true, out var parameterKind);

            var parameter = new InputParameter(
                Name: name,
                NameInRequest: nameInRequest,
                Description: description,
                Type: parameterType,
                Location: requestLocation,
                DefaultValue: defaultValue,
                VirtualParameter: virtualParameter,
                GroupedBy: groupBy,
                Kind: parameterKind,
                IsRequired: isRequired,
                IsApiVersion: isApiVersion,
                IsResourceParameter: isResourceParameter,
                IsContentType: isContentType,
                IsEndpoint: isEndpoint,
                SkipUrlEncoding: skipUrlEncoding,
                Explode: explode,
                ArraySerializationDelimiter: arraySerializationDelimiter,
                HeaderCollectionPrefix: headerCollectionPrefix);

            if (id != null)
            {
                resolver.AddReference(id, parameter);
            }

            return parameter;
        }
    }
}
