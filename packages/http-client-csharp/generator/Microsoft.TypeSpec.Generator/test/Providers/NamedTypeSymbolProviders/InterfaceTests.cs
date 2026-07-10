using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
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

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            var methods = namedTypeSymbolProvider.Methods;

            Assert.AreEqual(1, methods.Count);
            Assert.AreEqual("global::System.ClientModel.Primitives.IJsonModel<global::Sample.Model>.Write", methods[0].Signature.FullMethodName);
            Assert.AreEqual("Write", methods[0].Signature.Name);
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

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
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
            var compilation = CompilationHelper.LoadCompilation([model], [typeof(IJsonModel<>)]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "Model");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.IsNull(namedTypeSymbolProvider.Type.BaseType);
        }

        [Test]
        public void IncludesInterfacesInheritedFromBaseType()
        {
            var baseModel = new DisposableBaseModel();
            var derivedModel = new DerivedModel(baseModel);
            var compilation = CompilationHelper.LoadCompilation([baseModel, derivedModel], [typeof(IDisposable)]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "DerivedModel");

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            Assert.IsTrue(namedTypeSymbolProvider.Implements.Any(i => i.Equals(typeof(IDisposable))));
        }

        private class Model : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "Model";

            protected internal override CSharpType[] BuildImplements()
            {
                return [new CSharpType(typeof(IJsonModel<>), Type)];
            }

            protected internal override MethodProvider[] BuildMethods()
            {
                var sig = new MethodSignature("Write", $"", MethodSignatureModifiers.None, null, $"", [ new ParameterProvider("writer", $"", typeof(Utf8JsonWriter)), new ParameterProvider("options", $"", typeof(ModelReaderWriterOptions)) ], null, null, null, new CSharpType(typeof(IJsonModel<>), Type));
                return [new MethodProvider(sig, Snippet.ThrowExpression(Snippet.Null), this, null)];
            }

            protected internal override PropertyProvider[] BuildProperties()
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

        private class DisposableBaseModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "DisposableBaseModel";

            protected internal override CSharpType[] BuildImplements()
                => [typeof(IDisposable)];

            protected internal override MethodProvider[] BuildMethods()
                => [new MethodProvider(
                    new MethodSignature("Dispose", $"", MethodSignatureModifiers.Public, null, $"", []),
                    Snippet.ThrowExpression(Snippet.Null),
                    this)];
        }

        private class DerivedModel(DisposableBaseModel baseModel) : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "DerivedModel";

            protected override CSharpType? BuildBaseType() => baseModel.Type;
        }
    }
}
