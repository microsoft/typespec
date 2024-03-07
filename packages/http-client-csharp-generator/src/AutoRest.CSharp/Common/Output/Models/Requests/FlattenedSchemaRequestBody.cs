// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class FlattenedSchemaRequestBody : RequestBody
    {
        public ObjectType ObjectType { get; }
        public ObjectPropertyInitializer[] Initializers { get; }
        public ObjectSerialization Serialization { get; }

        public FlattenedSchemaRequestBody(ObjectType objectType, ObjectPropertyInitializer[] initializers, ObjectSerialization serialization)
        {
            ObjectType = objectType;
            Initializers = initializers;
            Serialization = serialization;
        }
    }
}
