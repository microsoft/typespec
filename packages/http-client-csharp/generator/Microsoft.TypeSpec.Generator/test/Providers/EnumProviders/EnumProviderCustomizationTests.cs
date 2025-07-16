// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
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
    }
}
