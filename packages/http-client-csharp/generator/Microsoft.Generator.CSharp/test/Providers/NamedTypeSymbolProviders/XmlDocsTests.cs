using System;
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
        }

        private class InvalidDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "InvalidDocsModel";

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"This is an invalid description because it is missing closing slash<see cref=\"Y\">", MethodSignatureModifiers.Public, new CSharpType(typeof(int)), "X",
                        new AutoPropertyBody(true), this),
                    new PropertyProvider($"", MethodSignatureModifiers.Public, new CSharpType(typeof(BinaryData)), "Y",
                        new AutoPropertyBody(true), this),
                ];
            }
        }
    }
}
