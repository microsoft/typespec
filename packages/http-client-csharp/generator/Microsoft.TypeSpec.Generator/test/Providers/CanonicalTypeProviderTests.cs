using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class CanonicalTypeProviderTests
    {
        private NamedSymbol _namedSymbol;
        private readonly TestTypeProvider _typeProvider;
        private readonly Compilation _compilation;

        public CanonicalTypeProviderTests()
        {
            const string name = "TestName";
            const string ns = "Sample.Models";
            _namedSymbol = new NamedSymbol(name: name, @namespace: ns);
            _compilation = CompilationHelper.LoadCompilation([_namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(_compilation.Assembly.Modules.First().GlobalNamespace, name);

            _typeProvider = new TestTypeProvider(name, ns);
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
            Assert.AreEqual(_typeProvider.Type.Namespace, _typeProvider.CanonicalView.Type.Namespace);
        }

        [Test]
        public void ValidateProperties()
        {
            // customization code provides 4 properties:
            // - public int IntProperty { get; set; }
            // - public string StringProperty { get; }
            // - public string InternalStringProperty { get; }
            // - public PropertyType PropertyTypeProperty { get; set; }
            // generated code provides 2 properties:
            // - public int IntProperty { get; set; }
            // - public string SpecProperty { get; }
            // therefore the CanonicalType should have 5 properties:
            // - public int IntProperty { get; set; } (from customization code)
            // - public string StringProperty { get; } (from customization code)
            // - public string InternalStringProperty { get; } (from customization code)
            // - public PropertyType PropertyTypeProperty { get; set; } (from customization code)
            // - public string SpecProperty { get; } (from generated code)
            Dictionary<string, PropertyProvider> properties = _typeProvider.CanonicalView.Properties.ToDictionary(p => p.Name);
            Assert.AreEqual(5, properties.Count);
            Assert.AreEqual(1, _typeProvider.Properties.Count);
            Assert.AreEqual(4, _typeProvider.CustomCodeView!.Properties.Count);
            foreach (var expected in _namedSymbol.Properties)
            {
                var actual = properties[expected.Name];

                Assert.IsTrue(properties.ContainsKey(expected.Name));
                Assert.AreEqual(expected.Name, actual.Name);
                Assert.IsNotNull(actual.Description);
                Assert.AreEqual($"{expected.Description}.", actual.Description!.ToString()); // the writer adds a period
                Assert.AreEqual(expected.Modifiers, actual.Modifiers);
                Assert.AreEqual(expected.Type, actual.Type);
                Assert.AreEqual(expected.Body.GetType(), actual.Body.GetType());
                Assert.AreEqual(expected.Body.HasSetter, actual.Body.HasSetter);
            }
        }

        [Test]
        public void ValidateMethods()
        {
            // customization code provides a method:
            // - public virtual Task<int> Method1(int intParam)
            // generated code provides three methods:
            // - internal virtual Task<string> Method1(int p)
            // - public virtual Task<string> Method1(string strParam)
            // - public virtual Task Method2(float floatParam)
            // therefore the CanonicalType should have three methods:
            // - public virtual Task<int> Method1(int intParam)
            // - public virtual Task<string> Method1(string strParam)
            // - public virtual Task Method2(float floatParam)
            var methods = _typeProvider.CanonicalView.Methods;

            Assert.AreEqual(3, methods.Count);
            Assert.AreEqual(2, _typeProvider.Methods.Count);
            Assert.AreEqual(1, _typeProvider.CustomCodeView!.Methods.Count);

            // the first should be public virtual Task<string> Method1(string strParam)
            var first = methods[0].Signature;
            Assert.AreEqual("Method1", first.Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, first.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(Task<string>)), first.ReturnType);
            Assert.AreEqual(1, first.Parameters.Count);
            Assert.AreEqual("strParam", first.Parameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), first.Parameters[0].Type);

            // the second should be public virtual Task Method2(float floatParam)
            var second = methods[1].Signature;
            Assert.AreEqual("Method2", second.Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, second.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(Task)), second.ReturnType);
            Assert.AreEqual(1, second.Parameters.Count);
            Assert.AreEqual("floatParam", second.Parameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(float)), second.Parameters[0].Type);

            // the third should be public virtual Task<int> Method1(int intParam)
            var third = methods[2].Signature;
            Assert.AreEqual("Method1", third.Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, third.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(Task<int>)), third.ReturnType);
            Assert.AreEqual(1, third.Parameters.Count);
            Assert.AreEqual("intParam", third.Parameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(int)), third.Parameters[0].Type);
        }


        private class TestTypeProvider : TypeProvider
        {
            private readonly string _name;
            private readonly string _namespace;
            public TestTypeProvider(string name, string ns)
            {
                _name = name;
                _namespace = ns;
            }
            protected override string BuildRelativeFilePath() => "NamedSymbol";

            protected override string BuildName() => _name;

            protected override string BuildNamespace() => _namespace;

            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial |TypeSignatureModifiers.Class;

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

            protected override MethodProvider[] BuildMethods()
            {
                var intParam = new ParameterProvider("p", $"I have a wrong name", typeof(int));
                var strParam = new ParameterProvider("strParam", $"I have the correct name", typeof(string));
                var floatParam = new ParameterProvider("floatParam", $"I have the correct name", typeof(float));
                return
                [
                    // customized by the NamedSymbol
                    new MethodProvider(
                        new MethodSignature("Method1", $"I am going to be replaced", MethodSignatureModifiers.Internal | MethodSignatureModifiers.Virtual, typeof(Task<string>), null, [intParam]),
                        Throw(Null),
                        this),
                    // not customized by the NamedSymbol - this is an overload of the above method
                    new MethodProvider(
                        new MethodSignature("Method1", $"I should not be replaced", MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, typeof(Task<string>), null, [strParam]),
                        Throw(Null),
                        this),
                    // not customized by the NamedSymbol - this is a new method
                    new MethodProvider(
                        new MethodSignature("Method2", $"I should not be replaced", MethodSignatureModifiers.Public| MethodSignatureModifiers.Virtual, typeof(Task), null, [floatParam]),
                        Throw(Null),
                        this),
                ];
            }
        }
    }
}
