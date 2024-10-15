using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Providers.NamedTypeSymbolProviders;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class CanonicalTypeProviderTests
    {
        private NamedTypeSymbolProvider _namedTypeSymbolProvider;
        private NamedSymbol _namedSymbol;
        private readonly TestTypeProvider _typeProvider;
        private readonly Compilation _compilation;

        public CanonicalTypeProviderTests()
        {
            _namedSymbol = new NamedSymbol(name: "TestName");
            _compilation = CompilationHelper.LoadCompilation([_namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(_compilation.Assembly.Modules.First().GlobalNamespace, "TestName");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            _typeProvider = new TestTypeProvider();
        }

        [SetUp]
        public async Task Setup()
        {
            await MockHelpers.LoadMockPluginAsync(compilation: () => Task.FromResult(_compilation));
        }

        [Test]
        public void ValidateModifiers()
        {
            var modifiers = _typeProvider.CanonicalView.DeclarationModifiers;
            Assert.IsTrue(modifiers.HasFlag(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class));
        }

        [Test]
        public void ValidateName()
        {
            Assert.AreEqual(_typeProvider.Name, _typeProvider.CanonicalView.Name);
        }

        [Test]
        public void ValidateNamespace()
        {
            Assert.AreEqual(_typeProvider.Namespace, _typeProvider.CanonicalView.Namespace);
        }

        [Test]
        public void ValidateProperties()
        {
            Dictionary<string, PropertyProvider> properties = _typeProvider.CanonicalView.Properties.ToDictionary(p => p.Name);
            Assert.AreEqual(5, properties.Count);
            Assert.AreEqual(1, _typeProvider.Properties.Count);
            Assert.AreEqual(4, _typeProvider.CustomCodeView!.Properties.Count);
            foreach (var expected in _namedSymbol.Properties)
            {
                var actual = properties[expected.Name];

                Assert.IsTrue(properties.ContainsKey(expected.Name));
                Assert.AreEqual(expected.Name, actual.Name);
                Assert.AreEqual($"{expected.Description}.", actual.Description.ToString()); // the writer adds a period
                Assert.AreEqual(expected.Modifiers, actual.Modifiers);
                Assert.AreEqual(expected.Type, actual.Type);
                Assert.AreEqual(expected.Body.GetType(), actual.Body.GetType());
                Assert.AreEqual(expected.Body.HasSetter, actual.Body.HasSetter);
            }
        }


        private class TestTypeProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => "NamedSymbol";

            protected override string BuildName() => "TestName";

            protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

            protected override TypeSignatureModifiers GetDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial |TypeSignatureModifiers.Class;

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    // customized by the NamedSymbol
                    new PropertyProvider($"Foo property", MethodSignatureModifiers.Public, typeof(int), "IntProperty", new AutoPropertyBody(true), this, wireInfo: new PropertyWireInformation(SerializationFormat.Default, true, true, true, false, "intProperty")),
                    // not customized by the NamedSymbol
                    new PropertyProvider($"Bar property", MethodSignatureModifiers.Public, typeof(string), "SpecProperty", new AutoPropertyBody(false), this, wireInfo: new PropertyWireInformation(SerializationFormat.Default, true, true, true, false, "stringProperty")),
                ];
            }
        }
    }
}
