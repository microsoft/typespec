// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System.Runtime.CompilerServices;
using System.Text.Json;
using Azure.Core;

namespace CustomizationsInTsp.Models
{
    /// <summary> Model to add additional serializable property. </summary>
    [CodeGenSerialization(nameof(RequiredIntOnBase), SerializationValueHook = nameof(WriteRequiredIntOnBaseValue), DeserializationValueHook = nameof(ReadRequiredIntOnBaseValue))]
    [CodeGenSerialization(nameof(RequiredInt), SerializationValueHook = nameof(WriteRequiredIntValue), DeserializationValueHook = nameof(ReadRequiredIntValue))]
    [CodeGenSerialization(nameof(AdditionalSerializableProperty), "additionalSerializableProperty")]
    [CodeGenSerialization(nameof(AdditionalNullableSerializableProperty), "additionalNullableSerializableProperty")]
    public partial class ModelToAddAdditionalSerializableProperty
    {
        /// <summary> New property to serialize. </summary>
        public int AdditionalSerializableProperty { get; set; }

        /// <summary> New nullable property to serialize. </summary>
        public int? AdditionalNullableSerializableProperty { get; set; }

        /// <summary>
        /// Required int.
        /// This property is mocking this scenario:
        /// In the SDK, this property is defined as int, but in the actual traffic, this property comes as a string.
        /// We use this attribute to fix its serialization and deserialization using the following two methods
        /// </summary>
        public int RequiredInt { get; set; }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private void WriteRequiredIntValue(Utf8JsonWriter writer)
        {
            writer.WriteStringValue(RequiredInt.ToString());
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static void ReadRequiredIntValue(JsonProperty property, ref int requiredInt)
        {
            requiredInt = int.Parse(property.Value.GetRawText());
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private void WriteRequiredIntOnBaseValue(Utf8JsonWriter writer)
        {
            writer.WriteStringValue(RequiredIntOnBase.ToString());
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static void ReadRequiredIntOnBaseValue(JsonProperty property, ref int requiredInt)
        {
            requiredInt = int.Parse(property.Value.GetRawText());
        }
    }
}
