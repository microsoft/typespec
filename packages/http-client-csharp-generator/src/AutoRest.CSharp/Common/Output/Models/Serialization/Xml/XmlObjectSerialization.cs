// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


using System.ClientModel.Primitives;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Xml
{
    internal class XmlObjectSerialization
    {
        public XmlObjectSerialization(string name,
            SerializableObjectType model,
            XmlObjectElementSerialization[] elements,
            XmlObjectAttributeSerialization[] attributes,
            XmlObjectArraySerialization[] embeddedArrays,
            XmlObjectContentSerialization? contentSerialization,
            string? writeXmlMethodName = null)
        {
            Type = model.Type;
            Elements = elements;
            Attributes = attributes;
            Name = name;
            EmbeddedArrays = embeddedArrays;
            ContentSerialization = contentSerialization;
            WriteXmlMethodName = writeXmlMethodName ?? "WriteInternal";

            // select interface model type here
            var modelType = model.IsUnknownDerivedType && model.Inherits is { IsFrameworkType: false, Implementation: { } baseModel } ? baseModel.Type : model.Type;
            IPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), modelType);
            // we only need this interface when the model is a struct
            IPersistableModelObjectInterface = model.IsStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            IXmlInterface = Configuration.ApiTypes.IXmlSerializableType;
        }

        public string Name { get; }
        public XmlObjectElementSerialization[] Elements { get; }
        public XmlObjectAttributeSerialization[] Attributes { get; }
        public XmlObjectArraySerialization[] EmbeddedArrays { get; }
        public XmlObjectContentSerialization? ContentSerialization { get; }
        public CSharpType Type { get; }

        public string WriteXmlMethodName { get; }

        /// <summary>
        /// The interface IXmlSerializable
        /// </summary>
        public CSharpType IXmlInterface { get; }
        /// <summary>
        /// The interface IPersistableModel{T}
        /// </summary>
        public CSharpType IPersistableModelTInterface { get; }
        /// <summary>
        /// The interface IPersistableModel{object}
        /// </summary>
        public CSharpType? IPersistableModelObjectInterface { get; }
    }
}
