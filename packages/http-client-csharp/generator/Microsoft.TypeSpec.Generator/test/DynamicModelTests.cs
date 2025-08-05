// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class DynamicModelTests
    {
        [Test]
        public void DynamicModel_ShouldNotGenerateRawDataField()
        {
            var inputModel = new InputModelType(
                name: "TestModel",
                @namespace: "TestNamespace",
                crossLanguageDefinitionId: "TestModel",
                access: null,
                deprecation: null,
                summary: null,
                doc: null,
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: new List<InputModelProperty>
                {
                    new InputModelProperty(
                        name: "Name",
                        summary: "Name property",
                        doc: "Name description",
                        type: new InputPrimitiveType(InputPrimitiveTypeKind.String),
                        isRequired: true,
                        isReadOnly: false,
                        access: null,
                        isDiscriminator: false,
                        serializedName: "name",
                        isHttpMetadata: false,
                        serializationOptions: new InputSerializationOptions()
                    )
                },
                baseModel: null,
                derivedModels: new List<InputModelType>(),
                discriminatorValue: null,
                discriminatorProperty: null,
                discriminatedSubtypes: new Dictionary<string, InputModelType>(),
                additionalProperties: null,
                modelAsStruct: false,
                serializationOptions: new InputSerializationOptions(),
                isDynamicModel: true
            );

            var modelProvider = new ModelProvider(inputModel);
            var fields = modelProvider.Fields;

            // Dynamic models should not have a raw data field
            Assert.That(fields.Any(f => f.Name.Contains("serializedAdditionalRawData")), Is.False);
        }

        [Test]
        public void RegularModel_ShouldGenerateRawDataField()
        {
            var inputModel = new InputModelType(
                name: "TestModel",
                @namespace: "TestNamespace", 
                crossLanguageDefinitionId: "TestModel",
                access: null,
                deprecation: null,
                summary: null,
                doc: null,
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: new List<InputModelProperty>
                {
                    new InputModelProperty("Name", "Name", "Name description", typeof(string), true, false, false)
                },
                baseModel: null,
                derivedModels: new List<InputModelType>(),
                discriminatorValue: null,
                discriminatorProperty: null,
                discriminatedSubtypes: new Dictionary<string, InputModelType>(),
                additionalProperties: null,
                modelAsStruct: false,
                serializationOptions: new InputSerializationOptions(),
                isDynamicModel: false
            );

            var modelProvider = new ModelProvider(inputModel);
            var fields = modelProvider.Fields;

            // Regular models should have a raw data field
            Assert.That(fields.Any(f => f.Name.Contains("serializedAdditionalRawData")), Is.True);
        }

        [Test]
        public void DynamicModel_ShouldGeneratePatchProperty()
        {
            var inputModel = new InputModelType(
                name: "TestModel",
                @namespace: "TestNamespace",
                crossLanguageDefinitionId: "TestModel",
                access: null,
                deprecation: null,
                summary: null,
                doc: null,
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: new List<InputModelProperty>
                {
                    new InputModelProperty("Name", "Name", "Name description", typeof(string), true, false, false)
                },
                baseModel: null,
                derivedModels: new List<InputModelType>(),
                discriminatorValue: null,
                discriminatorProperty: null,
                discriminatedSubtypes: new Dictionary<string, InputModelType>(),
                additionalProperties: null,
                modelAsStruct: false,
                serializationOptions: new InputSerializationOptions(),
                isDynamicModel: true
            );

            var modelProvider = new ModelProvider(inputModel);
            var properties = modelProvider.Properties;

            // Dynamic models should have a Patch property
            Assert.That(properties.Any(p => p.Name == "Patch"), Is.True);
            
            var patchProperty = properties.First(p => p.Name == "Patch");
            Assert.That(patchProperty.Type.Name, Is.EqualTo("Object")); // Placeholder type for now
        }

        [Test]
        public void RegularModel_ShouldNotGeneratePatchProperty()
        {
            var inputModel = new InputModelType(
                name: "TestModel",
                @namespace: "TestNamespace",
                crossLanguageDefinitionId: "TestModel",
                access: null,
                deprecation: null,
                summary: null,
                doc: null,
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                properties: new List<InputModelProperty>
                {
                    new InputModelProperty("Name", "Name", "Name description", typeof(string), true, false, false)
                },
                baseModel: null,
                derivedModels: new List<InputModelType>(),
                discriminatorValue: null,
                discriminatorProperty: null,
                discriminatedSubtypes: new Dictionary<string, InputModelType>(),
                additionalProperties: null,
                modelAsStruct: false,
                serializationOptions: new InputSerializationOptions(),
                isDynamicModel: false
            );

            var modelProvider = new ModelProvider(inputModel);
            var properties = modelProvider.Properties;

            // Regular models should not have a Patch property
            Assert.That(properties.Any(p => p.Name == "Patch"), Is.False);
        }
    }
}