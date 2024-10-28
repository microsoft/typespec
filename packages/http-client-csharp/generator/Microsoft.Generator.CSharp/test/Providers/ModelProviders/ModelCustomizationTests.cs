// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelProviders
{
    public class ModelCustomizationTests
    {
        // Validates that the property body's setter is correctly set based on the property type
        [Test]
        public async Task CanChangeModelName()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            AssertCommon(modelTypeProvider, "NewNamespace.Models", "CustomizedModel");
        }

        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            Assert.AreEqual("Prop2", modelTypeProvider.CustomCodeView.Properties[0].Name);
            var wireInfo = modelTypeProvider.CustomCodeView.Properties[0].WireInfo;
            Assert.IsNotNull(wireInfo);
            Assert.AreEqual( "prop1", wireInfo!.SerializedName);

            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            var fullCtor = modelTypeProvider.Constructors.Last();
            Assert.IsTrue(fullCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.AreEqual(2, fullCtor.Signature.Parameters.Count);
        }

        [Test]
        public async Task CanChangePropertyNameAndRedefineOriginal()
        {
            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the properties should be added to the custom code view
            Assert.AreEqual(2, modelTypeProvider.CustomCodeView!.Properties.Count);
            Assert.AreEqual("Prop2", modelTypeProvider.CustomCodeView.Properties[0].Name);
            var wireInfo = modelTypeProvider.CustomCodeView.Properties[0].WireInfo;
            Assert.IsNotNull(wireInfo);
            Assert.AreEqual("prop1", wireInfo!.SerializedName);
            Assert.AreEqual("Prop1", modelTypeProvider.CustomCodeView.Properties[1].Name);
            Assert.IsNull(modelTypeProvider.CustomCodeView.Properties[1].WireInfo);

            // validate canonical view
            Assert.AreEqual(2, modelTypeProvider.CanonicalView!.Properties.Count);
            Assert.AreEqual("Prop2", modelTypeProvider.CanonicalView.Properties[0].Name);
            Assert.AreEqual("Prop1", modelTypeProvider.CanonicalView.Properties[1].Name);
            wireInfo = modelTypeProvider.CanonicalView.Properties[0].WireInfo;
            Assert.IsNotNull(wireInfo);
            Assert.AreEqual("prop1", wireInfo!.SerializedName);
            Assert.IsNull(modelTypeProvider.CanonicalView.Properties[1].WireInfo);

            Assert.AreEqual(0, modelTypeProvider.Properties.Count);
        }

        [Test]
        public async Task CanChangePropertyType()
        {
            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the property type should be changed
            Assert.AreEqual(new CSharpType(typeof(int[])), modelTypeProvider.CustomCodeView.Properties[0].Type);
        }

        [Test]
        public async Task CanChangePropertyTypeToEnum()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputPrimitiveType.String)
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the property type should be changed
            Assert.AreEqual("SomeEnum", modelTypeProvider.CustomCodeView.Properties[0].Type.Name);
            Assert.IsTrue(modelTypeProvider.CustomCodeView.Properties[0].Type.IsNullable);
        }

        [Test]
        public async Task CanChangeListOfEnumPropToListOfExtensibleEnumField()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.Enum(
                    "MyEnum",
                    InputPrimitiveType.String,
                    usage: InputModelTypeUsage.Input,
                    values: [InputFactory.EnumMember.String("foo", "bar")])))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the field should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Fields.Count);
            // the canonical type should be changed
            Assert.AreEqual(2, modelTypeProvider.CanonicalView!.Fields.Count);

            var enumCollectionProp = modelTypeProvider.CanonicalView.Fields.Where(f => f.Name == "_prop1").FirstOrDefault();
            Assert.IsNotNull(enumCollectionProp);
            Assert.IsFalse(enumCollectionProp!.Type.IsNullable);
            Assert.IsTrue(enumCollectionProp.Type.IsList);

            var elementType = enumCollectionProp.Type.ElementType;
            Assert.AreEqual("MyEnum", elementType.Name);
            Assert.IsFalse(elementType.IsNullable);
            Assert.IsTrue(elementType.IsEnum);
            Assert.IsTrue(elementType.IsStruct);
        }

        [Test]
        public async Task CanChangeListOfEnumPropToListOfExtensibleEnum()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.Enum(
                    "MyEnum",
                    InputPrimitiveType.String,
                    usage: InputModelTypeUsage.Input,
                    values: [InputFactory.EnumMember.String("foo", "bar")])))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var enumCollectionProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", enumCollectionProp.Name);
            Assert.IsFalse(enumCollectionProp.Type.IsNullable);
            Assert.IsTrue(enumCollectionProp.Type.IsList);

            var elementType = enumCollectionProp.Type.ElementType;
            Assert.AreEqual("MyEnum", elementType.Name);
            Assert.IsFalse(elementType.IsNullable);
            Assert.IsTrue(elementType.IsEnum);
            Assert.IsTrue(elementType.IsStruct);
        }

        [Test]
        public async Task CanChangeDictOfEnumPropToDictOfExtensibleEnum()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Dictionary(InputFactory.Enum(
                    "MyEnum",
                    InputPrimitiveType.String,
                    usage: InputModelTypeUsage.Input,
                    values: [InputFactory.EnumMember.String("foo", "bar")])))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var enumCollectionProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", enumCollectionProp.Name);
            Assert.IsFalse(enumCollectionProp.Type.IsNullable);
            Assert.IsTrue(enumCollectionProp.Type.IsDictionary);

            var elementType = enumCollectionProp.Type.ElementType;
            Assert.AreEqual("MyEnum", elementType.Name);
            Assert.IsFalse(elementType.IsNullable);
            Assert.IsTrue(elementType.IsEnum);
            Assert.IsTrue(elementType.IsStruct);
        }

        [Test]
        public async Task CanChangePropertyAccessibility()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] {
                    InputFactory.Model("mockInputModel", properties: new[] {
                        InputFactory.Property("prop1", InputPrimitiveType.String)
                    })
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the property accessibility should be changed
            Assert.IsTrue(modelTypeProvider.CustomCodeView.Properties[0].Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            // the wire info should be stored on the custom property
            Assert.IsNotNull(modelTypeProvider.CustomCodeView.Properties[0].WireInfo);

            var fullCtor = modelTypeProvider.Constructors.Last();
            Assert.IsTrue(fullCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.AreEqual(2, fullCtor.Signature.Parameters.Count);
        }

        private static void AssertCommon(TypeProvider typeProvider, string expectedNamespace, string expectedName)
        {
            Assert.IsNotNull(typeProvider.CustomCodeView);
            Assert.AreEqual(expectedNamespace, typeProvider.Type.Namespace);
            Assert.AreEqual(expectedName, typeProvider.Type.Name);
            Assert.AreEqual(typeProvider.CustomCodeView?.Name, typeProvider.Type.Name);
            Assert.AreEqual(typeProvider.CustomCodeView?.Type.Namespace, typeProvider.Type.Namespace);
        }

        [TestCase]
        public async Task CanChangeToStruct()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.IsTrue(modelTypeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct));
            Assert.IsTrue(modelTypeProvider.Type.IsValueType);
        }

        [Test]
        public async Task CanChangeModelNameAndToStructAtSameTime()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.IsTrue(modelTypeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly | TypeSignatureModifiers.Struct));
            Assert.IsTrue(modelTypeProvider.Type.IsValueType);
            Assert.AreEqual("CustomizedModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace.Models", modelTypeProvider.Type.Namespace);
        }

        [Test]
        public async Task CanChangeAccessibility()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[] {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            Assert.IsTrue(modelTypeProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class));
            Assert.IsFalse(modelTypeProvider.Type.IsPublic);
        }

        [Test]
        public async Task CanChangeEnumToExtensibleEnum()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[] {
                InputFactory.EnumMember.Int32("val1", 1),
                InputFactory.EnumMember.Int32("val2", 2),
                InputFactory.EnumMember.Int32("val3", 3)
            };

            var inputEnum = InputFactory.Enum("mockInputModel", underlyingType: InputPrimitiveType.Int32, values: props, isExtensible: false);
            var enumProvider = EnumProvider.Create(inputEnum);

            Assert.IsTrue(enumProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Struct | TypeSignatureModifiers.ReadOnly));
        }

        [Test]
        public async Task CanChangeExtensibleEnumToEnum()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[] {
                InputFactory.EnumMember.Int32("val1", 1),
                InputFactory.EnumMember.Int32("val2", 2),
                InputFactory.EnumMember.Int32("val3", 3)
            };

            var inputEnum = InputFactory.Enum("mockInputModel", underlyingType: InputPrimitiveType.Int32, values: props, isExtensible: true);
            var enumProvider = EnumProvider.Create(inputEnum);

            Assert.IsTrue(enumProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum));
            Assert.AreEqual(3, enumProvider.EnumValues.Count);
            Assert.AreEqual("Val1", enumProvider.EnumValues[0].Name);
            Assert.AreEqual("Val2", enumProvider.EnumValues[1].Name);
            Assert.AreEqual("Val3", enumProvider.EnumValues[2].Name);
        }

        [Test]
        public async Task CanAddProperties()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);
            var customCodeView = modelTypeProvider.CustomCodeView;

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the custom properties shouldn't be added to the model provider
            Assert.AreEqual(1, modelTypeProvider.Properties.Count);
            Assert.AreEqual("Prop1", modelTypeProvider.Properties[0].Name);

            // the custom properties shouldn't be parameters of the model's ctor
            var modelCtors = modelTypeProvider.Constructors;
            foreach (var ctor in modelCtors)
            {
                Assert.IsFalse(ctor.Signature.Parameters.Any(p => p.Name == "newProperty" || p.Name == "newProperty2"));
            }

            // the custom properties should be added to the custom code view
            Assert.AreEqual(2, customCodeView!.Properties.Count);
            Assert.AreEqual("NewProperty", customCodeView.Properties[0].Name);
            Assert.AreEqual(new CSharpType(typeof(int)), customCodeView.Properties[0].Type);
            Assert.AreEqual(MethodSignatureModifiers.Public, customCodeView.Properties[0].Modifiers);
            Assert.IsTrue(customCodeView.Properties[0].Body.HasSetter);

            Assert.AreEqual("NewProperty2", customCodeView.Properties[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), customCodeView.Properties[1].Type);
            Assert.AreEqual(MethodSignatureModifiers.Public, customCodeView.Properties[1].Modifiers);
            Assert.IsFalse(customCodeView.Properties[1].Body.HasSetter);
        }

        [Test]
        public async Task CanRemoveProperty()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] {
                    InputFactory.Model("mockInputModel", properties: new[] {
                        InputFactory.Property("Prop1", InputPrimitiveType.String)
                    })
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
            Assert.AreEqual(0, plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Properties.Count);
        }

        [Test]
        public async Task CanRemoveField()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [InputFactory.Model("mockInputModel", properties: [])],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
            Assert.AreEqual(0, plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Fields.Count);
        }

        [Test]
        public async Task CanChangeEnumMemberName()
        {
            var enumValues = new[]
           {
                InputFactory.EnumMember.Int32("Red", 1),
                InputFactory.EnumMember.Int32("Green", 2),
                InputFactory.EnumMember.Int32("Blue", 3)
            };
            var inputEnum = InputFactory.Enum("mockInputModel", underlyingType: InputPrimitiveType.String, values: enumValues);
            await MockHelpers.LoadMockPluginAsync(
                inputEnumTypes: [inputEnum],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var enumProvider = EnumProvider.Create(inputEnum);
            var customCodeView = enumProvider.CustomCodeView;

            Assert.IsNotNull(enumProvider);

            // validate the enum provider uses the custom member name
            Assert.AreEqual(3, enumProvider!.EnumValues.Count);
            Assert.AreEqual("Red", enumProvider.EnumValues[0].Name);
            Assert.AreEqual("Green", enumProvider.EnumValues[1].Name);
            Assert.AreEqual("SkyBlue", enumProvider.EnumValues[2].Name);

            // the members should be added to the custom code view with the custom member names
            Assert.IsNotNull(customCodeView);
            Assert.AreEqual(3, customCodeView?.Fields.Count);
            Assert.AreEqual("Red", customCodeView?.Fields[0].Name);
            Assert.AreEqual("Green", customCodeView?.Fields[1].Name);
            Assert.AreEqual("SkyBlue", customCodeView?.Fields[2].Name);
        }

        // Validates that if a spec property is customized, then the property is not generated and the custom property
        // is used instead
        [Test]
        public async Task DoesNotGenerateExistingProperty()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
                        ])
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider);
            Assert.IsNotNull(modelTypeProvider);
            var customCodeView = modelTypeProvider!.CustomCodeView;

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the custom property shouldn't be added to the model provider
            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            // the custom property should still be parameters of the model's ctor
            var modelCtors = modelTypeProvider.Constructors;
            foreach (var ctor in modelCtors)
            {
                Assert.IsTrue(ctor.Signature.Parameters.Any(p => p.Name == "prop1"));
            }

            // the custom property should be added to the custom code view
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            Assert.AreEqual("Prop1", customCodeView.Properties[0].Name);
            Assert.AreEqual(new CSharpType(typeof(IList<string>)), customCodeView.Properties[0].Type);
            Assert.AreEqual(MethodSignatureModifiers.Internal, customCodeView.Properties[0].Modifiers);
            Assert.IsTrue(customCodeView.Properties[0].Body.HasSetter);
        }

        // Validates that if a custom property is added to the base model, and a property with the same name exists in the derived model,
        // then the derived model property is not generated and the custom property is used instead.
        [Test]
        public async Task DoesNotGenerateCustomPropertyFromBase()
        {
            var baseModel = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Input,
                properties: [InputFactory.Property("BaseProp", InputPrimitiveType.Int32, isRequired: true)]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.Int32, isRequired: true),
                        ],
                        baseModel: baseModel),
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider && t.Name == "MockInputModel");
            Assert.IsNotNull(modelTypeProvider);

            var baseModelTypeProvider = (modelTypeProvider as ModelProvider)?.BaseModelProvider;
            Assert.IsNotNull(baseModelTypeProvider);
            var customCodeView = baseModelTypeProvider!.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            Assert.IsNull(modelTypeProvider!.CustomCodeView);

            AssertCommon(baseModelTypeProvider, "Sample.Models", "BaseModel");

            Assert.AreEqual(1, baseModelTypeProvider!.Properties.Count);
            Assert.AreEqual("BaseProp", baseModelTypeProvider.Properties[0].Name);
            Assert.AreEqual(new CSharpType(typeof(int)), baseModelTypeProvider.Properties[0].Type);
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            Assert.AreEqual("Prop1", customCodeView.Properties[0].Name);
            // the spec property shouldn't be added to the model provider since a custom property with the same name exists
            Assert.AreEqual(0, modelTypeProvider.Properties.Count);

            // the custom property should not be parameters of the model's ctor
            var modelCtors = modelTypeProvider.Constructors;
            foreach (var ctor in modelCtors)
            {
                Assert.IsFalse(ctor.Signature.Parameters.Any(p => p.Name == "prop1"));
            }
        }

        [Test]
        public async Task CanReplaceConstructor()
        {
            var subModel = InputFactory.Model(
                "subModel",
                usage: InputModelTypeUsage.Input,
                properties: new[] { InputFactory.Property("SubProperty", InputPrimitiveType.Int32) });

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] {
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties: new[]
                        {
                            InputFactory.Property("Prop1", InputPrimitiveType.String),
                            InputFactory.Property("SubModel", subModel)
                        })
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // The generated code should not contain any ctors
            Assert.IsEmpty(plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors);
        }

        [Test]
        public async Task CanReplaceField()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] {
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties: []),
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // The generated code should not contain any fields
            Assert.IsEmpty(plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Fields);
        }

        [Test]
        public async Task DoesNotReplaceDefaultConstructorIfNotCustomized()
        {
            var plugin = MockHelpers.LoadMockPlugin(
                inputModelTypes: new[] {
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties: new[] { InputFactory.Property("Prop1", InputPrimitiveType.String) })
                });
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            var ctors = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors;
            Assert.AreEqual(2, ctors.Count);
            Assert.IsTrue(ctors.Any(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)));
            Assert.IsTrue(ctors.Any(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal)));
        }

        // Validates that if a required literal property is customized, then the default ctor
        // does not include the custom property as a parameter.
        [Test]
        public async Task DoesNotIncludeReqCustomLiteralInDefaultCtor()
        {
            var enumType = InputFactory.Enum(
                "originalEnum",
                InputPrimitiveType.String,
                values: [InputFactory.EnumMember.String("bar", "bar")]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("Prop1", InputFactory.Literal.Enum(enumType, "bar"), isRequired: true),
                            InputFactory.Property("Prop2", InputPrimitiveType.String, isRequired: true),
                        ])
                    ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            var ctors = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors;
            Assert.AreEqual(2, ctors.Count);

            var publicCtor = ctors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);

            var ctorParams = publicCtor!.Signature.Parameters;

            // should not have the custom required literal property
            Assert.AreEqual(1, ctorParams.Count);
            Assert.AreEqual("prop2", ctorParams[0].Name);
        }

        [Test]
        public async Task DoesNotIncludeReqCustomFieldLiteralInDefaultCtor()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("Prop1", InputFactory.Literal.String("bar"), isRequired: true),
                            InputFactory.Property("Prop2", InputPrimitiveType.String, isRequired: true),
                        ])
                    ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            var ctors = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors;
            Assert.AreEqual(2, ctors.Count);

            var publicCtor = ctors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);

            var ctorParams = publicCtor!.Signature.Parameters;

            // should not have the custom required literal property
            Assert.AreEqual(1, ctorParams.Count);
            Assert.AreEqual("prop2", ctorParams[0].Name);
        }

        [Test]
        public async Task CanChangeModelToAbstract()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] {
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties: []),
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // The generated type should be abstract
            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            Assert.IsTrue(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsTrue(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed));

            // There should be no model factory as there are no constructible models
            Assert.IsEmpty(plugin.Object.OutputLibrary.TypeProviders.Where(t => t is ModelFactoryProvider));
        }

        [Test]
        public async Task CanCustomizePropertyIntoReadOnlyMemory()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProp = InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.Int32));
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelFactoryProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactoryProvider);
            var writer = new TypeProviderWriter(modelFactoryProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
