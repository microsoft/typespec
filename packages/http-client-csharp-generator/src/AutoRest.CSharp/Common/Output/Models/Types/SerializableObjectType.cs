// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Builders;
using AutoRest.CSharp.Output.Models.Serialization.Bicep;
using AutoRest.CSharp.Output.Models.Serialization.Json;
using AutoRest.CSharp.Output.Models.Serialization.Xml;
using AutoRest.CSharp.Output.Models.Types;
using Microsoft.CodeAnalysis;

namespace AutoRest.CSharp.Common.Output.Models.Types
{
    internal abstract class SerializableObjectType : ObjectType
    {
        protected readonly Lazy<ModelTypeMapping?> _modelTypeMapping;
        protected SerializableObjectType(BuildContext context) : base(context)
        {
            _modelTypeMapping = new Lazy<ModelTypeMapping?>(() => _sourceInputModel?.CreateForModel(ExistingType));
        }
        protected SerializableObjectType(string defaultNamespace, SourceInputModel? sourceInputModel) : base(defaultNamespace, sourceInputModel)
        {
            _modelTypeMapping = new Lazy<ModelTypeMapping?>(() => _sourceInputModel?.CreateForModel(ExistingType));
        }

        public INamedTypeSymbol? GetExistingType() => ExistingType;

        private protected ModelTypeMapping? ModelTypeMapping => _modelTypeMapping.Value;

        private SerializationBuilder _serializationBuilder = new SerializationBuilder();

        private bool? _includeSerializer;
        public bool IncludeSerializer => _includeSerializer ??= EnsureIncludeSerializer();

        private bool? _includeDeserializer;
        public bool IncludeDeserializer => _includeDeserializer ??= EnsureIncludeDeserializer();

        private bool _jsonSerializationInitialized = false;
        private JsonObjectSerialization? _jsonSerialization;
        public JsonObjectSerialization? JsonSerialization => EnsureJsonSerialization();

        private bool _xmlSerializationInitialized = false;
        private XmlObjectSerialization? _xmlSerialization;
        public XmlObjectSerialization? XmlSerialization => EnsureXmlSerialization();

        private bool _bicepSerializationInitialized = false;
        private BicepObjectSerialization? _bicepSerialization;
        public BicepObjectSerialization? BicepSerialization => EnsureBicepSerialization();

        private JsonObjectSerialization? EnsureJsonSerialization()
        {
            if (_jsonSerializationInitialized)
                return _jsonSerialization;

            _jsonSerializationInitialized = true;
            _jsonSerialization = BuildJsonSerialization();
            return _jsonSerialization;
        }

        private XmlObjectSerialization? EnsureXmlSerialization()
        {
            if (_xmlSerializationInitialized)
                return _xmlSerialization;

            _xmlSerializationInitialized = true;
            _xmlSerialization = BuildXmlSerialization();
            return _xmlSerialization;
        }

        private BicepObjectSerialization? EnsureBicepSerialization()
        {
            if (_bicepSerializationInitialized)
                return _bicepSerialization;

            _bicepSerializationInitialized = true;
            _bicepSerialization = BuildBicepSerialization();
            return _bicepSerialization;
        }

        protected BicepObjectSerialization? BuildBicepSerialization()
        {
            // if this.Usages does not contain Output bit, then return null
            // alternate - is one of ancestors resource data or contained on a resource data
            var usage = GetUsage();

            return Configuration.AzureArm && Configuration.UseModelReaderWriter && Configuration.EnableBicepSerialization && usage.HasFlag(InputModelTypeUsage.Output) && JsonSerialization != null
                ? _serializationBuilder.BuildBicepObjectSerialization(this, JsonSerialization)
                : null;
        }

        protected abstract JsonObjectSerialization? BuildJsonSerialization();
        protected abstract XmlObjectSerialization? BuildXmlSerialization();


        protected abstract bool EnsureIncludeSerializer();
        protected abstract bool EnsureIncludeDeserializer();

        protected internal abstract InputModelTypeUsage GetUsage();

        // TODO -- despite this is actually a field if present, we have to make it a property to work properly with other functionalities in the generator, such as the `CodeWriter.WriteInitialization` method
        public virtual ObjectTypeProperty? RawDataField => null;

        private bool? _shouldHaveRawData;
        protected bool ShouldHaveRawData => _shouldHaveRawData ??= EnsureShouldHaveRawData();

        private bool EnsureShouldHaveRawData()
        {
            if (!Configuration.UseModelReaderWriter)
                return false;

            if (IsPropertyBag)
                return false;

            if (Inherits != null && Inherits is not { IsFrameworkType: false, Implementation: SystemObjectType })
                return false;

            return true;
        }

        protected const string PrivateAdditionalPropertiesPropertyDescription = "Keeps track of any properties unknown to the library.";
        protected const string PrivateAdditionalPropertiesPropertyName = "_serializedAdditionalRawData";
        protected static readonly CSharpType _privateAdditionalPropertiesPropertyType = typeof(IDictionary<string, BinaryData>);

        protected internal SourcePropertySerializationMapping? GetForMemberSerialization(string propertyDeclaredName)
        {
            foreach (var obj in EnumerateHierarchy())
            {
                if (obj is not SerializableObjectType so)
                    continue;

                var serialization = so.ModelTypeMapping?.GetForMemberSerialization(propertyDeclaredName);
                if (serialization is not null)
                    return serialization;
            }

            return null;
        }
    }
}
