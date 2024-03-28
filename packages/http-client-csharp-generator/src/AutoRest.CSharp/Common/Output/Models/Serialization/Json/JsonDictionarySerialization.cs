// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Json
{
    internal class JsonDictionarySerialization : JsonSerialization
    {
        public JsonDictionarySerialization(CSharpType type, JsonSerialization valueSerialization, bool isNullable) : base(isNullable, type)
        {
            ValueSerialization = valueSerialization;
        }

        public JsonSerialization ValueSerialization { get; }
    }
}
