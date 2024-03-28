// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Output.Models.Serialization;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class SchemaRequestBody : RequestBody
    {
        public ObjectSerialization Serialization { get; }
        public ReferenceOrConstant Value { get; }

        public SchemaRequestBody(ReferenceOrConstant value, ObjectSerialization serialization)
        {
            Value = value;
            Serialization = serialization;
        }
    }
}
