// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal class InputExternalTypeConverter : JsonConverter<InputExternalType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputExternalTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputExternalType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
           => reader.ReadReferenceAndResolve<InputExternalType>(_referenceHandler.CurrentResolver) ?? CreateInputExternalType(ref reader, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputExternalType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputExternalType CreateInputExternalType(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            string? identity = null;
            string? package = null;
            string? minVersion = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;

            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref id)
                    || reader.TryReadString("identity", ref identity)
                    || reader.TryReadString("package", ref package)
                    || reader.TryReadString("minVersion", ref minVersion)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            identity = identity ?? throw new JsonException("InputExternalType must have identity");

            var externalType = new InputExternalType(identity, package, minVersion)
            {
                Decorators = decorators ?? []
            };

            if (id != null)
            {
                resolver.AddReference(id, externalType);
            }

            return externalType;
        }
    }
}
