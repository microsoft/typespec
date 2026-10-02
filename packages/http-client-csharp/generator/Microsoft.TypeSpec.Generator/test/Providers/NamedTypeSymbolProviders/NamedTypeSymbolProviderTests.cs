// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public class NamedTypeSymbolProviderTests
    {
        private NamedTypeSymbolProvider _namedTypeSymbolProvider;
        private NamedSymbol _namedSymbol;
        private readonly INamedTypeSymbol _iNamedSymbol;

        public NamedTypeSymbolProviderTests()
        {
            _namedSymbol = new NamedSymbol();
            var compilation = CompilationHelper.LoadCompilation([_namedSymbol, new PropertyType()]);
            _iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol")!;

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(_iNamedSymbol, compilation);
        }

        [Test]
        public async Task SemanticModelsAreSharedAcrossProviders()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var tree = compilation.SyntaxTrees.Single(tree => Path.GetFileName(tree.FilePath) == "Custom.cs");
            var first = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            var second = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.Second")!, compilation);

            var model = first.GetSemanticModel(tree);

            Assert.AreSame(model, first.GetSemanticModel(tree));
            Assert.AreSame(model, second.GetSemanticModel(tree));
            Assert.AreSame(compilation, model.Compilation);
            Assert.AreSame(tree, model.SyntaxTree);
        }

        [Test]
        public async Task SemanticModelsAreNotSharedAcrossCompilations()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var otherCompilation = compilation.Clone();
            var tree = compilation.SyntaxTrees.Single(tree => Path.GetFileName(tree.FilePath) == "Custom.cs");
            var first = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            var other = new NamedTypeSymbolProvider(otherCompilation.GetTypeByMetadataName("Sample.First")!, otherCompilation);

            Assert.AreNotSame(first.GetSemanticModel(tree), other.GetSemanticModel(tree));
            Assert.AreSame(compilation, first.GetSemanticModel(tree).Compilation);
            Assert.AreSame(otherCompilation, other.GetSemanticModel(tree).Compilation);
        }

        [Test]
        public async Task SemanticModelsUseTreeIdentityRatherThanFilePath()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var original = compilation.SyntaxTrees.Single(tree => Path.GetFileName(tree.FilePath) == "Custom.cs");
            var other = CSharpSyntaxTree.ParseText(original.GetText(), path: original.FilePath);
            compilation = compilation.AddSyntaxTrees(other);
            var symbol = compilation.GetTypeByMetadataName("Sample.First")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            Assert.AreNotSame(provider.GetSemanticModel(original), provider.GetSemanticModel(other));
            Assert.AreSame(original, provider.GetSemanticModel(original).SyntaxTree);
            Assert.AreSame(other, provider.GetSemanticModel(other).SyntaxTree);
        }

        [Test]
        public async Task SemanticModelReuseSupportsConcurrentReaders()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var tree = compilation.SyntaxTrees.Single(tree => Path.GetFileName(tree.FilePath) == "Custom.cs");
            var symbol = compilation.GetTypeByMetadataName("Sample.First")!;
            var models = await ReadConcurrently(() =>
                new NamedTypeSymbolProvider(symbol, compilation).GetSemanticModel(tree));

            Assert.That(models, Is.All.SameAs(models[0]));
            Assert.AreSame(compilation, models[0].Compilation);
            Assert.AreSame(tree, models[0].SyntaxTree);
        }

        [Test]
        public async Task SemanticModelConstructionFailuresAreSharedAcrossProviders()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var original = compilation.SyntaxTrees.First();
            var outside = CSharpSyntaxTree.ParseText(original.GetText(), path: original.FilePath);
            var first = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            var second = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.Second")!, compilation);

            var failure = Assert.Throws<ArgumentException>(() => first.GetSemanticModel(outside));

            Assert.AreSame(failure, Assert.Throws<ArgumentException>(() => first.GetSemanticModel(outside)));
            Assert.AreSame(failure, Assert.Throws<ArgumentException>(() => second.GetSemanticModel(outside)));
            Assert.AreSame(first.GetSemanticModel(original), second.GetSemanticModel(original));
        }

        [Test]
        public async Task SemanticModelConstructionFailuresAreSharedAcrossConcurrentReaders()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var original = compilation.SyntaxTrees.First();
            var outside = CSharpSyntaxTree.ParseText(original.GetText(), path: original.FilePath);
            var symbol = compilation.GetTypeByMetadataName("Sample.First")!;

            // Each failed Roslyn construction throws a new exception, exposing duplicate factory calls.
            var failures = await ReadConcurrently(() => Assert.Throws<ArgumentException>(() =>
                new NamedTypeSymbolProvider(symbol, compilation).GetSemanticModel(outside)));

            Assert.That(failures, Is.All.SameAs(failures[0]));
            var provider = new NamedTypeSymbolProvider(symbol, compilation);
            Assert.AreSame(failures[0], Assert.Throws<ArgumentException>(() => provider.GetSemanticModel(outside)));
            Assert.AreSame(original, provider.GetSemanticModel(original).SyntaxTree);
        }

        [Test]
        public async Task SemanticModelConstructionFailuresAreScopedByCompilationAndTree()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var original = compilation.SyntaxTrees.First();
            var outside = CSharpSyntaxTree.ParseText(original.GetText(), path: original.FilePath);
            var otherTree = CSharpSyntaxTree.ParseText(original.GetText(), path: original.FilePath);
            var otherCompilation = compilation.Clone();
            var provider = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            var otherProvider = new NamedTypeSymbolProvider(otherCompilation.GetTypeByMetadataName("Sample.First")!, otherCompilation);

            var failure = Assert.Throws<ArgumentException>(() => provider.GetSemanticModel(outside));
            var otherTreeFailure = Assert.Throws<ArgumentException>(() => provider.GetSemanticModel(otherTree));
            var otherCompilationFailure = Assert.Throws<ArgumentException>(() => otherProvider.GetSemanticModel(outside));

            Assert.AreNotSame(failure, otherTreeFailure);
            Assert.AreNotSame(failure, otherCompilationFailure);
            Assert.AreSame(otherTreeFailure, Assert.Throws<ArgumentException>(() => provider.GetSemanticModel(otherTree)));
            Assert.AreSame(otherCompilationFailure, Assert.Throws<ArgumentException>(() => otherProvider.GetSemanticModel(outside)));

            var expandedCompilation = compilation.AddSyntaxTrees(outside);
            var expandedProvider = new NamedTypeSymbolProvider(
                expandedCompilation.GetTypeByMetadataName("Sample.First")!, expandedCompilation);
            Assert.AreSame(outside, expandedProvider.GetSemanticModel(outside).SyntaxTree);
            Assert.AreSame(expandedCompilation, expandedProvider.GetSemanticModel(outside).Compilation);
        }

        private static async Task<T[]> ReadConcurrently<T>(Func<T> read)
        {
            const int readerCount = 8;
            using var start = new Barrier(readerCount);
            return await Task.WhenAll(Enumerable.Range(0, readerCount).Select(_ =>
                Task.Factory.StartNew(() =>
                {
                    Assert.IsTrue(start.SignalAndWait(TimeSpan.FromSeconds(30)), "Concurrent readers failed to start.");
                    return read();
                }, CancellationToken.None, TaskCreationOptions.LongRunning, TaskScheduler.Default)));
        }

        [Test]
        public async Task SemanticModelReusePreservesInitializersAndDependencies()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var provider = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            var tree = compilation.SyntaxTrees.Single(tree => Path.GetFileName(tree.FilePath) == "Custom.cs");
            var model = provider.GetSemanticModel(tree);

            var value = (AutoPropertyBody)provider.Properties.Single(property => property.Name == "Value").Body;
            Assert.AreEqual(42, ((LiteralExpression)value.InitializationExpression!).Literal);
            Assert.That(provider.SignatureDependencyTypes.Select(type => type.FullyQualifiedName), Contains.Item("Sample.Second"));
            Assert.That(provider.BodyDependencyTypes.Select(type => type.FullyQualifiedName), Contains.Item("Sample.Second"));
            Assert.AreSame(model, provider.GetSemanticModel(tree));
        }

        [Test]
        public async Task SemanticModelsRejectTreesOutsideTheirCompilation()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync(method: "SemanticModelReuse");
            var provider = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            var original = compilation.SyntaxTrees.First();
            var outside = CSharpSyntaxTree.ParseText(original.GetText(), path: original.FilePath);

            Assert.Throws<ArgumentException>(() => provider.GetSemanticModel(outside));
            Assert.AreSame(original, provider.GetSemanticModel(original).SyntaxTree);
        }

        [Test]
        public void SemanticModelCacheDoesNotKeepCompilationsAlive()
        {
            var references = CreateCachedCompilation();
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            Assert.IsFalse(references.Compilation.IsAlive);
            Assert.IsFalse(references.Model.IsAlive);
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static (WeakReference Compilation, WeakReference Model) CreateCachedCompilation()
        {
            var source = File.ReadAllText(Path.Combine(
                Helpers.GetAssetFileOrDirectoryPath(false, method: "SemanticModelReuse"), "Custom.cs"));
            var tree = CSharpSyntaxTree.ParseText(source);
            var compilation = CSharpCompilation.Create("Transient", [tree],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var provider = new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.First")!, compilation);
            return (new WeakReference(compilation), new WeakReference(provider.GetSemanticModel(tree)));
        }

        [Test]
        public void ValidateCSharpType()
        {
            var type = _iNamedSymbol.GetCSharpType();
            Assert.AreEqual(_namedTypeSymbolProvider.Type, type);
        }

        [Test]
        public void ValidateModifiers()
        {
            var modifiers = _namedTypeSymbolProvider.DeclarationModifiers;
            Assert.IsTrue(modifiers.HasFlag(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class));
        }

        [Test]
        public void ValidateName()
        {
            Assert.AreEqual(_namedSymbol.Name, _namedTypeSymbolProvider.Name);
        }

        [Test]
        public void ValidateNamespace()
        {
            Assert.AreEqual("Sample.Models", _namedTypeSymbolProvider.Type.Namespace);
            Assert.AreEqual(_namedSymbol.Type.Namespace, _namedTypeSymbolProvider.Type.Namespace);
        }

        [Test]
        public void ValidateBaseType()
        {
            Assert.IsNull(_namedTypeSymbolProvider.Type.BaseType!);
        }

        [Test]
        public void ValidateBaseTypeStruct()
        {
            var namedSymbol = new NamedSymbol(isStruct: true);
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol")!;

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol, compilation);
            Assert.IsNull(namedTypeSymbolProvider.Type.BaseType!);
        }

        [Test]
        public async Task ValidateSelfReferentialGenericBaseType()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var compilation = mockGenerator.Object.SourceInputModel.Customization;
            Assert.IsNotNull(compilation);

            var iNamedSymbol = CompilationHelper.GetSymbol(mockGenerator.Object.SourceInputModel.Customization!.Assembly.Modules.First().GlobalNamespace, "SelfReferentialType")!;
            Assert.IsNotNull(iNamedSymbol);

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol, mockGenerator.Object.SourceInputModel.Customization!);
            Assert.IsNotNull(namedTypeSymbolProvider);

            // The base type should be null to prevent stack overflow when the base type contains
            // the derived type as a generic type argument
            Assert.IsNull(namedTypeSymbolProvider.Type.BaseType);
        }

        [Test]
        public void ValidateGenericTypeAndMethodArguments()
        {
            var compilation = CSharpCompilation.Create(
                "Customization",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample
                    {
                        public class GenericType<TType>
                        {
                            public TMethod Convert<TMethod>(TType value, TMethod fallback) => fallback;
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var symbol = compilation.GetTypeByMetadataName("Sample.GenericType`1");
            Assert.IsNotNull(symbol);

            var provider = new NamedTypeSymbolProvider(symbol!, compilation);
            var method = provider.Methods.Single(method => method.Signature.Name == "Convert");

            Assert.AreEqual("TType", provider.Type.Arguments.Single().Name);
            Assert.AreEqual("TMethod", method.Signature.GenericArguments!.Single().Name);
        }

        [Test]
        public void ValidateNamespaceNestedType()
        {
            // Get all members, including nested types
            var allMembers = _iNamedSymbol.GetMembers().OfType<INamedTypeSymbol>();
            INamedTypeSymbol? nestedType = null;

            // Iterate over the members and find the nested types
            foreach (var member in allMembers)
            {
                if (member.Kind == SymbolKind.NamedType && SymbolEqualityComparer.Default.Equals(member.ContainingSymbol, _iNamedSymbol))
                {
                    nestedType = member;
                    break;
                }
            }

            Assert.IsNotNull(nestedType, "Nested type not found in the named symbol.");
            var type = nestedType!.GetCSharpType();
            Assert.AreEqual("Sample.Models", type.Namespace);

            var fullName = type.FullyQualifiedName;
            Assert.AreEqual("Sample.Models.NamedSymbol.Foo", fullName);
        }

        [Test]
        public void ValidateProperties()
        {
            Dictionary<string, PropertyProvider> properties = _namedTypeSymbolProvider.Properties.ToDictionary(p => p.Name);
            Assert.AreEqual(_namedSymbol.Properties.Count, properties.Count);
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

        [TestCase(typeof(int))]
        [TestCase(typeof(string))]
        [TestCase(typeof(double?))]
        [TestCase(typeof(float?))]
        [TestCase(typeof(PropertyType))]
        [TestCase(typeof(IList<string>))]
        [TestCase(typeof(IList<string?>))]
        [TestCase(typeof(IList<PropertyType>))]
        [TestCase(typeof(IList<SomeEnum>))]
        [TestCase(typeof(ReadOnlyMemory<byte>?))]
        [TestCase(typeof(ReadOnlyMemory<byte>))]
        [TestCase(typeof(ReadOnlyMemory<object>))]
        [TestCase(typeof(IEnumerable<PropertyType>))]
        [TestCase(typeof(IEnumerable<PropertyType?>))]
        [TestCase(typeof(IEnumerable<TimeSpan>))]
        [TestCase(typeof(string[]))]
        [TestCase(typeof(IDictionary<int, int>))]
        [TestCase(typeof(BinaryData))]
        [TestCase(typeof(SomeEnum), true)]
        [TestCase(typeof(SomeEnum?), true)]
        [TestCase(typeof(IDictionary<string, SomeEnum>))]
        [TestCase(typeof((List<PropertyType> Values, string Foo, int Bar)))]
        public void ValidatePropertyTypes(Type propertyType, bool isEnum = false)
        {
            // setup
            var namedSymbol = new NamedSymbol(propertyType);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            Assert.AreEqual(_namedSymbol.Properties.Count, _namedTypeSymbolProvider.Properties.Count);

            var property = _namedTypeSymbolProvider.Properties.FirstOrDefault();
            Assert.IsNotNull(property);

            Type? nullableUnderlyingType = Nullable.GetUnderlyingType(propertyType);
            var propertyName = nullableUnderlyingType?.Name ?? propertyType.Name;
            bool isNullable = nullableUnderlyingType != null;
            bool isSystemType = propertyType.FullName!.StartsWith("System")
                && (!isNullable || nullableUnderlyingType?.Namespace?.StartsWith("System") == true);

            var expectedType = isSystemType
                ? new CSharpType(propertyType, isNullable)
                : new CSharpType(propertyName, propertyType.Namespace!, false, isNullable, null, [], false, false);

            var propertyCSharpType = property!.Type;

            Assert.AreEqual(expectedType.Name, propertyCSharpType.Name);
            Assert.AreEqual(expectedType.IsNullable, propertyCSharpType.IsNullable);
            Assert.AreEqual(expectedType.IsList, propertyCSharpType.IsList);
            Assert.AreEqual(expectedType.Arguments.Count, propertyCSharpType.Arguments.Count);
            Assert.AreEqual(expectedType.IsCollection, propertyCSharpType.IsCollection);
            Assert.AreEqual(expectedType.IsFrameworkType, propertyCSharpType.IsFrameworkType);
            Assert.IsNull(propertyCSharpType.BaseType);

            for (var i = 0; i < expectedType.Arguments.Count; i++)
            {
                Assert.AreEqual(expectedType.Arguments[i].Name, propertyCSharpType.Arguments[i].Name);
                Assert.AreEqual(expectedType.Arguments[i].IsNullable, propertyCSharpType.Arguments[i].IsNullable);
                Assert.IsNull(propertyCSharpType.Arguments[i].BaseType);
            }

            // validate the underlying types aren't nullable
            if (isNullable && expectedType.IsFrameworkType)
            {
                var underlyingType = propertyCSharpType.FrameworkType;
                Assert.IsTrue(Nullable.GetUnderlyingType(underlyingType) == null);
            }

        }

        [TestCaseSource(nameof(TestParametersTestCases))]
        public void ValidateParameters(Type parameterType, ValueExpression? expectedDefaultValue)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterType: parameterType, parameterDefaultValue: expectedDefaultValue);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Type? nullableUnderlyingType = Nullable.GetUnderlyingType(parameterType);
            var parameterName = nullableUnderlyingType?.Name ?? parameterType.Name;
            bool isNullable = nullableUnderlyingType != null;
            bool isSystemType = parameterType.FullName!.StartsWith("System")
                && (!isNullable || nullableUnderlyingType?.Namespace?.StartsWith("System") == true);

            var expectedType = isSystemType
                ? new CSharpType(parameterType, isNullable)
                : new CSharpType(parameterName, parameterType.Namespace!, false, isNullable, null, [], false, false);

            Assert.AreEqual(expectedDefaultValue, parameter.DefaultValue);

            var parameterCsharpType = parameter!.Type;
            Assert.AreEqual(expectedType.Name, parameterCsharpType.Name);
            Assert.AreEqual(expectedType.IsNullable, parameterCsharpType.IsNullable);
            Assert.AreEqual(expectedType.IsList, parameterCsharpType.IsList);
            Assert.AreEqual(expectedType.Arguments.Count, parameterCsharpType.Arguments.Count);
            Assert.AreEqual(expectedType.IsCollection, parameterCsharpType.IsCollection);
            Assert.AreEqual(expectedType.IsFrameworkType, parameterCsharpType.IsFrameworkType);

            for (var i = 0; i < expectedType.Arguments.Count; i++)
            {
                Assert.AreEqual(expectedType.Arguments[i].Name, parameterCsharpType.Arguments[i].Name);
                Assert.AreEqual(expectedType.Arguments[i].IsNullable, parameterCsharpType.Arguments[i].IsNullable);
            }

            // validate the underlying types aren't nullable
            if (isNullable && expectedType.IsFrameworkType)
            {
                var underlyingType = parameterCsharpType.FrameworkType;
                Assert.IsTrue(Nullable.GetUnderlyingType(underlyingType) == null);
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateParameterIsIn(bool isIn)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterIsIn: isIn);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Assert.AreEqual(isIn, parameter.IsIn);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateParameterIsOut(bool isOut)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterIsOut: isOut);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Assert.AreEqual(isOut, parameter.IsOut);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateParameterIsRef(bool isRef)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterIsRef: isRef);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Assert.AreEqual(isRef, parameter.IsRef);
        }

        [Test]
        public async Task ValidatePartialMethodIsDetected()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var compilation = mockGenerator.Object.SourceInputModel.Customization;
            Assert.IsNotNull(compilation);

            var symbol = CompilationHelper.GetSymbol(compilation!.Assembly.Modules.First().GlobalNamespace, "WithPartial")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            var partial = provider.Methods.Single(m => m.Signature.Name == "DoIt");
            Assert.IsTrue(partial.IsPartialMethod, "Expected DoIt to be detected as partial.");
            Assert.IsTrue(partial.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            var nonPartial = provider.Methods.Single(m => m.Signature.Name == "NonPartial");
            Assert.IsFalse(nonPartial.IsPartialMethod, "Expected NonPartial to not be detected as partial.");
            Assert.IsFalse(nonPartial.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));
        }

        [Test]
        public async Task ValidatePartialMethodWithBodyIsNotDetectedAsPartialDeclaration()
        {
            // A partial method *with* a body is the implementation half - not the declaration we
            // want to treat as a customization signal.
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var compilation = mockGenerator.Object.SourceInputModel.Customization;
            Assert.IsNotNull(compilation);

            var symbol = CompilationHelper.GetSymbol(compilation!.Assembly.Modules.First().GlobalNamespace, "WithPartial")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            var doIt = provider.Methods.Single(m => m.Signature.Name == "DoIt");
            Assert.IsFalse(doIt.IsPartialMethod, "Partial methods with bodies should not be treated as customization signals.");
        }

        // Validates that reading a symbol maps the 'abstract' modifier onto the method signature so
        // downstream consumers (e.g. the back-compat overload pass) can faithfully detect abstract methods.
        [Test]
        public async Task ValidateAbstractMethodModifierIsDetected()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var compilation = mockGenerator.Object.SourceInputModel.Customization;
            Assert.IsNotNull(compilation);

            var symbol = CompilationHelper.GetSymbol(compilation!.Assembly.Modules.First().GlobalNamespace, "WithAbstract")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            var abstractMethod = provider.Methods.Single(m => m.Signature.Name == "AbstractMethod");
            Assert.IsTrue(abstractMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Abstract), "Expected AbstractMethod to carry the Abstract modifier.");

            var virtualMethod = provider.Methods.Single(m => m.Signature.Name == "VirtualMethod");
            Assert.IsFalse(virtualMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Abstract), "Expected VirtualMethod to not carry the Abstract modifier.");
            Assert.IsTrue(virtualMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual), "Expected VirtualMethod to carry the Virtual modifier.");
        }

        [Test]
        public async Task BodyDependenciesIncludeUsingNamespaceCandidatesForUnresolvedTypeSyntax()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var symbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "CustomClient")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            Assert.IsTrue(provider.BodyDependencyTypes.Any(type => type.FullyQualifiedName == "Sample.Models.ReferencedModel"));
        }

        [Test]
        public async Task PublicInterfaceMemberSignatureDependenciesAreIncluded()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var symbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "ICustomApi")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            Assert.IsTrue(provider.SignatureDependencyTypes.Any(type => type.FullyQualifiedName == "Sample.Models.GeneratedModel"));
        }

        [Test]
        public async Task PublicNestedMemberSignatureDependenciesAreIncluded()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var symbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "CustomApi")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            Assert.IsTrue(provider.SignatureDependencyTypes.Any(type => type.FullyQualifiedName == "Sample.Models.GeneratedModel"));
        }

        [Test]
        public async Task SourceInputHelperYieldsNestedSymbols()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();

            var symbols = Microsoft.TypeSpec.Generator.SourceInput.SourceInputHelper.GetSymbols(compilation.Assembly.Modules.First().GlobalNamespace);

            Assert.IsTrue(symbols.Any(symbol => symbol.MetadataName == "Nested"));
        }

        [Test]
        public async Task SourceInputLookupUsesFullNestedDeclaringTypeName()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var sourceInputModel = new SourceInputModel(compilation, lastContract: null);

            var nestedType = sourceInputModel.FindForTypeInCurrentCompilation("Sample", "Target", "Outer+Middle");

            Assert.IsNotNull(nestedType);
            Assert.AreEqual("Sample.Outer+Middle+Target", ((NamedTypeSymbolProvider)nestedType!).MetadataName);
        }

        [Test]
        public async Task MetadataNamePreservesGenericArity()
        {
            var compilation = await Helpers.GetCompilationFromDirectoryAsync();
            var symbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "CustomModel`1")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);

            Assert.AreEqual("Sample.Models.CustomModel`1", provider.MetadataName);
        }

        // Operator signatures parsed from a customization partial must compare equal to the corresponding generated signatures.
        [Test]
        public async Task ValidateOperatorSignaturesMatchGenerated()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var compilation = mockGenerator.Object.SourceInputModel.Customization;
            Assert.IsNotNull(compilation);

            var symbol = CompilationHelper.GetSymbol(compilation!.Assembly.Modules.First().GlobalNamespace, "WithOperators")!;
            var provider = new NamedTypeSymbolProvider(symbol, compilation);
            var typeFromCustomization = provider.Type;

            var leftParam = new ParameterProvider("left", $"left", typeFromCustomization);
            var rightParam = new ParameterProvider("right", $"right", typeFromCustomization);
            var valueParam = new ParameterProvider("value", $"value", typeof(string));
            var operatorModifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Operator;
            var implicitOperatorModifiers = operatorModifiers | MethodSignatureModifiers.Implicit;

            // Mirror the signatures emitted by generated providers (e.g. ExtensibleEnumProvider).
            var generatedEquality = new MethodSignature("==", null, operatorModifiers, typeof(bool), null, [leftParam, rightParam]);
            var generatedInequality = new MethodSignature("!=", null, operatorModifiers, typeof(bool), null, [leftParam, rightParam]);
            var generatedImplicit = new MethodSignature(string.Empty, null, implicitOperatorModifiers, typeFromCustomization, null, [valueParam]);

            var customEquality = provider.Methods.Single(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator)
                && !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit)
                && m.Signature.Name.EndsWith("=="));
            var customInequality = provider.Methods.Single(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator)
                && !m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit)
                && m.Signature.Name.EndsWith("!="));
            var customImplicit = provider.Methods.Single(m =>
                m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Implicit)
                && m.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Operator));

            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(generatedEquality, customEquality.Signature),
                "Generated `==` operator should match the `==` operator parsed from the customization partial.");
            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(generatedInequality, customInequality.Signature),
                "Generated `!=` operator should match the `!=` operator parsed from the customization partial.");
            Assert.IsTrue(MethodSignatureBase.SignatureComparer.Equals(generatedImplicit, customImplicit.Signature),
                "Generated implicit conversion operator should match the implicit operator parsed from the customization partial.");

            // Sanity check: `==` and `!=` parsed from customization must remain distinguishable.
            Assert.IsFalse(MethodSignatureBase.SignatureComparer.Equals(customEquality.Signature, customInequality.Signature),
                "`==` and `!=` operators must not compare as equal even though their parameter shapes match.");
        }

        [Test]
        public void ValidateMethods()
        {
            Dictionary<string, MethodProvider> methods = _namedTypeSymbolProvider.Methods.ToDictionary(p => p.Signature.Name);
            Assert.AreEqual(_namedSymbol.Methods.Count, methods.Count);
            foreach (var expected in _namedSymbol.Methods)
            {
                var actual = methods[expected.Signature.Name];

                Assert.IsTrue(methods.ContainsKey(expected.Signature.Name));
                Assert.AreEqual(expected.Signature.Name, actual.Signature.Name);
                if (!string.IsNullOrEmpty(expected.Signature.Description?.ToString()))
                {
                    Assert.AreEqual($"{expected.Signature.Description}.", actual.Signature.Description?.ToString()); // the writer adds a period
                }
                Assert.AreEqual(expected.Signature.Modifiers, actual.Signature.Modifiers);
                Assert.AreEqual(expected.Signature.ReturnType, actual.Signature.ReturnType);
                Assert.AreEqual(expected.Signature.Parameters.Count, actual.Signature.Parameters.Count);
                for (int i = 0; i < expected.Signature.Parameters.Count; i++)
                {
                    Assert.AreEqual(expected.Signature.Parameters[i].Name, actual.Signature.Parameters[i].Name);
                    Assert.AreEqual($"{expected.Signature.Parameters[i].Description}.", actual.Signature.Parameters[i].Description.ToString()); // the writer adds a period
                    Assert.AreEqual(expected.Signature.Parameters[i].Type, actual.Signature.Parameters[i].Type);
                }
            }
        }

        [Test]
        public void ValidateConstructors()
        {
            Dictionary<string, ConstructorProvider> constructors = _namedTypeSymbolProvider.Constructors.ToDictionary(p => p.Signature.Name);
            Assert.AreEqual(_namedSymbol.Constructors.Count, constructors.Count);
            foreach (var expected in _namedSymbol.Constructors)
            {
                var actual = constructors[expected.Signature.Name];

                Assert.IsTrue(constructors.ContainsKey(expected.Signature.Name));
                Assert.AreEqual(expected.Signature.Name, actual.Signature.Name);
                Assert.AreEqual($"{expected.Signature.Description}.", actual.Signature.Description?.ToString()); // the writer adds a period
                Assert.AreEqual(expected.Signature.Modifiers, actual.Signature.Modifiers);
                Assert.AreEqual(expected.Signature.ReturnType, actual.Signature.ReturnType);
                Assert.AreEqual(expected.Signature.Parameters.Count, actual.Signature.Parameters.Count);
                for (int i = 0; i < expected.Signature.Parameters.Count; i++)
                {
                    Assert.AreEqual(expected.Signature.Parameters[i].Name, actual.Signature.Parameters[i].Name);
                    Assert.AreEqual($"{expected.Signature.Parameters[i].Description}.", actual.Signature.Parameters[i].Description.ToString()); // the writer adds a period
                    Assert.AreEqual(expected.Signature.Parameters[i].Type, actual.Signature.Parameters[i].Type);
                }
            }
        }

        [Test]
        public void ValidateFields()
        {
            Dictionary<string, FieldProvider> fields = _namedTypeSymbolProvider.Fields.ToDictionary(p => p.Name);
            Assert.AreEqual(_namedSymbol.Fields.Count, fields.Count);
            foreach (var expected in _namedSymbol.Fields)
            {
                var actual = fields[expected.Name];

                Assert.IsTrue(fields.ContainsKey(expected.Name));
                Assert.AreEqual(expected.Modifiers, actual.Modifiers);
                Assert.AreEqual(expected.Type, actual.Type);
                Assert.AreEqual(expected.Name, actual.Name);
                Assert.AreEqual($"{expected.Description}.", actual.Description!.ToString()); // the writer adds a period
                Assert.AreEqual(expected.InitializationValue, actual.InitializationValue);
            }
        }

        [Test]
        public void ValidateEnumMemberInitializer()
        {
            var someEnumType = new TestEnumProvider();
            var namedSymbol = new NamedSymbol(
                propertyType: typeof(SomeEnum),
                initializeEnumProperty: true);
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, someEnumType, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            var provider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var property = provider.Properties.FirstOrDefault(p => p.Name == "P1");
            Assert.IsNotNull(property);

            // Validate that the property has an initialization expression
            Assert.IsInstanceOf<AutoPropertyBody>(property!.Body);
            var autoPropertyBody = property.Body as AutoPropertyBody;
            Assert.IsNotNull(autoPropertyBody);

            var initExpression = autoPropertyBody!.InitializationExpression;
            Assert.IsNotNull(initExpression);

            // Validate that the initialization expression is a MemberExpression for the enum value
            Assert.IsInstanceOf<MemberExpression>(initExpression);

            var memberExpression = initExpression as MemberExpression;
            Assert.IsNotNull(memberExpression);
            Assert.AreEqual("Foo", memberExpression!.MemberName);
        }

        [Test]
        public void ValidateEnumFieldsWithExplicitValues()
        {
            var enumProvider = new TestEnumWithValuesProvider();
            var compilation = CompilationHelper.LoadCompilation([enumProvider]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "ServiceVersion");

            var provider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            // Validate that the enum has the expected fields
            var fields = provider.Fields.ToDictionary(f => f.Name);
            Assert.AreEqual(3, fields.Count);

            // Validate V7_2 = 1
            Assert.IsTrue(fields.ContainsKey("V7_2"));
            var v72Field = fields["V7_2"];
            Assert.IsNotNull(v72Field.InitializationValue);
            Assert.IsInstanceOf<LiteralExpression>(v72Field.InitializationValue);
            var v72Literal = v72Field.InitializationValue as LiteralExpression;
            Assert.AreEqual(1, v72Literal!.Literal);

            // Validate V7_3 = 2
            Assert.IsTrue(fields.ContainsKey("V7_3"));
            var v73Field = fields["V7_3"];
            Assert.IsNotNull(v73Field.InitializationValue);
            Assert.IsInstanceOf<LiteralExpression>(v73Field.InitializationValue);
            var v73Literal = v73Field.InitializationValue as LiteralExpression;
            Assert.AreEqual(2, v73Literal!.Literal);

            // Validate V7_4 = 3
            Assert.IsTrue(fields.ContainsKey("V7_4"));
            var v74Field = fields["V7_4"];
            Assert.IsNotNull(v74Field.InitializationValue);
            Assert.IsInstanceOf<LiteralExpression>(v74Field.InitializationValue);
            var v74Literal = v74Field.InitializationValue as LiteralExpression;
            Assert.AreEqual(3, v74Literal!.Literal);
        }

        // Validates that the constant value of a const field on a non-enum type (here a struct,
        // mirroring the private `<Member>Value` backing constants an extensible enum uses) is
        // recovered as the field's initialization value. This is what lets back-compat processing
        // read a previously shipped member's wire value from the last contract's metadata.
        [Test]
        public void ValidateConstFieldInitializerIsRecovered()
        {
            var compilation = CSharpCompilation.Create(
                "Customization",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample.Models
                    {
                        public readonly partial struct MockInputEnum
                        {
                            private const string RecoverValue = "recover";
                            private const int Answer = 42;
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var symbol = compilation.GetTypeByMetadataName("Sample.Models.MockInputEnum");
            Assert.IsNotNull(symbol);

            var provider = new NamedTypeSymbolProvider(symbol!, compilation);
            var fields = provider.Fields.ToDictionary(f => f.Name);

            Assert.IsTrue(fields.ContainsKey("RecoverValue"));
            var recoverValue = fields["RecoverValue"];
            Assert.IsInstanceOf<LiteralExpression>(recoverValue.InitializationValue);
            Assert.AreEqual("recover", (recoverValue.InitializationValue as LiteralExpression)!.Literal);

            Assert.IsTrue(fields.ContainsKey("Answer"));
            var answer = fields["Answer"];
            Assert.IsInstanceOf<LiteralExpression>(answer.InitializationValue);
            Assert.AreEqual(42, (answer.InitializationValue as LiteralExpression)!.Literal);
        }

        // Validates that a non-const field carries no recovered initialization value.
        [Test]
        public void ValidateNonConstFieldHasNoInitializer()
        {
            var compilation = CSharpCompilation.Create(
                "Customization",
                [CSharpSyntaxTree.ParseText("""
                    namespace Sample.Models
                    {
                        public readonly partial struct MockInputEnum
                        {
                            private readonly string _value;
                        }
                    }
                    """)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var symbol = compilation.GetTypeByMetadataName("Sample.Models.MockInputEnum");
            Assert.IsNotNull(symbol);

            var provider = new NamedTypeSymbolProvider(symbol!, compilation);
            var field = provider.Fields.Single(f => f.Name == "_value");
            Assert.IsNull(field.InitializationValue);
        }

        public enum SomeEnum
        {
            Foo,
        }

        private class TestEnumProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";
            protected override string BuildName() => "SomeEnum";
            protected override string BuildNamespace() => "Sample.Models";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum;

            protected internal override FieldProvider[] BuildFields()
            {
                return
                [
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "Foo", this, $"Foo"),
                ];
            }
        }

        private class TestEnumWithValuesProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";
            protected override string BuildName() => "ServiceVersion";
            protected override string BuildNamespace() => "Sample.Models";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum;

            protected internal override FieldProvider[] BuildFields()
            {
                return
                [
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "V7_2", this, $"The Key Vault API version 7.2", initializationValue: Literal(1)),
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "V7_3", this, $"The Key Vault API version 7.3", initializationValue: Literal(2)),
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "V7_4", this, $"The Key Vault API version 7.4", initializationValue: Literal(3)),
                ];
            }
        }

        public static IEnumerable<TestCaseData> TestParametersTestCases
        {
            get
            {
                yield return new TestCaseData(typeof(int), Literal(2));
                yield return new TestCaseData(typeof(string), Literal("Foo"));
                yield return new TestCaseData(typeof(double), Literal(2.2));
                yield return new TestCaseData(typeof(double?), Literal(2.2));
                yield return new TestCaseData(typeof(float), Literal(2.2f));
                yield return new TestCaseData(typeof(float?), Literal(2.2f));
                yield return new TestCaseData(typeof(long), Long(2));
                yield return new TestCaseData(typeof(bool), False);
                yield return new TestCaseData(typeof(object), Default);
                yield return new TestCaseData(typeof(BinaryData), Default);
            }
        }
    }
}
