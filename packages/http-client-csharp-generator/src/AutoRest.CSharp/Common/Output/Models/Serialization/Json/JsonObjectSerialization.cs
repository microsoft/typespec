// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Output.Models.Serialization.Json
{
    internal record JsonObjectSerialization
    {
        public JsonObjectSerialization(SerializableObjectType model, IReadOnlyList<Parameter> constructorParameters, IReadOnlyList<JsonPropertySerialization> properties, JsonAdditionalPropertiesSerialization? additionalProperties, ObjectTypeDiscriminator? discriminator, bool includeConverter)
        {
            Type = model.Type;
            ConstructorParameters = constructorParameters;
            Properties = properties;
            AdditionalProperties = additionalProperties;
            Discriminator = discriminator;
            IncludeConverter = includeConverter;
            // select interface model type here
            var modelType = model.IsUnknownDerivedType && model.Inherits is { IsFrameworkType: false, Implementation: { } baseModel } ? baseModel.Type : model.Type;
            IJsonModelInterface = new CSharpType(typeof(IJsonModel<>), modelType);
            IPersistableModelTInterface = new CSharpType(typeof(IPersistableModel<>), modelType);
            // we only need this interface when the model is a struct
            IJsonModelObjectInterface = model.IsStruct ? (CSharpType)typeof(IJsonModel<object>) : null;
            IPersistableModelObjectInterface = model.IsStruct ? (CSharpType)typeof(IPersistableModel<object>) : null;
            IJsonInterface = Configuration.ApiTypes.IUtf8JsonSerializableType;
        }

        public CSharpType Type { get; }
        public IReadOnlyList<Parameter> ConstructorParameters { get; }
        public IReadOnlyList<JsonPropertySerialization> Properties { get; }
        public JsonAdditionalPropertiesSerialization? AdditionalProperties { get; }
        public ObjectTypeDiscriminator? Discriminator { get; }
        public bool IncludeConverter { get; }

        /// <summary>
        /// The interface IJsonModel{T}
        /// </summary>
        public CSharpType IJsonModelInterface { get; }
        /// <summary>
        /// The interface IPersistableModel{T}
        /// </summary>
        public CSharpType IPersistableModelTInterface { get; }
        /// <summary>
        /// The interface IJsonModel{object}. We only have this interface when this model is a struct
        /// </summary>
        public CSharpType? IJsonModelObjectInterface { get; }
        /// <summary>
        /// The interface IPersistableModel{object}. We only have this interface when this model is a struct
        /// </summary>
        public CSharpType? IPersistableModelObjectInterface { get; }
        /// <summary>
        /// The interface IUtf8JsonSerializable
        /// </summary>
        public CSharpType IJsonInterface { get; }
    }
}
