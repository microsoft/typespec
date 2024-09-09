// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    internal sealed class TypeSpecOperationLongRunningConverter : JsonConverter<OperationLongRunning>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public TypeSpecOperationLongRunningConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override OperationLongRunning? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.ReadReferenceAndResolve<OperationLongRunning>(_referenceHandler.CurrentResolver) ?? CreateOperationLongRunning(ref reader, null, options);
        }

        public override void Write(Utf8JsonWriter writer, OperationLongRunning value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        private OperationLongRunning CreateOperationLongRunning(ref Utf8JsonReader reader, string? id, JsonSerializerOptions options)
        {
            var isFirstProperty = id == null;
            int finalStateVia = default;
            OperationResponse? finalResponse = null;
            string? resultPath = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadReferenceId(ref isFirstProperty, ref id)
                    || reader.TryReadInt32(nameof(OperationLongRunning.FinalStateVia), ref finalStateVia)
                    || reader.TryReadWithConverter(nameof(OperationLongRunning.FinalResponse), options, ref finalResponse)
                    || reader.TryReadString(nameof(OperationLongRunning.ResultPath), ref resultPath);

                if (!isKnownProperty)
                {
                    continue;
                }
            }

            var result = new OperationLongRunning(finalStateVia, finalResponse ?? new OperationResponse(), resultPath);

            if (id != null)
            {
                _referenceHandler.CurrentResolver.AddReference(id, result);
            }

            return result;
        }
    }
}
