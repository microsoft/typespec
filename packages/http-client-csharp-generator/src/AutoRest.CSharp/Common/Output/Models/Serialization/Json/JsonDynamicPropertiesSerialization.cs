// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.Output.Models.Serialization.Json
{
    internal class JsonDynamicPropertiesSerialization
    {
        public JsonDynamicPropertiesSerialization(JsonSerialization valueSerialization)
        {
            ValueSerialization = valueSerialization;
        }

        public JsonSerialization ValueSerialization { get; }
    }
}
