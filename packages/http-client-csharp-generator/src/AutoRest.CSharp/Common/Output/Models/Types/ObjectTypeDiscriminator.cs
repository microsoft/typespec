// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Linq;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class ObjectTypeDiscriminator
    {
        public ObjectTypeProperty Property { get; }
        public string SerializedName { get; }

        public Constant? Value { get; }

        public ObjectTypeDiscriminatorImplementation[] Implementations { get; }

        public SerializableObjectType DefaultObjectType { get; }

        public ObjectTypeDiscriminator(ObjectTypeProperty property, string serializedName, ObjectTypeDiscriminatorImplementation[] implementations, Constant? value, SerializableObjectType defaultObjectType)
        {
            Property = property;
            Implementations = implementations;
            Value = value;
            SerializedName = serializedName;
            DefaultObjectType = defaultObjectType;
        }

        public bool HasDescendants => Implementations.Any();
    }
}
