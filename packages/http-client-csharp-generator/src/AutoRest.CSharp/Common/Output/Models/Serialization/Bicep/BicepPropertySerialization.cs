// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Output.Models.Serialization.Json;

namespace AutoRest.CSharp.Output.Models.Serialization.Bicep
{
    internal record BicepPropertySerialization : PropertySerialization
    {
        public BicepPropertySerialization(JsonPropertySerialization serialization, string? customSerializationMethodName)
            : base(
                serialization.SerializationConstructorParameterName,
                serialization.Value,
                serialization.SerializedName,
                serialization.SerializedType,
                serialization.IsRequired,
                serialization.ShouldExcludeInWireSerialization,
                serialization.EnumerableValue)
        {
            ValueSerialization = serialization.ValueSerialization switch
            {
                null => null,
                JsonSerialization json => BicepSerialization.Create(json)
            };

            if (serialization.PropertySerializations != null)
            {
                PropertySerializations = serialization.PropertySerializations.Select(p =>
                    new BicepPropertySerialization(p, customSerializationMethodName));
            }

            CustomSerializationMethodName = customSerializationMethodName;
        }

        public BicepSerialization? ValueSerialization { get; }
        public string? CustomSerializationMethodName { get; }

        public IEnumerable<BicepPropertySerialization>? PropertySerializations { get; }
    }
}
