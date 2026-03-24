// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.EnumProviders
{
    public class EnumProviderCustomizationTests
    {
        [Test]
        public async Task CanCustomizeExtensibleEnumAccessibility()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("One", 1),
                ("Two", 2)
            ],
                access: "internal",
                isExtensible: true);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType);
            Assert.IsTrue(enumType.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            Assert.IsFalse(enumType.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public async Task CanChangeFixedEnumNamespace()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("One", 1),
                ("Two", 2)
            ],
                isExtensible: false);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType);
            Assert.IsNull(enumType.CustomCodeView, "CustomCodeView should be null since no custom type is defined");
            Assert.AreEqual("NewNamespace.Models", enumType.Type.Namespace);
            Assert.AreEqual("MockInputEnum", enumType.Type.Name);
            Assert.IsTrue(enumType is FixedEnumProvider, "Enum should remain a FixedEnumProvider");
            Assert.AreEqual(2, enumType.EnumValues.Count);
            Assert.AreEqual(2, enumType.Fields.Count);
        }

        [Test]
        public async Task CanChangeExtensibleEnumNamespace()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("One", 1),
                ("Two", 2)
            ],
                isExtensible: true);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType);
            Assert.IsNull(enumType.CustomCodeView, "CustomCodeView should be null since no custom type is defined");
            Assert.AreEqual("NewNamespace.Models", enumType.Type.Namespace);
            Assert.AreEqual("MockInputEnum", enumType.Type.Name);
            Assert.IsTrue(enumType is ExtensibleEnumProvider, "Enum should remain an ExtensibleEnumProvider");
            Assert.AreEqual(2, enumType.EnumValues.Count);
        }

        [Test]
        public async Task CanChangeFixedEnumNamespacePreservesMembers()
        {
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("Red", 1),
                ("Green", 2),
                ("Blue", 3)
            ],
                isExtensible: false);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType);
            Assert.AreEqual("NewNamespace.Models", enumType.Type.Namespace);

            // Verify all enum members are preserved
            Assert.AreEqual(3, enumType.EnumValues.Count);
            Assert.AreEqual("Red", enumType.EnumValues[0].Name);
            Assert.AreEqual("Green", enumType.EnumValues[1].Name);
            Assert.AreEqual("Blue", enumType.EnumValues[2].Name);
            // Verify fields match enum values
            Assert.AreEqual(3, enumType.Fields.Count);
        }

        [Test]
        public async Task CanChangeFixedEnumNamespaceWithCodeGenTypeAndCodeGenNamespace()
        {
            // When both [CodeGenType] and [assembly: CodeGenNamespace] target the same type,
            // CodeGenType (CustomCodeView) takes precedence.
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("One", 1),
                ("Two", 2)
            ],
                isExtensible: false);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType);
            Assert.IsNotNull(enumType.CustomCodeView, "CustomCodeView should exist from [CodeGenType]");
            // CodeGenType's namespace wins over CodeGenNamespace
            Assert.AreEqual("CustomCodeView.Models", enumType.Type.Namespace);
            Assert.AreEqual("RenamedEnum", enumType.Type.Name);
        }

        [Test]
        public async Task CodeGenNamespaceIgnoredForNonMatchingType()
        {
            // [assembly: CodeGenNamespace("NonExistentType", ...)] should have no effect on other types.
            await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var input = InputFactory.Int32Enum("mockInputEnum",
            [
                ("One", 1),
                ("Two", 2)
            ],
                isExtensible: false);

            var enumType = EnumProvider.Create(input);
            Assert.IsNotNull(enumType);
            Assert.IsNull(enumType.CustomCodeView);
            // Should use the default namespace, not the assembly attribute's namespace
            Assert.AreEqual("Sample.Models", enumType.Type.Namespace);
            Assert.AreEqual("MockInputEnum", enumType.Type.Name);
        }
    }
}
