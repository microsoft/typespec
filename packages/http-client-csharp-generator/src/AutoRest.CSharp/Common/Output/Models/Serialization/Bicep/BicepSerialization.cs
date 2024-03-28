// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Output.Models.Serialization.Json;

namespace AutoRest.CSharp.Output.Models.Serialization.Bicep
{
    internal abstract class BicepSerialization : ObjectSerialization
    {
        protected BicepSerialization(JsonSerialization serialization)
        {
            IsNullable = serialization.IsNullable;
        }

        public bool IsNullable { get; }

        public static BicepSerialization Create(JsonSerialization serialization)
        {
            return serialization switch
            {
                JsonValueSerialization valueSerialization => new BicepValueSerialization(valueSerialization),
                JsonArraySerialization arraySerialization => new BicepArraySerialization(arraySerialization),
                JsonDictionarySerialization objectSerialization => new BicepDictionarySerialization(objectSerialization),
                _ => throw new InvalidOperationException($"Unknown serialization type {serialization.GetType()}")
            };
        }
    }
}
