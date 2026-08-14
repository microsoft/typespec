// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

#pragma warning disable SCME0004 // FileBinaryContent is evaluation-only.

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.NamedTypeSymbolProviders
{
    /// <summary>
    /// Validates that experimental (evaluation-only) framework types such as
    /// <see cref="FileBinaryContent"/> are resolved as framework types when the symbols are loaded from
    /// the last contract and converted into <see cref="CSharpType"/> instances.
    /// </summary>
    public class ExperimentalFrameworkTypeTests
    {
        private static readonly MetadataReference[] _clientModelReferences =
        [
            MetadataReference.CreateFromFile(typeof(FileBinaryContent).Assembly.Location),
            MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location),
        ];

        private static async Task<TypeProvider> LoadLastContractTypeAsync()
        {
            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(
                    additionalMetadataReferences: _clientModelReferences,
                    method: "LastContract"));

            var provider = CodeModelGenerator.Instance.SourceInputModel!.FindForTypeInLastContract("Sample", "SampleClient");
            Assert.IsNotNull(provider, "Failed to resolve 'Sample.SampleClient' from the last contract.");
            return provider!;
        }

        [Test]
        public async Task ExperimentalPropertyTypeFromLastContractIsFrameworkType()
        {
            var provider = await LoadLastContractTypeAsync();

            var property = provider.Properties.SingleOrDefault(p => p.Name == "Content");
            Assert.IsNotNull(property, "Failed to resolve the 'Content' property from the last contract.");

            Assert.IsTrue(property!.Type.IsFrameworkType, "Expected the experimental type to resolve to a framework type.");
            Assert.AreEqual(typeof(FileBinaryContent), property.Type.FrameworkType);
            Assert.IsTrue(property.Type.Equals(new CSharpType(typeof(FileBinaryContent))));
        }

        [Test]
        public async Task ExperimentalTypeArgumentFromLastContractIsFrameworkType()
        {
            var provider = await LoadLastContractTypeAsync();

            var property = provider.Properties.SingleOrDefault(p => p.Name == "Contents");
            Assert.IsNotNull(property, "Failed to resolve the 'Contents' property from the last contract.");

            Assert.IsTrue(property!.Type.IsFrameworkType);
            Assert.AreEqual(typeof(IList<>), property.Type.FrameworkType);
            Assert.AreEqual(1, property.Type.Arguments.Count);
            Assert.IsTrue(property.Type.Arguments[0].IsFrameworkType, "Expected the experimental type argument to resolve to a framework type.");
            Assert.AreEqual(typeof(FileBinaryContent), property.Type.Arguments[0].FrameworkType);
        }

        [Test]
        public async Task ExperimentalMethodSignatureTypesFromLastContractAreFrameworkTypes()
        {
            var provider = await LoadLastContractTypeAsync();

            var method = provider.Methods.SingleOrDefault(m => m.Signature.Name == "GetContent");
            Assert.IsNotNull(method, "Failed to resolve the 'GetContent' method from the last contract.");

            var returnType = method!.Signature.ReturnType;
            Assert.IsNotNull(returnType);
            Assert.IsTrue(returnType!.IsFrameworkType, "Expected the experimental return type to resolve to a framework type.");
            Assert.AreEqual(typeof(FileBinaryContent), returnType.FrameworkType);

            var parameterType = method.Signature.Parameters.Single().Type;
            Assert.IsTrue(parameterType.IsFrameworkType, "Expected the experimental parameter type to resolve to a framework type.");
            Assert.AreEqual(typeof(FileBinaryContent), parameterType.FrameworkType);
        }

        [Test]
        public async Task NonExperimentalClientModelTypeFromLastContractIsFrameworkType()
        {
            var provider = await LoadLastContractTypeAsync();

            var method = provider.Methods.SingleOrDefault(m => m.Signature.Name == "UploadContent");
            Assert.IsNotNull(method, "Failed to resolve the 'UploadContent' method from the last contract.");

            var returnType = method!.Signature.ReturnType;
            Assert.IsNotNull(returnType);
            Assert.IsTrue(returnType!.IsFrameworkType, "Expected the System.ClientModel type to resolve to a framework type.");
            Assert.AreEqual(typeof(ClientResult), returnType.FrameworkType);
        }
    }
}
