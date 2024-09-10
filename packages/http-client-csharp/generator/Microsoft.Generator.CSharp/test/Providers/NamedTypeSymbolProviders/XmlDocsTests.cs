using System;
using System.IO;
using System.Linq;
using System.Xml;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.NamedTypeSymbolProviders
{
    public class XmlDocsTests
    {
        [Test]
        public void InvalidDocsThrows()
        {
            var model = new InvalidDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "InvalidDocsModel");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            var ex = Assert.Throws<InvalidOperationException>(() => _ = namedTypeSymbolProvider.Properties);
            Assert.IsInstanceOf<XmlException>(ex!.InnerException);
            StringAssert.Contains(
                $"The malformed XML documentation is located in one or more of the following files: .{Path.DirectorySeparatorChar}InvalidDocsModel.cs",
                ex.Message);
        }

        [Test]
        public void ValidDocsDoNotThrow()
        {
            var model = new ValidDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "ValidDocsModel");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            Assert.AreEqual(2, namedTypeSymbolProvider.Properties.Count);
            Assert.AreEqual("X", namedTypeSymbolProvider.Properties[0].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[0].Type.Equals(typeof(int)));
            Assert.AreEqual("Y", namedTypeSymbolProvider.Properties[1].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[1].Type.Equals(typeof(string)));
        }

        private class InvalidDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "InvalidDocsModel";

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

        private class ValidDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "ValidDocsModel";

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
