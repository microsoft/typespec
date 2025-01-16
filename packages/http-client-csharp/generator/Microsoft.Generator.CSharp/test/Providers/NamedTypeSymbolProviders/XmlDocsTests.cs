using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Xml;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.NamedTypeSymbolProviders
{
    public class XmlDocsTests
    {
        [Test]
        public void InvalidPropertyDocsThrows()
        {
            var model = new InvalidPropertyDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(InvalidPropertyDocsModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            var ex = Assert.Throws<InvalidOperationException>(() => _ = namedTypeSymbolProvider.Properties);
            Assert.IsInstanceOf<XmlException>(ex!.InnerException);
            StringAssert.Contains(
                $"The malformed XML documentation is located in one or more of the following files: .{Path.DirectorySeparatorChar}{nameof(InvalidPropertyDocsModel)}.cs",
                ex.Message);
        }

        [Test]
        public void ValidDocsDoNotThrow()
        {
            var model = new ValidDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(ValidDocsModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            Assert.AreEqual(2, namedTypeSymbolProvider.Properties.Count);
            Assert.AreEqual("X", namedTypeSymbolProvider.Properties[0].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[0].Type.Equals(typeof(int)));
            Assert.AreEqual("Y", namedTypeSymbolProvider.Properties[1].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[1].Type.Equals(typeof(string)));
        }

        [Test]
        public void InvalidParameterDocsThrows()
        {
            var model = new InvalidParameterDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(InvalidParameterDocsModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            var ex = Assert.Throws<InvalidOperationException>(() => _ = namedTypeSymbolProvider.Methods);
            Assert.IsInstanceOf<XmlException>(ex!.InnerException);
            StringAssert.Contains(
                $"The malformed XML documentation is located in one or more of the following files: .{Path.DirectorySeparatorChar}{nameof(InvalidParameterDocsModel)}.cs",
                ex.Message);
        }

        private class InvalidPropertyDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(InvalidPropertyDocsModel);

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"This is an invalid description because it is missing closing slash <see cref=\"Y\">", MethodSignatureModifiers.Public, new CSharpType(typeof(int)), "X",
                        new AutoPropertyBody(true), this),
                    new PropertyProvider($"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), "Y",
                        new AutoPropertyBody(true), this),
                ];
            }
        }

        private class InvalidParameterDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(InvalidParameterDocsModel);

            protected override MethodProvider[] BuildMethods()
            {
                var sig = new MethodSignature("Write", $"", MethodSignatureModifiers.Public, null, $"", [ new ParameterProvider("value", $"This is an invalid description because it is missing closing slash <see cref=\"Y\">", typeof(int)), new ParameterProvider("options", $"", typeof(string)) ]);
                return [new MethodProvider(sig, Snippet.ThrowExpression(Snippet.Null), this, null)];
            }
        }

        private class ValidDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(ValidDocsModel);

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"This is a valid description <see cref=\"Y\"/>", MethodSignatureModifiers.Public, new CSharpType(typeof(int)), "X",
                        new AutoPropertyBody(true), this),
                    new PropertyProvider($"", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), "Y",
                        new AutoPropertyBody(true), this),
                ];
            }
        }
    }
}
