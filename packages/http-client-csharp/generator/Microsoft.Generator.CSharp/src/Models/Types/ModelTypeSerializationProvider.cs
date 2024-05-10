// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    internal sealed class ModelTypeSerializationProvider : TypeProvider
    {
        public ModelTypeSerializationProvider(ModelTypeProvider model) : base(null)
        {
            Model = model;
            Name = model.Name;
            Json = BuildJsonSerialization();
            var serializationInterfaces =
                CodeModelPlugin.Instance.TypeFactory.GetSerializationInterfaces(this, hasJson: Json != null, hasXml: false);
            Interfaces = serializationInterfaces;
            // TO-DO: Handle wire formats for XML serialization https://github.com/microsoft/typespec/issues/3331
            WireFormat = Serialization.JsonFormat;
        }
        public override string Name { get; }
        public ModelTypeProvider Model { get; }
        public JsonObjectSerialization? Json { get; }
        public ValueExpression WireFormat { get; }
        public SerializationInterfaces Interfaces { get; }

        protected override CSharpMethod[] BuildMethods()
        {
            return SerializationMethodsBuilder.BuildSerializationMethods(this);
        }

        /// <summary>
        /// Builds the types that the model type implements. If the model type does not contain serialization, returns an empty array.
        /// Otherwise, returns the serialization interfaces.
        /// </summary>
        /// <returns>An array of <see cref="CSharpType"/> types that the model implements.</returns>
        protected override CSharpType[] BuildImplements()
        {
            var serializationInterfaces = Interfaces;
            var implements = new List<CSharpType>();
            foreach (var serializationInterface in serializationInterfaces)
            {
                if (serializationInterface is not null)
                {
                    implements.Add(serializationInterface);
                }
            }

            return implements.ToArray();
        }

        private JsonObjectSerialization? BuildJsonSerialization()
        {
            // TO-DO: Add json property serialization https://github.com/microsoft/typespec/issues/3330
            if (Model.IsPropertyBag)
            {
                return null;
            }

            return new(this, Array.Empty<Parameter>());
        }
    }
}
