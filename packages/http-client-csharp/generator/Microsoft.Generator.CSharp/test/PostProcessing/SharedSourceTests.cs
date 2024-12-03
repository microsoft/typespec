// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using Sample.Models.Shared;

namespace Microsoft.Generator.CSharp.Tests.PostProcessing
{
    public class SharedSourceTests
    {
        [Test]
        public async Task SharedSourceFilesAreReduced()
        {
            var plugin = await MockHelpers.LoadMockPluginAsync(
                createOutputLibrary: () => new SharedSourceOutputLibrary(),
                typesToKeep: ["TypeUsingSharedSourceType"],
                sharedSourceDirectories: new[] { Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false), "Shared") });
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            var content = await File.ReadAllTextAsync(Path.Combine(plugin.Object.Configuration.OutputDirectory, "TypeUsingSharedSourceType.cs"));
            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(expected, content);
        }

        private class SharedSourceOutputLibrary : OutputLibrary
        {
            protected override TypeProvider[] BuildTypeProviders() => [new SharedSourceTypeProvider()];
        }

        private class SharedSourceTypeProvider : TypeProvider
        {
            protected override TypeSignatureModifiers GetDeclarationModifiers() =>
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

            protected override string GetNamespace() => "Sample.Models";
        }
    }
}
