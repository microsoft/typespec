using System;
using System.IO;
using System.Linq;
using System.Xml;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public class XmlDocsTests
    {
        [Test]
        public void InvalidPropertyDocsThrows()
        {
            var model = new InvalidPropertyDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(InvalidPropertyDocsModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
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

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.AreEqual(2, namedTypeSymbolProvider.Properties.Count);
            Assert.AreEqual("X", namedTypeSymbolProvider.Properties[0].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[0].Type.Equals(typeof(int)));
            Assert.AreEqual("Y", namedTypeSymbolProvider.Properties[1].Name);
            Assert.IsTrue(namedTypeSymbolProvider.Properties[1].Type.Equals(typeof(string)));
        }

        [Test]
        public void SeeTagWithTypePrefixProcessedCorrectly()
        {
            var model = new SeeTagWithTypePrefixModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(SeeTagWithTypePrefixModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.AreEqual(1, namedTypeSymbolProvider.Properties.Count);

            var property = namedTypeSymbolProvider.Properties[0];
            Assert.AreEqual("TestProperty", property.Name);

            var description = property.Description?.ToString() ?? string.Empty;
            Assert.That(description, Contains.Substring("Initializes a new instance of <see cref=\"System.String\"/>."));
        }

        [Test]
        public void SeeTagWithoutTypePrefixProcessedCorrectly()
        {
            var model = new SeeTagWithoutTypePrefixModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(SeeTagWithoutTypePrefixModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.AreEqual(1, namedTypeSymbolProvider.Properties.Count);

            var property = namedTypeSymbolProvider.Properties[0];
            Assert.AreEqual("TestProperty", property.Name);

            var description = property.Description?.ToString() ?? string.Empty;
            Assert.That(description, Contains.Substring("Initializes a new instance of <see cref=\"System.String\"/>."));
        }

        [Test]
        public void MultipleSeeTagsProcessedCorrectly()
        {
            var model = new MultipleSeeTagsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(MultipleSeeTagsModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.AreEqual(1, namedTypeSymbolProvider.Properties.Count);

            var property = namedTypeSymbolProvider.Properties[0];
            var description = property.Description?.ToString() ?? string.Empty;

            // Verify both see tags are processed correctly
            Assert.That(description, Contains.Substring("Works with <see cref=\"System.String\"/> and <see cref=\"System.Int32\"/> types."));
        }

        [Test]
        public void SeeTagWithoutCrefAttributePreserved()
        {
            var model = new SeeTagWithoutCrefModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(SeeTagWithoutCrefModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.AreEqual(1, namedTypeSymbolProvider.Properties.Count);

            var property = namedTypeSymbolProvider.Properties[0];
            var description = property.Description?.ToString() ?? string.Empty;

            // Verify that see tag without cref is preserved as-is
            Assert.That(description, Contains.Substring("See documentation for <see langword=\"null\" /> keyword."));
        }

        [Test]
        public void MixedContentWithSeeTagsProcessedCorrectly()
        {
            var model = new MixedContentModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(MixedContentModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
            Assert.AreEqual(1, namedTypeSymbolProvider.Properties.Count);

            var property = namedTypeSymbolProvider.Properties[0];
            var description = property.Description?.ToString() ?? string.Empty;

            // Verify that regular text is preserved and see tags are processed
            Assert.That(description, Contains.Substring("This property represents <see cref=\"System.String\"/> and returns a value."));
        }

        [Test]
        public void InvalidParameterDocsThrows()
        {
            var model = new InvalidParameterDocsModel();
            var compilation = CompilationHelper.LoadCompilation(new[] { model });
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, nameof(InvalidParameterDocsModel));

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);
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

            protected internal override PropertyProvider[] BuildProperties()
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

            protected internal override MethodProvider[] BuildMethods()
            {
                var sig = new MethodSignature("Write", $"", MethodSignatureModifiers.Public, null, $"", [ new ParameterProvider("value", $"This is an invalid description because it is missing closing slash <see cref=\"Y\">", typeof(int)), new ParameterProvider("options", $"", typeof(string)) ]);
                return [new MethodProvider(sig, Snippet.ThrowExpression(Snippet.Null), this, null)];
            }
        }

        private class ValidDocsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(ValidDocsModel);

            protected internal override PropertyProvider[] BuildProperties()
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

        private class SeeTagWithTypePrefixModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(SeeTagWithTypePrefixModel);

            protected internal override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"Initializes a new instance of <see cref=\"T:System.String\"/>.", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), "TestProperty",
                        new AutoPropertyBody(true), this),
                ];
            }
        }

        private class SeeTagWithoutTypePrefixModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(SeeTagWithoutTypePrefixModel);

            protected internal override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"Initializes a new instance of <see cref=\"System.String\"/>.", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), "TestProperty",
                        new AutoPropertyBody(true), this),
                ];
            }
        }

        private class MultipleSeeTagsModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(MultipleSeeTagsModel);

            protected internal override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"Works with <see cref=\"T:System.String\"/> and <see cref=\"T:System.Int32\"/> types.", MethodSignatureModifiers.Public, new CSharpType(typeof(object)), "TestProperty",
                        new AutoPropertyBody(true), this),
                ];
            }
        }

        private class SeeTagWithoutCrefModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(SeeTagWithoutCrefModel);

            protected internal override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"See documentation for <see langword=\"null\"/> keyword.", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), "TestProperty",
                        new AutoPropertyBody(true), this),
                ];
            }
        }

        private class MixedContentModel : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => nameof(MixedContentModel);

            protected internal override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"This property represents <see cref=\"T:System.String\"/> and returns a value.", MethodSignatureModifiers.Public, new CSharpType(typeof(string)), "TestProperty",
                        new AutoPropertyBody(true), this),
                ];
            }
        }
    }
}
