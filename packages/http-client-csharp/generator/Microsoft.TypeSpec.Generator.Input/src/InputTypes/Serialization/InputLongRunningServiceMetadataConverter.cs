// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputLongRunningServiceMetadataConverter : JsonConverter<InputLongRunningServiceMetadata>
    {
        public InputLongRunningServiceMetadataConverter()
        {
        }

        public override InputLongRunningServiceMetadata? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => CreateOperationLongRunning(ref reader, options);

        public override void Write(Utf8JsonWriter writer, InputLongRunningServiceMetadata value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputLongRunningServiceMetadata CreateOperationLongRunning(ref Utf8JsonReader reader, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                reader.Read();
            }

            int finalStateVia = default;
            InputOperationResponse? finalResponse = null;
            string? resultPath = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadInt32("finalStateVia", ref finalStateVia)
                    || reader.TryReadComplexType("finalResponse", options, ref finalResponse)
                    || reader.TryReadString("resultPath", ref resultPath);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            var result = new InputLongRunningServiceMetadata(finalStateVia, finalResponse ?? new InputOperationResponse(), resultPath);

            return result;
        }
    }
}
