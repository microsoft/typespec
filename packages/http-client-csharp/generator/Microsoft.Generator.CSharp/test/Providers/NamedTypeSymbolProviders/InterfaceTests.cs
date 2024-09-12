using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.NamedTypeSymbolProviders
{
    public class InterfaceTests
    {
        [Test]
        public void ValidateMethods()
        {
            var model = new Model();
            var compilation = CompilationHelper.LoadCompilation([model],
            [
                typeof(BinaryData),
                typeof(JsonSerializer),
                typeof(ClientResult)
            ]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "Model");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            var methods = namedTypeSymbolProvider.Methods;

            Assert.AreEqual(1, methods.Count);
            Assert.AreEqual("global::System.ClientModel.Primitives.IJsonModel<T>.Write", methods[0].Signature.Name);
            Assert.AreEqual(2, methods[0].Signature.Parameters.Count);
            Assert.IsTrue(methods[0].Signature.Parameters[0].Type.Equals(typeof(Utf8JsonWriter)));
            Assert.IsTrue(methods[0].Signature.Parameters[1].Type.Equals(typeof(ModelReaderWriterOptions)));
            Assert.IsNull(methods[0].Signature.ReturnType);
        }

        [Test]
        public void VerifyPropertyCanBeLoaded()
        {
            var model = new Model();
            var compilation = CompilationHelper.LoadCompilation([model], [typeof(BinaryData)]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "Model");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            Assert.AreEqual(2, namedTypeSymbolProvider.Properties.Count);
            Assert.AreEqual("X", namedTypeSymbolProvider.Properties[0].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[0].Type.Equals(typeof(int)));
            Assert.AreEqual("Y", namedTypeSymbolProvider.Properties[1].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[1].Type.Equals(typeof(BinaryData)));
        }

        [Test]
        public void VerifyBaseTypeIsNull()
        {
            var model = new Model();
            var compilation = CompilationHelper.LoadCompilation([model]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "Model");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            Assert.IsNull(namedTypeSymbolProvider.Type.BaseType);
        }

        private class Model : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "Model";

            protected override CSharpType[] BuildImplements()
            {
                return [new CSharpType(typeof(IJsonModel<>), Type)];
            }

            protected override MethodProvider[] BuildMethods()
            {
                var sig = new MethodSignature("Write", $"", MethodSignatureModifiers.None, null, $"", [ new ParameterProvider("writer", $"", typeof(Utf8JsonWriter)), new ParameterProvider("options", $"", typeof(ModelReaderWriterOptions)) ], null, null, null, new CSharpType(typeof(IJsonModel<>)));
                return [new MethodProvider(sig, Snippet.ThrowExpression(Snippet.Null), this, null)];
            }

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"", MethodSignatureModifiers.Public, new CSharpType(typeof(int)), "X",
                        new AutoPropertyBody(true), this),
                    new PropertyProvider($"", MethodSignatureModifiers.Public, new CSharpType(typeof(BinaryData)), "Y",
                        new AutoPropertyBody(true), this),
                ];
            }
        }
    }
}
