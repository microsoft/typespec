// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Json
{
    internal class JsonArraySerialization: JsonSerialization
    {
        public JsonArraySerialization(CSharpType implementationType, JsonSerialization valueSerialization, bool isNullable) : base(isNullable, implementationType)
        {
            ValueSerialization = valueSerialization;
        }

        public JsonSerialization ValueSerialization { get; }
    }
}
