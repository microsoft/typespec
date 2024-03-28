// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.


using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Serialization.Json;

namespace AutoRest.CSharp.Output.Models.Serialization.Bicep
{
    internal class BicepArraySerialization : BicepSerialization
    {
        public BicepArraySerialization(JsonArraySerialization serialization) : base(serialization)
        {
            ImplementationType = serialization.Type;
            ValueSerialization = Create(serialization.ValueSerialization);
        }

        public CSharpType ImplementationType { get; }

        public BicepSerialization ValueSerialization { get; }
    }
}
