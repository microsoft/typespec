// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Serialization.Json;

namespace AutoRest.CSharp.Output.Models.Serialization.Bicep
{
    internal class BicepDictionarySerialization : BicepSerialization
    {
        public BicepDictionarySerialization(JsonDictionarySerialization serialization) : base(serialization)
        {
            Type = serialization.Type;
            ValueSerialization = Create(serialization.ValueSerialization);
        }

        public CSharpType Type { get; }

        public BicepSerialization ValueSerialization { get; }
    }
}
