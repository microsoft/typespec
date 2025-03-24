// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class TypeSpecOperationLongRunningConverter : JsonConverter<InputOperationLongRunning>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecOperationLongRunningConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputOperationLongRunning? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<InputOperationLongRunning>(_referenceHandler.CurrentResolver) ?? CreateOperationLongRunning(ref reader, null, options);
        }

        public override void Write(Utf8JsonWriter writer, InputOperationLongRunning value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private InputOperationLongRunning CreateOperationLongRunning(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options)
        {
            var isFirstProperty = id == null;
            int finalStateVia = default;
            InputOperationResponse? finalResponse = null;
            string? resultPath = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadInt32("finalStateVia", ref finalStateVia)
                    || reader.TryReadComplexType("finalResponse", options, ref finalResponse)
                    || reader.TryReadString("resultPath", ref resultPath);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            var result = new InputOperationLongRunning(finalStateVia, finalResponse ?? new InputOperationResponse(), resultPath);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, result);
            }

            return result;
        }
    }
}
