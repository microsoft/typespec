// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecInputParameterExampleConverter : JsonConverter<InputParameterExample>
    {
        public override InputParameterExample? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateInputParameterExample(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputParameterExample value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputParameterExample CreateInputParameterExample(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }
            InputParameter? parameter = null;
            InputExampleValue? value = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadComplexType("parameter", options, ref parameter)
                    || reader.TryReadComplexType("value", options, ref value);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            var result = new InputParameterExample(parameter ?? throw new JsonException(), value ?? throw new JsonException());

            return result;
        }
    }
}
