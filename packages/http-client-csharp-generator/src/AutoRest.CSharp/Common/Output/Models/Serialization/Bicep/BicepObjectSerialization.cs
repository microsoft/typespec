// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Mgmt.Output;
using AutoRest.CSharp.Output.Models.Serialization.Json;

namespace AutoRest.CSharp.Output.Models.Serialization.Bicep
{
    internal class BicepObjectSerialization
    {
        public BicepObjectSerialization(SerializableObjectType objectType, JsonObjectSerialization jsonObjectSerialization)
        {
            Properties = jsonObjectSerialization.Properties.Select(p =>
                new BicepPropertySerialization(p, p.SerializationHooks?.BicepSerializationMethodName));
            IsResourceData = objectType is MgmtObjectType;
        }

        public IEnumerable<BicepPropertySerialization> Properties { get; }

        public bool IsResourceData { get; }
    }
}
