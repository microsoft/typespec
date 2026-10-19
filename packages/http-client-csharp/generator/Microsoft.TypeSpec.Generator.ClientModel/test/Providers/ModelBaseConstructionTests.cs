// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using ClientModelProvider = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class ModelBaseConstructionTests
    {
        [TestCase(false, false)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void RecursiveCandidatePropertySurvivesRestorationProbe(bool derivedFirst, bool historicalProperty)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            var previousBase = InputFactory.Model("PreviousBase", properties: [InputFactory.Property("derived", derived)]);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => derivedFirst
                ? [derived, currentBase, previousBase] : [previousBase, currentBase, derived]);
            SetLastContract(generator, $$"""
                namespace Sample.Models
                {
                    public class PreviousBase { {{(historicalProperty ? "public DerivedModel Derived { get; set; }" : "")}} }
                    public class DerivedModel : PreviousBase { }
                }
                """);

            var models = generator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().ToArray();
            var previous = models.Single(model => model.Name == "PreviousBase");
            Assert.That(previous, Is.InstanceOf<ClientModelProvider>());
            var property = previous.Properties.SingleOrDefault(property => property.Name == "Derived");
            Assert.That(property, Is.Not.Null, "A restoration probe must not permanently remove a recursive property");
            Assert.That(property!.Type.Name, Is.EqualTo("DerivedModel"));
            Assert.That(previous.FullConstructor.Signature.Parameters.Any(parameter => parameter.Name == "derived"), Is.True);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void RecursiveAdditionalPropertiesSurviveMappedRestoration(bool array)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            derived.Update(additionalProperties: array ? InputFactory.Array(derived) : derived);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [currentBase, derived]);
            SetLastContract(generator, "namespace Sample.Models { public class DerivedModel : System.Exception { } }");
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(new CSharpType(typeof(Exception)));

            var model = generator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().Single(model => model.Name == "DerivedModel");
            Assert.That(model, Is.InstanceOf<ClientModelProvider>());
            Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(Exception)));
            Assert.That(model.Properties.Any(property => property.Name == "AdditionalProperties" && property.IsAdditionalProperties), Is.True);
            if (array)
            {
                Assert.That(model.Fields.Any(field => field.Type.IsDictionary && field.Type.ElementType.IsList), Is.True,
                    "The typed recursive collection dictionary must survive as well as the public property");
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void FlatRecursiveAdditionalPropertiesSurviveMappedRestoration(bool array)
        {
            var message = InputFactory.Property("message", InputPrimitiveType.String, isReadOnly: true);
            var derived = InputFactory.Model("DerivedModel", properties: [message]);
            derived.Update(additionalProperties: array ? InputFactory.Array(derived) : derived);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [derived]);
            SetLastContract(generator, "namespace Sample.Models { public class DerivedModel : System.Exception { } }");
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(new CSharpType(typeof(Exception)));

            var model = generator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().Single(model => model.Name == "DerivedModel");
            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(Exception)));
                Assert.That(model.Properties.Any(property => property.Name == "AdditionalProperties" && property.IsAdditionalProperties), Is.True);
                Assert.That(derived.BaseModel, Is.Null);
                Assert.That(message.EnclosingType, Is.SameAs(derived));
                if (array)
                {
                    Assert.That(model.Fields.Any(field => field.Type.IsDictionary && field.Type.ElementType.IsList), Is.True);
                }
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public void MappedDiscoveryIsIndependentOfPreviouslyCreatedIncompatibleCandidate(bool compatibleFirst)
        {
            var compatible = InputFactory.Model("Compatible", properties: [InputFactory.Property("message", InputPrimitiveType.String, isReadOnly: true)]);
            var incompatible = InputFactory.Model("Incompatible", properties: [InputFactory.Property("source", InputPrimitiveType.String)]);
            var currentBase = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("message", InputPrimitiveType.String, isReadOnly: true)]);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => compatibleFirst ? [compatible, incompatible, currentBase, derived] : [incompatible, currentBase, derived, compatible],
                createModelCore: input => input == compatible || input == incompatible
                    ? new SystemObjectModelProvider(new CSharpType(typeof(Exception)), input)
                    : new ClientModelProvider(input));
            SetLastContract(generator, "namespace Sample.Models { public class DerivedModel : System.Exception { } }");

            var model = generator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().Single(model => model.Name == "DerivedModel");
            Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(Exception)));
            Assert.That(model.BaseModelProvider!.InputModel, Is.SameAs(compatible));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DownstreamMappedBaseRejectsInputPropertyValueNullabilityMismatch(bool historicalNullable)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("value",
                historicalNullable ? InputPrimitiveType.Int32 : new InputNullableType(InputPrimitiveType.Int32))]);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            var target = historicalNullable ? typeof(NullableValueBase) : typeof(NonnullableValueBase);
            var generator = CreateValueBaseRestoration(currentBase, derived, target,
                historicalNullable ? "int?" : "int", historicalNullable ? "int?" : "int");

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo("CurrentBase"),
                "The default mapping must not change the current wire value-type nullability.");
        }

        [Test]
        public void DownstreamMappedBaseRejectsNullablePropertyWithNonnullableConstructor()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("value",
                new InputNullableType(InputPrimitiveType.Int32))]);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            var generator = CreateValueBaseRestoration(currentBase, derived,
                typeof(NullablePropertyNonnullableConstructorBase), "int?", "int");

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo("CurrentBase"),
                "A nullable deserialization value cannot be passed to the historical int constructor.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DownstreamMappedBaseAcceptsMatchingValueNullability(bool nullable)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("value",
                nullable ? new InputNullableType(InputPrimitiveType.Int32) : InputPrimitiveType.Int32)]);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            var target = nullable ? typeof(NullableValueBase) : typeof(NonnullableValueBase);
            var generator = CreateValueBaseRestoration(currentBase, derived, target,
                nullable ? "int?" : "int", nullable ? "int?" : "int");

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(target)), Is.True);
                Assert.That(model.BaseModelProvider!.Properties.Single().Type.IsNullable, Is.EqualTo(nullable));
                Assert.That(model.BaseModelProvider.FullConstructor.Signature.Parameters.Single().Type.IsNullable,
                    Is.EqualTo(nullable));
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public void DownstreamMappedBaseHonorsPropertyVisitorRemoval(bool removeProperty)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("value",
                InputPrimitiveType.Int32, serializedName: "wireValue")]);
            var derived = InputFactory.Model("DerivedModel", properties: [], baseModel: currentBase);
            var generator = CreateValueBaseRestoration(currentBase, derived,
                typeof(NonnullableValueBase), "int", "int");
            if (removeProperty)
            {
                generator.Object.AddVisitor(new RemoveValuePropertyVisitor());
            }

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(model.BaseType?.Name,
                Is.EqualTo(removeProperty ? "CurrentBase" : nameof(NonnullableValueBase)),
                "Restoration must not reinstate a property rejected by the current input visitor.");
            if (!removeProperty)
            {
                Assert.That(model.BaseModelProvider!.Properties.Single().WireInfo?.SerializedName, Is.EqualTo("wireValue"));
            }
        }

        [TestCase(false)]
        [TestCase(true)]
        public void FlatMappedBaseHonorsPropertyVisitorRemoval(bool removeProperty)
        {
            var value = InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue");
            var child = InputFactory.Property("child", InputPrimitiveType.String, isRequired: true);
            var derived = InputFactory.Model("DerivedModel", properties: [value, child],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = CreateValueBaseRestoration(null, derived, typeof(NonnullableValueBase), "int", "int");
            if (removeProperty)
            {
                generator.Object.AddVisitor(new RemoveValuePropertyVisitor());
            }

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.Name, Is.EqualTo(removeProperty ? null : nameof(NonnullableValueBase)),
                    "Flat restoration must not reinstate a property rejected by the input visitor.");
                Assert.That(model.Properties.Select(property => property.Name), Does.Contain("Child").And.Not.Contain("Value"));
                Assert.That(derived.BaseModel, Is.Null);
                Assert.That(value.EnclosingType, Is.SameAs(derived));
                Assert.That(child.EnclosingType, Is.SameAs(derived));
            });
            if (!removeProperty)
            {
                Assert.That(model.BaseModelProvider!.Properties.Single().WireInfo?.SerializedName, Is.EqualTo("wireValue"));
                var serialization = model.SerializationProviders.Single();
                var source = new TypeProviderWriter(serialization).Write().Content;
                var deserializeMethod = CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes()
                    .OfType<Microsoft.CodeAnalysis.CSharp.Syntax.MethodDeclarationSyntax>()
                    .Single(method => method.Identifier.Text == "DeserializeDerivedModel");
                Assert.That(deserializeMethod.ToFullString(), Does.Contain("\"wireValue\"u8").And.Contain("\"child\"u8"),
                    "Deserialization must recognize inherited and model-owned wire properties.");
            }
        }

        [Test]
        public void FlatMappedMrwBaseCompilesAndRoundTripsInheritedAndOwnProperties()
        {
            var value = InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue");
            var child = InputFactory.Property("child", InputPrimitiveType.String, isRequired: true);
            var derived = InputFactory.Model("DerivedModel", properties: [value, child],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [derived]);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Append(typeof(FlatMrwBase).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var historical = CSharpCompilation.Create("HistoricalFlatMrwBase",
                [CSharpSyntaxTree.ParseText($"namespace Sample.Models {{ public class DerivedModel : {typeof(FlatMrwBase).FullName} {{ }} }}")],
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, historical));
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(new CSharpType(typeof(FlatMrwBase)));

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(FlatMrwBase)));
            // Compile the complete model/serialization partials and their shared helpers, not
            // unrelated client-pipeline helpers. SDK builds also run the MRW context source generator.
            var providers = generator.Object.OutputLibrary.TypeProviders.Where(provider => provider == model ||
                provider.Name is "Argument" or "Optional" or "ChangeTrackingList" or "ChangeTrackingDictionary" or
                    "ModelSerializationExtensions" or "TypeFormatters" or "SerializationFormat" ||
                provider is ModelReaderWriterContextDefinition);
            var trees = providers.SelectMany(provider => new[] { provider }.Concat(provider.SerializationProviders))
                .Distinct().Select(provider => CSharpSyntaxTree.ParseText(
                    new TypeProviderWriter(provider).Write().Content, path: provider.Name + ".cs"));
            var compilation = CSharpCompilation.Create("GeneratedFlatMrwModel", trees, references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Disable));
            var generatorAssembly = Assembly.Load("System.ClientModel.SourceGeneration");
            var sourceGenerators = generatorAssembly.GetTypes().Where(type => type.IsDefined(typeof(GeneratorAttribute)))
                .Select(type => Activator.CreateInstance(type))
                .Select(generator => generator is ISourceGenerator sourceGenerator
                    ? sourceGenerator : ((IIncrementalGenerator)generator!).AsSourceGenerator());
            CSharpGeneratorDriver.Create(sourceGenerators).RunGeneratorsAndUpdateCompilation(compilation,
                out var generatedCompilation, out var generatorDiagnostics);
            Assert.That(generatorDiagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var assemblyStream = new MemoryStream();
            var result = generatedCompilation.Emit(assemblyStream);
            Assert.That(result.Success, Is.True, string.Join(Environment.NewLine,
                result.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));

            var assembly = System.Reflection.Assembly.Load(assemblyStream.ToArray());
            var generatedType = assembly.GetType("Sample.Models.DerivedModel")!;
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            ((FlatMrwBase)instance).Value = 42;
            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = (BinaryData)persistable.GetMethod("Write")!.Invoke(instance, [options])!;
            using var document = JsonDocument.Parse(data);
            Assert.Multiple(() =>
            {
                Assert.That(document.RootElement.GetProperty("wireValue").GetInt32(), Is.EqualTo(42));
                Assert.That(document.RootElement.GetProperty("child").GetString(), Is.EqualTo("payload"));
                Assert.That(document.RootElement.EnumerateObject().Count(), Is.EqualTo(2));
            });
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.Multiple(() =>
            {
                Assert.That(((FlatMrwBase)restored).Value, Is.EqualTo(42));
                Assert.That(generatedType.GetProperty("Child")!.GetValue(restored), Is.EqualTo("payload"));
                Assert.That(derived.BaseModel, Is.Null);
                Assert.That(value.EnclosingType, Is.SameAs(derived));
            });
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void FlatMappedBaseHonorsSourceOwnerPropertyVeto(bool cacheSourceFirst, bool removeProperty)
        {
            var value = InputFactory.Property("value", InputPrimitiveType.Int32);
            var derived = InputFactory.Model("DerivedModel", properties: [value]);
            Mock<ScmCodeModelGenerator>? generator = null;
            generator = CreateValueBaseRestoration(null, derived, typeof(NonnullableValueBase), "int", "int",
                createModelCore: input =>
                {
                    var source = new ClientModelProvider(input);
                    if (cacheSourceFirst)
                    {
                        generator!.Object.TypeFactory.CreateProperty(value, source);
                    }
                    return source;
                });
            if (removeProperty)
            {
                generator.Object.AddVisitor(new RemoveSourceValuePropertyVisitor());
            }

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.Name, Is.EqualTo(removeProperty ? null : nameof(NonnullableValueBase)),
                    "The source-owner decision must be honored, regardless of property-cache order.");
                Assert.That(model.Properties, Is.Empty);
                Assert.That(value.EnclosingType, Is.SameAs(derived));
            });
        }

        [Test]
        public void FlatMappedBaseSynchronizesEagerMemberExpressionAfterRenaming()
        {
            var alias = InputFactory.Property("alias", InputPrimitiveType.Int32);
            var derived = InputFactory.Model("DerivedModel", properties: [alias],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Xml);
            var generator = CreateValueBaseRestoration(null, derived, typeof(NonnullableValueBase), "int", "int");
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<bool>("IsLastContractModelBasePropertyCompatibleCore", ItExpr.IsAny<CSharpType>(),
                    ItExpr.IsAny<InputModelProperty>(), ItExpr.IsAny<PropertyProvider>())
                .Returns((CSharpType _, InputModelProperty current, PropertyProvider previous) =>
                    current.Name == "alias" && previous.Name == "Value");
            var visitor = new EagerMemberPropertyVisitor();
            generator.Object.AddVisitor(visitor);

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(NonnullableValueBase)));
            var inherited = model.BaseModelProvider!.Properties.Single();
            Assert.Multiple(() =>
            {
                Assert.That(inherited.Name, Is.EqualTo("Value"));
                Assert.That(((MemberExpression)inherited).MemberName, Is.EqualTo("Value"));
                Assert.That(visitor.ProjectedMember?.MemberName, Is.EqualTo("Value"),
                    "Expressions retained by a visitor must be synchronized in place, not just replaced in the cache.");
                Assert.That(inherited.AsParameter.Name, Is.EqualTo("value"));
                Assert.That(model.Properties, Is.Empty);
            });
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void FlatMappedBaseRejectsReorderedInitializationParameters(bool sameTypes, bool reverseOrder)
        {
            var first = InputFactory.Property("first", InputPrimitiveType.String, isRequired: true);
            var second = InputFactory.Property("second", sameTypes ? InputPrimitiveType.String : InputPrimitiveType.Int32, isRequired: true);
            var derived = InputFactory.Model("DerivedModel", properties: reverseOrder ? [second, first] : [first, second]);
            var target = sameTypes ? typeof(SameTypeOrderedBase) : typeof(MixedTypeOrderedBase);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [derived]);
            SetLastContract(generator, $$"""
                namespace {{target.Namespace}}
                {
                    public class {{target.Name}}
                    {
                        public {{target.Name}}() { }
                        public {{target.Name}}(string first, {{(sameTypes ? "string" : "int")}} second) { }
                        public string First { get; set; }
                        public {{(sameTypes ? "string" : "int")}} Second { get; set; }
                    }
                }
                namespace Sample.Models { public class DerivedModel : {{target.Namespace}}.{{target.Name}} { } }
                """);
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(new CSharpType(target));

            var model = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(reverseOrder ? null : target.Name),
                "Restoration must not emit an invalid base argument order or silently swap same-typed values.");
            if (!reverseOrder)
            {
                Assert.That(model.Constructors[0].Signature.Parameters.Select(parameter => parameter.Name),
                    Is.EqualTo(new[] { "first", "second" }));
            }
        }

        private sealed class RemoveSourceValuePropertyVisitor : LibraryVisitor
        {
            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
                => input.Name == "value" && property?.EnclosingType is ClientModelProvider ? null : property;
        }

        private sealed class EagerMemberPropertyVisitor : LibraryVisitor
        {
            public MemberExpression? ProjectedMember { get; private set; }

            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
            {
                if (property is not null)
                {
                    var member = (MemberExpression)property;
                    if (property.EnclosingType is SystemObjectModelProvider)
                    {
                        ProjectedMember = member;
                    }
                }
                return property;
            }
        }

        private sealed class RemoveValuePropertyVisitor : LibraryVisitor
        {
            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
                => input.Name == "value" ? null : property;
        }

        private static Mock<ScmCodeModelGenerator> CreateValueBaseRestoration(
            InputModelType? currentBase,
            InputModelType derived,
            Type target,
            string propertyType,
            string constructorType,
            Func<InputModelType, ModelProvider?>? createModelCore = null)
        {
            var generator = MockHelpers.LoadMockGenerator(
                inputModels: () => currentBase is null ? [derived] : [currentBase, derived],
                createModelCore: createModelCore);
            SetLastContract(generator, $$"""
                namespace {{target.Namespace}}
                {
                    public class {{target.Name}}
                    {
                        public {{target.Name}}() { }
                        public {{target.Name}}({{constructorType}} value) { Value = value; }
                        public {{propertyType}} Value { get; set; }
                    }
                }
                namespace Sample.Models
                {
                    public class DerivedModel : {{target.Namespace}}.{{target.Name}} { }
                }
                """);
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(new CSharpType(target));
            return generator;
        }

        private static void SetLastContract(Mock<ScmCodeModelGenerator> generator, string source)
        {
            var compilation = CSharpCompilation.Create("LastContract",
                [CSharpSyntaxTree.ParseText(source)],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            generator.SetupProperty(instance => instance.SourceInputModel, new SourceInputModel(null, compilation));
        }
    }

    public class NonnullableValueBase
    {
        public NonnullableValueBase() { }
        public NonnullableValueBase(int value) { Value = value; }
        public int Value { get; set; }
    }

    public class NullableValueBase
    {
        public NullableValueBase() { }
        public NullableValueBase(int? value) { Value = value; }
        public int? Value { get; set; }
    }

    public class FlatMrwBase : IJsonModel<FlatMrwBase>
    {
        public FlatMrwBase() { }
        public FlatMrwBase(int value) { Value = value; }
        public int Value { get; set; }

        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => writer.WriteNumber("wireValue", Value);
        protected virtual FlatMrwBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
            => throw new NotImplementedException();
        protected virtual FlatMrwBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
        protected virtual string PersistableModelGetFormatFromOptions(ModelReaderWriterOptions options) => "J";

        void IJsonModel<FlatMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }
        FlatMrwBase IJsonModel<FlatMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => JsonModelCreateCore(ref reader, options);
        BinaryData IPersistableModel<FlatMrwBase>.Write(ModelReaderWriterOptions options)
            => PersistableModelWriteCore(options);
        FlatMrwBase IPersistableModel<FlatMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options)
            => PersistableModelCreateCore(data, options);
        string IPersistableModel<FlatMrwBase>.GetFormatFromOptions(ModelReaderWriterOptions options)
            => PersistableModelGetFormatFromOptions(options);
    }

    public class MixedTypeOrderedBase
    {
        public MixedTypeOrderedBase() { }
        public MixedTypeOrderedBase(string first, int second) { First = first; Second = second; }
        public string? First { get; set; }
        public int Second { get; set; }
    }

    public class SameTypeOrderedBase
    {
        public SameTypeOrderedBase() { }
        public SameTypeOrderedBase(string first, string second) { First = first; Second = second; }
        public string? First { get; set; }
        public string? Second { get; set; }
    }

    public class NullablePropertyNonnullableConstructorBase
    {
        public NullablePropertyNonnullableConstructorBase() { }
        public NullablePropertyNonnullableConstructorBase(int value) { Value = value; }
        public int? Value { get; set; }
    }
}
