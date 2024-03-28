// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.Runtime.CompilerServices;
using System.Text.Json;
using Azure.Core;

namespace MgmtCustomizations
{
    [CodeGenSerialization(nameof(Id), SerializationValueHook = nameof(WriteId), DeserializationValueHook = nameof(ReadId))]
    public partial class PetStoreData
    {
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        internal void WriteId(Utf8JsonWriter writer)
        {
            if (Id != null)
                writer.WriteStringValue(Id);
            else
                writer.WriteNullValue();
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        internal static void ReadId(JsonProperty property, ref ResourceIdentifier id)
        {
            if (property.Value.ValueKind == JsonValueKind.Null)
                return;

            var idStr = property.Value.GetString();
            if (idStr.StartsWith("/"))
                id = new ResourceIdentifier(idStr);
            else
                id = new ResourceIdentifier($"/{idStr}");
        }
    }
}
