// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using Sample.Models.Shared;

namespace Microsoft.TypeSpec.Generator.Tests.PostProcessing
{
    public class SharedSourceTests
    {
        [Test]
        public async Task SharedSourceFilesAreReduced()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => new SharedSourceOutputLibrary(),
                typesToKeep: ["TypeUsingSharedSourceType"],
                sharedSourceDirectories: new[] { Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false), "Shared") });
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            var content = await File.ReadAllTextAsync(Path.Combine(mockGenerator.Object.Configuration.OutputDirectory, "TypeUsingSharedSourceType.cs"));
            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(expected, content);
        }

        private class SharedSourceOutputLibrary : OutputLibrary
        {
            protected override TypeProvider[] BuildTypeProviders() => [new SharedSourceTypeProvider()];
        }

        private class SharedSourceTypeProvider : TypeProvider
        {
            protected override TypeSignatureModifiers BuildDeclarationModifiers() =>
                TypeSignatureModifiers.Public | TypeSignatureModifiers.Class;

            protected override MethodProvider[] BuildMethods()
            {
                return [new MethodProvider(
                    new MethodSignature(
                        "TestMethod",
                        $"Desc",
                    MethodSignatureModifiers.Public,
                    typeof(SharedSourceType),
                    $"", []),
                    Snippet.ThrowExpression(Snippet.Null), this)];
            }

            protected override string BuildRelativeFilePath() => "TypeUsingSharedSourceType.cs";

            protected override string BuildName() => "TypeUsingSharedSourceType";

            protected override string BuildNamespace() => "Sample.Models";
        }
    }
}
