// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelProviders
{
    public class ModelCustomizationTests
    {
        // Validates that the property body's setter is correctly set based on the property type
        [Test]
        public async Task CanChangeModelName()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            AssertCommon(modelTypeProvider, "NewNamespace.Models", "CustomizedModel");
        }

        [Test]
        public async Task CanChangeEnumName()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());


            var inputEnum = InputFactory.StringEnum("mockInputModel", [("value", "value")]);
            var enumProvider = new FixedEnumProvider(inputEnum, null);

            AssertCommon(enumProvider, "NewNamespace.Models", "CustomizedEnum");
        }

        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

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

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

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
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);
            Assert.AreEqual("Prop2", modelTypeProvider.CanonicalView.Properties[0].Name);
            wireInfo = modelTypeProvider.CanonicalView.Properties[0].WireInfo;
            Assert.IsNotNull(wireInfo);

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

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
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

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
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
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.StringEnum(
                    "MyEnum",
                    [("foo", "bar")],
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
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
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.StringEnum(
                    "MyEnum",
                    [("foo", "bar")],
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
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
                InputFactory.Property("Prop1", InputFactory.Dictionary(InputFactory.StringEnum(
                    "MyEnum",
                    [("foo", "bar")],
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
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
        public async Task CanChangeListOfModelToReadOnlyListOfModel()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.Model(
                    "Foo",
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var listProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", listProp.Name);
            Assert.IsFalse(listProp.Type.IsNullable);
            Assert.IsTrue(listProp.Type.IsList);

            var elementType = listProp.Type.ElementType;
            Assert.AreEqual("global::Sample.Models.Foo", elementType.ToString());
            Assert.AreEqual("Sample.Models", elementType.Namespace);
            Assert.IsFalse(elementType.IsNullable);
        }

        [Test]
        public async Task CanChangeListOfEnumToReadOnlyListOfEnum()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.StringEnum(
                    "Foo",
                    [("foo", "bar")],
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var listProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", listProp.Name);
            Assert.IsFalse(listProp.Type.IsNullable);
            Assert.IsTrue(listProp.Type.IsList);

            var elementType = listProp.Type.ElementType;
            Assert.AreEqual("global::Sample.Models.Foo", elementType.ToString());
            Assert.AreEqual("Sample.Models", elementType.Namespace);
            Assert.IsFalse(elementType.IsNullable);
            Assert.IsFalse(elementType.IsStruct);
            Assert.IsFalse(elementType.IsLiteral);
        }

        [Test]
        public async Task CanChangeListOfExtensibleEnumToReadOnlyListOfExtensibleEnum()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputFactory.StringEnum(
                    "MyEnum",
                    [("foo", "bar")],
                    isExtensible: true,
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var listProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", listProp.Name);
            Assert.IsFalse(listProp.Type.IsNullable);
            Assert.IsTrue(listProp.Type.IsList);

            var elementType = listProp.Type.ElementType;
            Assert.AreEqual("global::Sample.Models.Foo", elementType.ToString());
            Assert.AreEqual("Sample.Models", elementType.Namespace);
            Assert.IsFalse(elementType.IsNullable);
            Assert.IsTrue(elementType.IsStruct);
            Assert.IsFalse(elementType.IsLiteral);
        }

        [Test]
        public async Task CanChangeDictionaryOfModelToReadOnlyDictionaryOfModel()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Dictionary(InputFactory.Model(
                    "Foo",
                    usage: InputModelTypeUsage.Input)))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var listProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", listProp.Name);
            Assert.IsFalse(listProp.Type.IsNullable);
            Assert.IsTrue(listProp.Type.IsDictionary);

            var elementType = listProp.Type.ElementType;
            Assert.AreEqual("global::Sample.Models.Foo", elementType.ToString());
            Assert.AreEqual("Sample.Models", elementType.Namespace);
            Assert.IsFalse(elementType.IsNullable);
        }

        [Test]
        public async Task CanChangeModelProperty()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Model(
                    "Foo",
                    usage: InputModelTypeUsage.Input))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var modelProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", modelProp.Name);
            Assert.IsFalse(modelProp.Type.IsNullable);
            Assert.IsFalse(modelProp.Body.HasSetter);
            Assert.AreEqual("global::Sample.Models.Foo", modelProp.Type.ToString());
            Assert.AreEqual("Sample.Models", modelProp.Type.Namespace);
        }

        [Test]
        public async Task CanChangeModelPropertyWithChangedNamespace()
        {
            var propertyModel = InputFactory.Model(
                "Foo",
                usage: InputModelTypeUsage.Input);
            var props = new[]
            {
                InputFactory.Property("Prop1", propertyModel)
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [propertyModel, inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            var propertyModelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "Foo");
            // simulate a visitor that changes the model's namespace
            propertyModelProvider.Update(@namespace: "Updated.Namespace.Models");
            modelTypeProvider.Reset();

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView.Properties.Count);

            var modelProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", modelProp.Name);
            Assert.IsFalse(modelProp.Type.IsNullable);
            Assert.IsFalse(modelProp.Body.HasSetter);
            Assert.AreEqual("global::Updated.Namespace.Models.Foo", modelProp.Type.ToString());
            Assert.AreEqual("Updated.Namespace.Models", modelProp.Type.Namespace);
        }

        [Test]
        public async Task CanChangeModelPropertyWhenModelIsCustomized()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Model(
                    "Foo",
                    usage: InputModelTypeUsage.Input))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the canonical type should be changed
            Assert.AreEqual(1, modelTypeProvider.CanonicalView!.Properties.Count);

            var modelProp = modelTypeProvider.CanonicalView.Properties[0];
            Assert.AreEqual("Prop1", modelProp.Name);
            Assert.IsFalse(modelProp.Type.IsNullable);
            Assert.IsFalse(modelProp.Body.HasSetter);
            Assert.AreEqual("global::Sample.Models.Custom.Foo", modelProp.Type.ToString());
            Assert.AreEqual("Sample.Models.Custom", modelProp.Type.Namespace);
        }

        [Test]
        public async Task CanChangePropertyAccessibility()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: new[] {
                    InputFactory.Model("mockInputModel", properties: new[] {
                        InputFactory.Property("prop1", InputPrimitiveType.String)
                    })
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

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
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Updated to use Int32Enum with collection expression for values
            var inputEnum = InputFactory.Int32Enum(
                "mockInputModel",
                [("val1", 1), ("val2", 2), ("val3", 3)],
                isExtensible: false
            );
            var enumProvider = EnumProvider.Create(inputEnum);

            Assert.IsTrue(enumProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Struct | TypeSignatureModifiers.ReadOnly));
        }

        [Test]
        public async Task CanChangeExtensibleEnumToEnum()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Updated to use Int32Enum with collection expression for values
            var inputEnum = InputFactory.Int32Enum(
                "mockInputModel",
                [("val1", 1), ("val2", 2), ("val3", 3)],
                isExtensible: true
            );
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
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: new[] {
                    InputFactory.Model("mockInputModel", properties: new[] {
                        InputFactory.Property("Prop1", InputPrimitiveType.String)
                    })
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
            Assert.AreEqual(0, mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Properties.Count);
        }

        [Test]
        public async Task CanRemoveField()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [InputFactory.Model("mockInputModel", properties: [])],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();
            Assert.AreEqual(0, mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Fields.Count);
        }

        [Test]
        public async Task CanChangeEnumMemberName()
        {
            var inputEnum = InputFactory.Int32Enum("mockInputModel", [("Red", 1), ("Green", 2), ("Blue", 3)]);
            await MockHelpers.LoadMockGeneratorAsync(
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
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

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider);
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
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

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider && t.Name == "MockInputModel");
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

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
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
            Assert.IsEmpty(mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors);
        }

        [Test]
        public async Task CanReplaceField()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
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
            Assert.IsEmpty(mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Fields);
        }

        [Test]
        public async Task DoesNotReplaceDefaultConstructorIfNotCustomized()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModelTypes: new[] {
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties: new[] { InputFactory.Property("Prop1", InputPrimitiveType.String) })
                });
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            var ctors = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors;
            Assert.AreEqual(2, ctors.Count);
            Assert.IsTrue(ctors.Any(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)));
            Assert.IsTrue(ctors.Any(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal)));
        }

        // Validates that if a required literal property is customized, then the default ctor
        // does not include the custom property as a parameter.
        [Test]
        public async Task DoesNotIncludeReqCustomLiteralInDefaultCtor()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("Prop1", InputFactory.Literal.String("bar", name: "originalEnum"), isRequired: true),
                            InputFactory.Property("Prop2", InputPrimitiveType.String, isRequired: true),
                        ])
                    ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            var ctors = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors;
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
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

            var ctors = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors;
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
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
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
            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");
            Assert.IsTrue(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsTrue(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Sealed));

            // There should be no model factory as there are no constructible models
            Assert.IsEmpty(mockGenerator.Object.OutputLibrary.TypeProviders.Where(t => t is ModelFactoryProvider));
        }

        [Test]
        public async Task CanCustomizePropertyIntoReadOnlyMemory()
        {
            var modelProp = InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.Int32));
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelFactoryProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactoryProvider);
            var writer = new TypeProviderWriter(modelFactoryProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeDiscriminatorModel()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProp = InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.Int32));
            var discriminatorValues = InputFactory.StringEnum(
                "discriminatorValue",
                [("Foo", "foo"), ("Bar", "bar")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true);
            var discriminatorProp = InputFactory.Property("discriminator", discriminatorValues, isDiscriminator: true, isRequired: true);
            var fooModel = InputFactory.Model("fooModel", properties: [modelProp, discriminatorProp], usage: InputModelTypeUsage.Json, discriminatedKind: "foo");
            var barModel = InputFactory.Model("barModel", properties: [modelProp, discriminatorProp], usage: InputModelTypeUsage.Json, discriminatedKind: "bar");
            var inputModel = InputFactory.Model(
                "mockInputModel",
                properties: [modelProp, discriminatorProp],
                derivedModels: [fooModel, barModel], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel, fooModel, barModel],
                inputEnumTypes: [discriminatorValues],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider && t.Name == "FooModel");
            Assert.IsNotNull(modelProvider);
            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanChangeFrameworkTypeToCustomEnum()
        {
            // simulates a constant literal value that comes in from the emitter as an enum value
            var inputEnum = InputFactory.EnumMember.String("mockInputEnum", "val1", InputFactory.StringEnum("foo", []));
            var modelProp = InputFactory.Property("prop1", inputEnum);
            var inputModel = InputFactory.Model("mockInputModel", properties: [modelProp], usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            Assert.AreEqual(0, modelProvider.Properties.Count);
            Assert.AreEqual(1, modelProvider.CustomCodeView!.Properties.Count);
            Assert.AreEqual("Prop1", modelProvider.CustomCodeView.Properties[0].Name);
            Assert.AreEqual("CustomEnum", modelProvider.CustomCodeView.Properties[0].Type.Name);
            Assert.IsTrue(modelProvider.CustomCodeView.Properties[0].Type.IsLiteral);

            Assert.AreEqual(1, modelProvider.CanonicalView!.Properties.Count);
        }

        [Test]
        public async Task CanCustomizeTypeRenamedInVisitor()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var inputModel = InputFactory.Model("mockInputModel");
            var modelTypeProvider = new ModelProvider(inputModel);

            // Simulate a visitor that renames the type
            modelTypeProvider.Update(name: "RenamedModel");
            // Type should be renamed to the visitor value
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);

            Assert.IsNotNull(modelTypeProvider.CustomCodeView);
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.CustomCodeView!.Name);
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.CanonicalView.Type.Name);
        }

        [Test]
        public async Task CanCustomizeTypeWithChangedNamespaceInVisitor()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var inputModel = InputFactory.Model("mockInputModel", properties: []);
            var modelTypeProvider = new ModelProvider(inputModel);

            // Simulate a visitor that changes the namespace of the type
            modelTypeProvider.Update(@namespace: "NewNamespace");
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace", modelTypeProvider.Type.Namespace);

            Assert.IsNotNull(modelTypeProvider.CustomCodeView);
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.CustomCodeView!.Name);
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.CanonicalView.Type.Name);
            Assert.AreEqual("NewNamespace", modelTypeProvider.Type.Namespace);
            Assert.AreEqual("NewNamespace", modelTypeProvider.CanonicalView.Type.Namespace);
        }

        [Test]
        public async Task CanChangeTypeNameAfterTypeNamespace()
        {
            await MockHelpers.LoadMockGeneratorAsync();
            var inputModel = InputFactory.Model("mockInputModel", properties: []);
            var modelTypeProvider = new ModelProvider(inputModel);

            // Simulate a visitor that changes the namespace of the type
            modelTypeProvider.Update(@namespace: "NewNamespace");
            Assert.AreEqual("MockInputModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace", modelTypeProvider.Type.Namespace);

            // Simulate a visitor that changes the name of the type
            modelTypeProvider.Update(name: "CustomizedTypeName");
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace", modelTypeProvider.Type.Namespace);

            Assert.IsNull(modelTypeProvider.CustomCodeView);
        }

        [Test]
        public async Task CanChangeTypeNamespaceAfterTypeName()
        {
            await MockHelpers.LoadMockGeneratorAsync();
            var inputModel = InputFactory.Model("mockInputModel", properties: []);
            var modelTypeProvider = new ModelProvider(inputModel);

            // Simulate a visitor that changes the name of the type
            modelTypeProvider.Update(name: "CustomizedTypeName");
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);
            Assert.AreEqual("Sample.Models", modelTypeProvider.Type.Namespace);

            // Simulate a visitor that changes the namespace of the type
            modelTypeProvider.Update(@namespace: "NewNamespace");
            Assert.AreEqual("CustomizedTypeName", modelTypeProvider.Type.Name);
            Assert.AreEqual("NewNamespace", modelTypeProvider.Type.Namespace);

            Assert.IsNull(modelTypeProvider.CustomCodeView);
        }

        [Test]
        public void CanCustomizeWithVisitor()
        {
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model("mockInputModel");
            var modelTypeProvider = new ModelProvider(inputModel);

            // Ensure the relative file path is not cached with the old name
            _ = modelTypeProvider.RelativeFilePath;

            // Simulate a visitor that renames the type
            modelTypeProvider.Update(name: "RenamedModel");
            // Type should be renamed to the visitor value
            Assert.AreEqual("RenamedModel", modelTypeProvider.Type.Name);

            Assert.IsNull(modelTypeProvider.CustomCodeView);
            Assert.AreEqual("RenamedModel", modelTypeProvider.Type.Name);
            Assert.AreEqual("RenamedModel", modelTypeProvider.CanonicalView.Type.Name);

            // relative file path should use the new name
            var expected = Path.Join("src", "Generated", "Models", "RenamedModel.cs");
            Assert.AreEqual(expected, modelTypeProvider.RelativeFilePath);
        }

        [Test]
        public async Task CanCustomizeLiteralEnumProperty()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                properties:
                [
                    InputFactory.Property(
                        "prop1",
                        InputFactory.EnumMember.String("mockInputEnum", "val1", InputFactory.StringEnum("foo", [])), isRequired: true)
                ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelProvider);
            Assert.IsNotNull(modelTypeProvider);

            var canonicalView = modelTypeProvider!.CanonicalView;
            Assert.IsNotNull(canonicalView);
            Assert.AreEqual(1, canonicalView.Properties.Count);
            Assert.AreEqual("Prop1", canonicalView.Properties[0].Name);
            Assert.IsTrue(canonicalView.Properties[0].Type.IsLiteral);
            Assert.IsTrue(canonicalView.Properties[0].Type.IsEnum);
            Assert.IsTrue(canonicalView.Properties[0].Type.IsPublic);
            Assert.AreEqual("MockInputEnum", canonicalView.Properties[0].Type.Name);
            Assert.AreEqual("Sample.Models", canonicalView.Properties[0].Type.Namespace);

            // required property should be filtered from model factory method parameter
            var modelFactoryProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactoryProvider);
            var modelFactoryMethod = modelFactoryProvider!.Methods.SingleOrDefault(m => m.Signature.Name == "MockInputModel");
            Assert.IsNotNull(modelFactoryMethod);
            Assert.AreEqual(0, modelFactoryMethod!.Signature.Parameters.Count);

            // default value should be passed in the model factory method body
            StringAssert.Contains("0,", modelFactoryMethod.BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task CanCustomizeLiteralStringProperty()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var stringLiteral = InputFactory.Literal.String("literalValue");
            var inputModel = InputFactory.Model("mockInputModel", properties: [InputFactory.Property("prop1", stringLiteral)]);
            var modelTypeProvider = new ModelProvider(inputModel);

            var canonicalView = modelTypeProvider.CanonicalView;
            Assert.IsNotNull(canonicalView);
            Assert.AreEqual(1, canonicalView.Properties.Count);
            Assert.AreEqual("Prop1", canonicalView.Properties[0].Name);
            Assert.IsTrue(canonicalView.Properties[0].Type.IsLiteral);
            Assert.AreEqual(typeof(string), canonicalView.Properties[0].Type.FrameworkType);
            var body = canonicalView.Properties[0].Body as AutoPropertyBody;
            Assert.AreEqual("\"val1\"", body!.InitializationExpression!.ToDisplayString());
        }

        [Test]
        public async Task CanCustomizeLiteralIntProperty()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var intLiteral = InputFactory.Literal.Int32(42);
            var inputModel = InputFactory.Model("mockInputModel", properties: [InputFactory.Property("prop1", intLiteral)]);
            var modelTypeProvider = new ModelProvider(inputModel);

            var canonicalView = modelTypeProvider.CanonicalView;
            Assert.IsNotNull(canonicalView);
            Assert.AreEqual(1, canonicalView.Properties.Count);
            Assert.AreEqual("Prop1", canonicalView.Properties[0].Name);
            Assert.IsTrue(canonicalView.Properties[0].Type.IsLiteral);
            Assert.AreEqual(typeof(int), canonicalView.Properties[0].Type.FrameworkType);
            var body = canonicalView.Properties[0].Body as AutoPropertyBody;
            Assert.AreEqual("42", body!.InitializationExpression!.ToDisplayString());
        }

        [Test]
        public async Task CanCustomizeLiteralBoolProperty()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var boolLiteral = InputFactory.Literal.Bool(true);
            var inputModel = InputFactory.Model("mockInputModel", properties: [InputFactory.Property("prop1", boolLiteral)]);
            var modelTypeProvider = new ModelProvider(inputModel);

            var canonicalView = modelTypeProvider.CanonicalView;
            Assert.IsNotNull(canonicalView);
            Assert.AreEqual(1, canonicalView.Properties.Count);
            Assert.AreEqual("Prop1", canonicalView.Properties[0].Name);
            Assert.IsTrue(canonicalView.Properties[0].Type.IsLiteral);
            Assert.AreEqual(typeof(bool), canonicalView.Properties[0].Type.FrameworkType);
            var body = canonicalView.Properties[0].Body as AutoPropertyBody;
            Assert.AreEqual("true", body!.InitializationExpression!.ToDisplayString());
        }

        [Test]
        public void CanCustomizeRelativeFilePath()
        {
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model("mockInputModel");
            var modelTypeProvider = new ModelProvider(inputModel);

            // Simulate a visitor that modifies relative file path
            var updatedRelativeFilePath = Path.Join("src", "Generated", "Models", "MockInputModel.cs");
            modelTypeProvider.Update(relativeFilePath: updatedRelativeFilePath);

            Assert.AreEqual(updatedRelativeFilePath, modelTypeProvider.RelativeFilePath);
        }

        [Test]
        public async Task CanCustomizeModelNameWithCustomizedNamespace()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var props = new[]
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
            var modelTypeProvider = new ModelProvider(inputModel);

            var namespaceVisitor = new TestNamespaceVisitor();
            var nameVisitor = new TestNameVisitor();
            var updatedModel = nameVisitor.InvokeVisit(namespaceVisitor.InvokeVisit(modelTypeProvider)!);
            Assert.IsNotNull(updatedModel);
            Assert.AreEqual("CustomizedModel", updatedModel!.Name);
            Assert.AreEqual("NewNamespace", updatedModel.Type.Namespace);
        }

        [Test]
        public async Task DiscriminatorPropertyNotGeneratedIfOnCustomizedBase()
        {
            var childModel = InputFactory.Model("mockInputModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String, isDiscriminator: true)], usage: InputModelTypeUsage.Json);
            var baseModel = InputFactory.Model(
                "mockInputModelBase",
                properties: [InputFactory.Property("prop1", InputPrimitiveType.String)],
                usage: InputModelTypeUsage.Json);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [childModel, baseModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            // should not have the additionalProperties dictionary
            Assert.AreEqual(0, modelProvider.Fields.Count);
            Assert.IsNotNull(modelProvider.BaseType);
            Assert.AreEqual(0, modelProvider.Properties.Count);

            Assert.IsNotNull(modelProvider.BaseTypeProvider);
            Assert.AreEqual(1, modelProvider.BaseTypeProvider!.Properties.Count);
            Assert.AreEqual("Prop1", modelProvider.BaseTypeProvider.Properties[0].Name);

            Assert.AreEqual("MockInputModelBase", modelProvider.BaseType!.Name);
            Assert.AreEqual("Sample.Models", modelProvider.BaseType!.Namespace);
        }

        private class NameSpaceVisitor : LibraryVisitor
        {
            protected override TypeProvider? VisitType(TypeProvider type)
            {
                if (type is ModelProvider model)
                {
                    model.Update(@namespace: "NewNamespace");
                }
                return base.VisitType(type);
            }
        }

        private class NameVisitor : LibraryVisitor
        {
            protected override TypeProvider? VisitType(TypeProvider type)
            {
                if (type is ModelProvider model)
                {
                    model.Update(name: "CustomizedModel");
                }
                return base.VisitType(type);
            }
        }

        private class TestNamespaceVisitor : NameSpaceVisitor
        {
            public TypeProvider? InvokeVisit(TypeProvider type)
            {
                return base.VisitType(type);
            }
        }

        private class TestNameVisitor : NameVisitor
        {
            public TypeProvider? InvokeVisit(TypeProvider type)
            {
                return base.VisitType(type);
            }
        }
    }
}
