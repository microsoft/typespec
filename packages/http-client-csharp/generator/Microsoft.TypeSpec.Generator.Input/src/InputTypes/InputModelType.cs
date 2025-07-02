// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.TypeSpec.Generator.Input.Extensions;

namespace Microsoft.TypeSpec.Generator.Input
{
    [DebuggerDisplay("{GetDebuggerDisplay(),nq}")]    /// <summary>
    /// Represents modeltype information.
    /// </summary>
    /// <summary>

    /// Gets the inpu type.

    /// </summary>

    public class InputModelType : InputType
    {
        private const string UnknownDiscriminatorValue = "unknown";
        private IReadOnlyList<InputProperty> _properties = [];
        private IList<InputModelType> _derivedModels = [];

        // TODO: Follow up issue https://github.com/microsoft/typespec/issues/3619. After https://github.com/Azure/typespec-azure/pull/966 is completed, update this type and remove the "modelAsStruct" parameter.        /// <summary>
        /// Initializes a new instance of the <see cref="InputModelType"/> class.
        /// </summary>
        public InputModelType(string name, string @namespace, string crossLanguageDefinitionId, string? access, string? deprecation, string? summary, string? doc, InputModelTypeUsage usage, IReadOnlyList<InputProperty> properties, InputModelType? baseModel, IReadOnlyList<InputModelType> derivedModels, string? discriminatorValue, InputProperty? discriminatorProperty, IReadOnlyDictionary<string, InputModelType> discriminatedSubtypes, InputType? additionalProperties, bool modelAsStruct, InputSerializationOptions serializationOptions)
            : base(name)
        {
            Namespace = @namespace;
            CrossLanguageDefinitionId = crossLanguageDefinitionId;
            Access = access;
            Deprecation = deprecation;
            Summary = summary;
            Doc = doc;
            Usage = usage;
            Properties = properties;
            BaseModel = baseModel;
            foreach (var model in derivedModels)
            {
                AddDerivedModel(model);
            }
            if (discriminatedSubtypes is not null)
            {
                foreach (var model in discriminatedSubtypes.Values)
                {
                    AddDerivedModel(model);
                }
            }
            DiscriminatorValue = discriminatorValue;
            DiscriminatorProperty = discriminatorProperty;
            DiscriminatedSubtypes = discriminatedSubtypes!;
            AdditionalProperties = additionalProperties;
            IsUnknownDiscriminatorModel = DiscriminatorValue == UnknownDiscriminatorValue;
            IsPropertyBag = false;
            ModelAsStruct = modelAsStruct;
            SerializationOptions = serializationOptions;
        }        /// <summary>
        /// Gets the namespace.
        /// </summary>
        public string Namespace { get; internal set; }        /// <summary>
        /// Gets the crosslanguagedefinitio identifier.
        /// </summary>
        public string CrossLanguageDefinitionId { get; internal set; }        /// <summary>
        /// Gets the access.
        /// </summary>
        public string? Access { get; internal set; }        /// <summary>
        /// Gets the deprecation.
        /// </summary>
        public string? Deprecation { get; internal set; }        /// <summary>
        /// Gets the summary.
        /// </summary>
        public string? Summary { get; internal set; }        /// <summary>
        /// Gets the doc.
        /// </summary>
        public string? Doc { get; internal set; }        /// <summary>
        /// Gets the usage.
        /// </summary>
        public InputModelTypeUsage Usage { get; internal set; }        /// <summary>
        /// Gets the properties.
        /// </summary>
        public IReadOnlyList<InputProperty> Properties
        {
            get => _properties;
            internal set
            {
                foreach (var property in value)
                {
                    property.EnclosingType = this;
                }

                _properties = value;
            }
        }        /// <summary>
        /// Gets the modelasstruct.
        /// </summary>
        public bool ModelAsStruct { get; internal set; }        /// <summary>
        /// Gets the basemodel.
        /// </summary>
        public InputModelType? BaseModel { get; internal set; }
        public IReadOnlyList<InputModelType> DerivedModels => _derivedModels.AsReadOnly();
        internal void AddDerivedModel(InputModelType model)
        {
            model.BaseModel = this;
            _derivedModels.Add(model);
        }        /// <summary>
        /// Gets the discriminatorvalue.
        /// </summary>
        public string? DiscriminatorValue { get; internal set; }        /// <summary>
        /// Gets the discriminatorproperty.
        /// </summary>
        public InputProperty? DiscriminatorProperty { get; internal set; }
        private Dictionary<string, InputModelType>? _discriminatedSubtypes;        /// <summary>
        /// Gets the discriminatedsubtypes.
        /// </summary>
        public IReadOnlyDictionary<string, InputModelType> DiscriminatedSubtypes
        {
            get => _discriminatedSubtypes ??= new Dictionary<string, InputModelType>();
            internal set
            {
                if (value is null || DiscriminatorProperty == null || DiscriminatorValue == UnknownDiscriminatorValue)
                    return;

                _discriminatedSubtypes = new Dictionary<string, InputModelType>(value);

                var cleanBaseName = Name.ToIdentifierName();
                _discriminatedSubtypes.Add(UnknownDiscriminatorValue,
                new InputModelType(
                    $"Unknown{cleanBaseName}",
                    Namespace,
                    $"Unknown{cleanBaseName}",
                    "internal",
                    null,
                    null,
                    $"Unknown variant of {cleanBaseName}",
                    Usage | InputModelTypeUsage.Json,
                    [],
                    this,
                    [],
                    UnknownDiscriminatorValue,
                    DiscriminatorProperty,
                    new Dictionary<string, InputModelType>(),
                    null,
                    false,
                    SerializationOptions)
                );
            }
        }        /// <summary>
        /// Gets the additionalproperties.
        /// </summary>
        public InputType? AdditionalProperties { get; internal set; }        /// <summary>
        /// Gets the isunknowndiscriminatormodel.
        /// </summary>
        public bool IsUnknownDiscriminatorModel { get; init; }        /// <summary>
        /// Gets the ispropertybag.
        /// </summary>
        public bool IsPropertyBag { get; init; }        /// <summary>
        /// Gets the serializationoptions.
        /// </summary>
        public InputSerializationOptions SerializationOptions { get; internal set; }

        public IEnumerable<InputModelType> GetSelfAndBaseModels() => EnumerateBase(this);

        public IEnumerable<InputModelType> GetAllBaseModels() => EnumerateBase(BaseModel);

        public IReadOnlyList<InputModelType> GetAllDerivedModels()
        {
            var list = new List<InputModelType>(DerivedModels);
            for (var i = 0; i < list.Count; i++)
            {
                list.AddRange(list[i].DerivedModels);
            }

            return list;
        }

        private static IEnumerable<InputModelType> EnumerateBase(InputModelType? model)
        {
            while (model != null)
            {
                yield return model;
                model = model.BaseModel;
            }
        }

        private string GetDebuggerDisplay()
        {
            return $"Model (Name: {Name})";
        }
    }
}
