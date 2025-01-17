// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.EnumProvider
{
    public class SerializationCustomizationTests
    {
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
            var plugin = await MockHelpers.LoadMockPluginAsync(
               inputEnums: () => [inputEnum],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            Assert.IsNull(plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t.IsEnum));

            var serializationProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is FixedEnumSerializationProvider);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanReplaceMethod()
        {
            var enumValues = new[]
            {
                InputFactory.EnumMember.Int32("Red", 1),
                InputFactory.EnumMember.Int32("Green", 2),
                InputFactory.EnumMember.Int32("Blue", 3)
            };
            var inputEnum = InputFactory.Enum("mockInputModel", underlyingType: InputPrimitiveType.String, values: enumValues);
            var plugin = await MockHelpers.LoadMockPluginAsync(
               inputEnums: () => [inputEnum],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var enumProvider = plugin.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t.IsEnum);
            Assert.IsNotNull(enumProvider);

            var serializationProvider = enumProvider!.SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(serializationProvider);

            var serializationProviderMethods = serializationProvider!.Methods;
            Assert.AreEqual(1, serializationProviderMethods.Count);
            Assert.IsFalse(serializationProviderMethods.Any(m => m.Signature.Name == "ToSerialString"));

            //The custom code view should contain the method
            var customCodeView = serializationProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("ToSerialString", customMethods[0].Signature.Name);
        }
    }
}
