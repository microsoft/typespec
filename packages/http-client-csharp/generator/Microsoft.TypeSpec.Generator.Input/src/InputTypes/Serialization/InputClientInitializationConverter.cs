// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputClientInitializationConverter : JsonConverter<InputClientInitialization>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputClientInitializationConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputClientInitialization? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputClientInitialization>(_referenceHandler.CurrentResolver) ?? CreateInputClientInitialization(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputClientInitialization value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputClientInitialization? CreateInputClientInitialization(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }
            id = id ?? throw new JsonException();

            var clientInitialization = new InputClientInitialization();
            resolver.AddReference(id, clientInitialization);

            IReadOnlyList<InputParameter>? parameters = null;
            int initializedByValue = 0;
            bool hasInitializedBy = false;
            string? access = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("parameters", options, ref parameters)
                    || (hasInitializedBy = reader.TryReadInt32("initializedBy", ref initializedByValue))
                    || reader.TryReadString("access", ref access);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            clientInitialization.Parameters = parameters ?? [];
            clientInitialization.InitializedBy = hasInitializedBy ? initializedByValue : null;
            clientInitialization.Access = access;

            return clientInitialization;
        }
    }
}
