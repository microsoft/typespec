// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Serialization.Json;

namespace AutoRest.CSharp.Output.Models.Serialization.Bicep
{
    internal class BicepValueSerialization : BicepSerialization
    {
        public BicepValueSerialization(JsonValueSerialization serialization) : base(serialization)
        {
            Type = serialization.Type;
        }

        public CSharpType Type { get; }
    }
}
