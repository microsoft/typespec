// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

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
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
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
        }

        [Test]
        public async Task CanChangePropertyType()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
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
        public async Task CanChangePropertyAccessibility()
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
            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel");

            AssertCommon(modelTypeProvider, "Sample.Models", "MockInputModel");

            // the property should be added to the custom code view
            Assert.AreEqual(1, modelTypeProvider.CustomCodeView!.Properties.Count);
            // the property accessibility should be changed
            Assert.IsTrue(modelTypeProvider.CustomCodeView.Properties[0].Modifiers.HasFlag(MethodSignatureModifiers.Internal));
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
            Assert.AreEqual(3, enumProvider!.Fields.Count);
            Assert.AreEqual("Red", enumProvider.Fields[0].Name);
            Assert.AreEqual("Green", enumProvider.Fields[1].Name);
            Assert.AreEqual("SkyBlue", enumProvider.Fields[2].Name);

            // the members should also be added to the custom code view
            Assert.IsNotNull(customCodeView);
            Assert.AreEqual(3, customCodeView?.Fields.Count);
            Assert.AreEqual("Red", customCodeView?.Fields[0].Name);
            Assert.AreEqual("Green", customCodeView?.Fields[1].Name);
            Assert.AreEqual("SkyBlue", customCodeView?.Fields[2].Name);
        }

        [Test]
        public async Task CanReplaceConstructor()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModelTypes: new[] {
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties: new[] { InputFactory.Property("Prop1", InputPrimitiveType.String) })
                },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // The generated code should only contain the single internal ctor containing the properties
            var ctor = plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputModel").Constructors.Single();
            Assert.IsTrue(ctor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.AreEqual("prop1", ctor.Signature.Parameters.First().Name);
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
    }
}
