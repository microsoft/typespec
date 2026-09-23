// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class ModelBaseContractRegressionTests
    {
        [SetUp]
        public void Setup() => MockHelpers.LoadMockGenerator();

        [TestCase("public virtual string Value { get; set; }", "public string Value { get; set; }")]
        [TestCase("public string Value { get; set; }", "protected string Value { get; set; }")]
        [TestCase("public string Value { get; set; }", "public string Value { get; protected set; }")]
        [TestCase("public static string Value { get; set; }", "public string Value { get; set; }")]
        [TestCase("public string Value { get; set; }", "public string Value { get; init; }")]
        [TestCase("public int Value { get; set; }", "public int? Value { get; set; }")]
        [TestCase("public System.Collections.Generic.List<int> Value { get; set; }", "public System.Collections.Generic.List<int?> Value { get; set; }")]
        [TestCase("public string Value { get; set; }", "public string Value { private get; set; }")]
        [TestCase("private int _value; public ref int Value => ref _value;", "public int Value { get; }")]
        [TestCase("public string this[int index] { get => null; set { } }", "public string Item { get; set; }")]
        public void GeneratedBaseRejectsChangedPropertyContract(string previous, string current)
        {
            Assert.That(CanUseGenerated(previous, current), Is.False);
        }

        [TestCase("public void M(ref int value) { }", "public void M(int value) { }")]
        [TestCase("public void M(in int value) { }", "public void M(int value) { }")]
        [TestCase("public void M(out int value) { value = 0; }", "public void M(int value) { }")]
        [TestCase("public void M<T>() { }", "public void M() { }")]
        [TestCase("public void M(params string[] values) { }", "public void M(string[] values) { }")]
        [TestCase("public void M(int value = 0) { }", "public void M(int value) { }")]
        [TestCase("public void M(int value = 0) { }", "public void M(int value = 1) { }")]
        [TestCase("public void M(int value) { }", "public void M(int renamed) { }")]
        [TestCase("public void M<T>(T value) { }", "public void M<T>(T value) where T : class { }")]
        [TestCase("public void M(ref readonly int value) { }", "public void M(int value) { }")]
        [TestCase("private int _value; public ref int M() => ref _value;", "public int M() => 0;")]
        [TestCase("public void M(System.Collections.Generic.List<int> value) { }", "public void M(System.Collections.Generic.List<int?> value) { }")]
        [TestCase("public void M(decimal value = 1m) { }", "public void M(decimal value = 2m) { }")]
        public void GeneratedBaseRejectsChangedMethodContract(string previous, string current)
        {
            Assert.That(CanUseGenerated(previous, current), Is.False);
        }

        [TestCase("public string Value { get; set; }")]
        [TestCase("public void M(int value = 0) { }")]
        [TestCase("public void M(string value = null) { }")]
        [TestCase("public void M(bool value = true) { }")]
        [TestCase("public void M(bool value = false) { }")]
        [TestCase("public void M(params string[] values) { }")]
        public void GeneratedBaseAcceptsUnchangedSupportedContract(string members)
        {
            Assert.That(CanUseGenerated(members, members), Is.True);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void GeneratedBaseRejectsOverloadedIndexersWithoutThrowing(bool historical)
        {
            const string indexers = "public string this[int index] => null; public string this[string index] => null;";
            Assert.That(CanUseGenerated(historical ? indexers : "", historical ? "" : indexers), Is.False);
        }

        [Test]
        public void SymbolBackedParamsConstructorIsRejected()
        {
            var historical = Parse("public Previous(params string[] values) { }");
            var parameters = historical.Constructors.Single().Signature.Parameters;
            Assert.That(SystemObjectModelProvider.HasSupportedConstructorParameters(parameters), Is.False);
        }

        [TestCase("public void Optional(int value = 0) { }")]
        [TestCase("public void ChangedDefault(int value = 0) { }")]
        [TestCase("public void Renamed(int value) { }")]
        [TestCase("public void Generic<T>() { }")]
        [TestCase("public void GenericParameter<T>(T value) { }")]
        [TestCase("public void Params(params string[] values) { }")]
        public void MappedBaseRejectsChangedMethodContract(string previous)
        {
            var mapped = Map(typeof(MethodTarget), Parse(previous));
            Assert.That(mapped.HasCompatibleLastContractNonPropertyMembers(), Is.False);
        }

        [TestCase("public void Optional(int value) { }")]
        [TestCase("public void ChangedDefault(int value = 1) { }")]
        [TestCase("public void UnchangedParams(params string[] values) { }")]
        [TestCase("public void NullDefault(string value = null) { }")]
        [TestCase("public void BoolDefault(bool value = true) { }")]
        public void MappedBaseAcceptsUnchangedSupportedMethod(string previous)
        {
            var mapped = Map(typeof(MethodTarget), Parse(previous));
            Assert.That(mapped.HasCompatibleLastContractNonPropertyMembers(), Is.True);
        }

        [TestCase("public int Value { get; set; }")]
        [TestCase("public int? Value { get; init; }")]
        public void MappedPropertyRejectsChangedClrContract(string previous)
        {
            Assert.That(Map(typeof(NullablePropertyTarget), Parse(previous)).HasCompatibleLastContractProperties(), Is.False);
        }

        [TestCase(typeof(AdditionalPropertyTarget), "single", "AdditionalProperties")]
        [TestCase(typeof(AdditionalUnionPropertyTarget), "union", "AdditionalInt32Properties")]
        [TestCase(typeof(AdditionalRawPropertyTarget), "raw", "AdditionalBinaryDataProperties")]
        public void MappedBaseRejectsSynthesizedAdditionalPropertyCollision(Type target, string shape, string propertyName)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var additionalType = shape switch
            {
                "union" => InputFactory.Union([InputPrimitiveType.String, InputPrimitiveType.Int32]),
                "raw" => InputFactory.Union([InputPrimitiveType.String, InputFactory.Model("ValueModel", properties: [])]),
                _ => InputPrimitiveType.String
            };
            var mapped = new SystemObjectModelProvider(new CSharpType(target), currentBase);
            var input = InputFactory.Model("Derived", properties: [], baseModel: currentBase, additionalProperties: additionalType);
            var derived = new AdditionalPropertyModel(input, mapped);

            var canRestore = new ModelBaseTypeCompatibility(derived).CanUseMappedBase(mapped);
            Assert.That(derived.PropertyBuildCount, Is.Zero, "Candidate validation must not populate the derived property cache");
            Assert.That(derived.Properties.Where(property => property.IsAdditionalProperties).Select(property => property.Name),
                Does.Contain(propertyName), "The colliding member must actually be synthesized by model emission");
            Assert.That(canRestore, Is.False);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void MappedBaseAllowsAdditionalPropertiesWithoutNameCollision(bool hasAdditionalProperties)
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var mapped = new SystemObjectModelProvider(new CSharpType(typeof(EmptyTarget)), currentBase);
            var input = InputFactory.Model("Derived", properties: [], baseModel: currentBase,
                additionalProperties: hasAdditionalProperties ? InputPrimitiveType.String : null);
            var derived = new AdditionalPropertyModel(input, mapped);
            Assert.That(new ModelBaseTypeCompatibility(derived).CanUseMappedBase(mapped), Is.True);
        }

        [Test]
        public void MappedBaseRejectsConstructorRequiringSetsRequiredMembers()
        {
            // The current target adds a required member absent from the historical CLR property list.
            // Calling its attributed constructor requires the derived constructor to carry the attribute.
            var mapped = Map(typeof(SetsRequiredMembersTarget), Parse(""));
            Assert.That(mapped.HasCompatibleLastContractProperties(), Is.True);
            Assert.That(mapped.HasReconstructibleLastContractConstructor, Is.False);
        }

        [Test]
        public void MappedBaseRejectsNewRequiredProperty()
        {
            var mapped = Map(typeof(RequiredPropertyTarget), Parse("public string Value { get; set; }"));
            Assert.That(mapped.HasCompatibleLastContractProperties(), Is.False);
        }

        [TestCase(typeof(RequiredPropertyTarget))]
        [TestCase(typeof(RequiredFieldTarget))]
        [TestCase(typeof(InheritedRequiredPropertyTarget))]
        [TestCase(typeof(InheritedRequiredFieldTarget))]
        public void MappedBaseRejectsRequiredTargetHierarchy(Type target)
        {
            var mapped = Map(target, Parse(""));
            Assert.That(MappedModelBaseCompatibility.IsSupportedModelBase(mapped), Is.False);
        }

        [Test]
        public void MappedBaseRejectsHiddenField()
        {
            var mapped = Map(typeof(HiddenFieldTarget), Parse("public int Value;"));
            Assert.That(mapped.HasCompatibleLastContractNonPropertyMembers(), Is.False,
                "The nearer incompatible field must not be masked by a compatible ancestor");
        }

        [Test]
        public void OrdinaryMappedInitializationMustBeCallableOnActualFrameworkTarget()
        {
            var input = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("name", InputPrimitiveType.String)]);
            var mapped = new SystemObjectModelProvider(new CSharpType(typeof(System.Globalization.CultureInfo)), input);
            Assert.That(mapped.HasReconstructibleLastContractConstructor, Is.False,
                "A full string constructor does not prove the emitted parameterless initialization call is valid");
        }

        [Test]
        public void MappedInitializationMustBeCallableOnActualFrameworkTarget()
        {
            var historical = Parse("""
                public Previous(string name, int value = 0) { }
                public string Name { get; set; }
                public int Value { get; set; }
                """);
            var input = InputFactory.Model("CurrentBase", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("value", InputPrimitiveType.Int32)
            ]);
            var mapped = new SystemObjectModelProvider(new CSharpType(typeof(ConstructorTarget)), input, historical);
            Assert.That(mapped.HasReconstructibleLastContractConstructor, Is.False,
                "The generated initialization call base(name) must exist on the actual framework, not only in Roslyn");
        }

        [TestCase(typeof(AmbiguousConstructorTarget), false)]
        [TestCase(typeof(ChangedConstructorDefaultTarget), false)]
        [TestCase(typeof(OptionalConstructorTarget), true)]
        public void MappedInitializationValidatesOmittedArguments(Type target, bool expected)
        {
            var historical = Parse("public Previous(int value = 0) { } public int Value { get; set; }");
            var input = InputFactory.Model("CurrentBase", properties: [InputFactory.Property("value", InputPrimitiveType.Int32)]);
            var mapped = new SystemObjectModelProvider(new CSharpType(target), input, historical);
            Assert.That(mapped.HasReconstructibleLastContractConstructor, Is.EqualTo(expected));
        }

        [Test]
        public void GeneratedBaseRejectsNonPropertyConstructorState()
        {
            Assert.That(CanUseGenerated("public Previous(int state) { }", ""), Is.False);
        }

        [Test]
        public void GeneratedBaseRejectsMissingLastContractView()
        {
            var candidate = new ContractModel(null, Parse(""));
            var derived = new ModelProvider(InputFactory.Model("Derived", properties: []));
            Assert.That(new ModelBaseTypeCompatibility(derived).IsSupportedModelBase(candidate), Is.False);
        }

        [Test]
        public void MappedBaseAcceptsPreservedInterface()
        {
            var mapped = Map(typeof(DisposableTarget), Parse("public void Dispose() { }", implements: " : System.IDisposable"));
            Assert.That(mapped.HasCompatibleLastContractInterfaces(null), Is.True);
        }

        [Test]
        public void GeneratedBaseRejectsLostInterface()
        {
            var previous = Parse("", implements: " : IMarker");
            var candidate = new ContractModel(previous, Parse(""));
            var derived = new ModelProvider(InputFactory.Model("Derived", properties: []));
            Assert.That(new ModelBaseTypeCompatibility(derived).IsSupportedModelBase(candidate), Is.False);
        }

        [Test]
        public void MappedBaseRejectsLostInterface()
        {
            var currentBase = InputFactory.Model("CurrentBase", properties: []);
            var derived = new ModelProvider(InputFactory.Model("Derived", properties: [], baseModel: currentBase));
            var mapped = new SystemObjectModelProvider(new CSharpType(typeof(EmptyTarget)), currentBase,
                Parse("", implements: " : IMarker"));
            Assert.That(new ModelBaseTypeCompatibility(derived).CanUseMappedBase(mapped), Is.False);
        }

        [Test]
        public void GeneratedBaseAcceptsPreservedInterface()
        {
            var previous = Parse("", implements: " : IMarker");
            var candidate = new ContractModel(previous, previous);
            var derived = new ModelProvider(InputFactory.Model("Derived", properties: []));
            Assert.That(new ModelBaseTypeCompatibility(derived).IsSupportedModelBase(candidate), Is.True);
        }

        [Test]
        public void MappedBaseRejectsUnprovenConstantValue()
        {
            var mapped = Map(typeof(ConstantTarget), Parse("public const int Value = 1;"));
            Assert.That(mapped.HasCompatibleLastContractNonPropertyMembers(), Is.False);
        }

        private static bool CanUseGenerated(string previous, string current)
        {
            var candidate = new ContractModel(Parse(previous), Parse(current));
            var derived = new ModelProvider(InputFactory.Model("Derived", properties: []));
            return new ModelBaseTypeCompatibility(derived).IsSupportedModelBase(candidate);
        }

        private static SystemObjectModelProvider Map(Type target, TypeProvider previous)
            => new(new CSharpType(target), InputFactory.Model("CurrentBase", properties: []), previous);

        private static NamedTypeSymbolProvider Parse(string members, string implements = "")
        {
            var compilation = CSharpCompilation.Create("PreviousContract",
                [CSharpSyntaxTree.ParseText($"namespace Sample {{ public interface IMarker {{ }} public class Previous{implements} {{ {members} }} }}")],
                [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error),
                Is.Empty, "Regression fixtures must be valid C# contracts");
            return new NamedTypeSymbolProvider(compilation.GetTypeByMetadataName("Sample.Previous")!, compilation);
        }

        private sealed class ContractModel(TypeProvider? previous, TypeProvider current)
            : ModelProvider(InputFactory.Model("Previous", properties: [], @namespace: "Sample"))
        {
            private protected override TypeProvider? BuildLastContractView(string? generatedTypeName = null, string? generatedTypeNamespace = null)
                => previous;
            protected internal override PropertyProvider[] BuildProperties() => current.Properties.ToArray();
            protected internal override MethodProvider[] BuildMethods() => current.Methods.ToArray();
            protected internal override CSharpType[] BuildImplements() => current.Implements.ToArray();
            protected override TypeProvider[] BuildSerializationProviders() => [];
        }

        private sealed class AdditionalPropertyModel(InputModelType input, ModelProvider mappedBase) : ModelProvider(input)
        {
            public int PropertyBuildCount { get; private set; }
            protected override CSharpType? BuildBaseType() => mappedBase.Type;
            protected override ModelProvider? BuildBaseModelProvider() => mappedBase;
            protected internal override PropertyProvider[] BuildProperties()
            {
                PropertyBuildCount++;
                return base.BuildProperties();
            }
        }

        public class AdditionalPropertyTarget { public string AdditionalProperties => string.Empty; }
        public class AdditionalUnionPropertyTarget { public void AdditionalInt32Properties() { } }
        public class AdditionalRawPropertyTarget { public string AdditionalBinaryDataProperties = string.Empty; }
        public class EmptyTarget { }
        public class ConstantTarget { public const int Value = 2; }
        public class MethodTarget
        {
            public void Optional(int value) { }
            public void ChangedDefault(int value = 1) { }
            public void Renamed(int renamed) { }
            public void Generic<T>() where T : class { }
            public void GenericParameter<T>(T value) where T : class { }
            public void Params(string[] values) { }
            public void UnchangedParams(params string[] values) { }
            public void NullDefault(string value = null!) { }
            public void BoolDefault(bool value = true) { }
        }
        public class NullablePropertyTarget { public int? Value { get; set; } }
        public class RequiredPropertyTarget { public required string Value { get; set; } }
        public class RequiredFieldTarget { public required string Value; }
        public class RequiredPropertyBase { public required string Value { get; set; } }
        public class InheritedRequiredPropertyTarget : RequiredPropertyBase { }
        public class RequiredFieldBase { public required string Value; }
        public class InheritedRequiredFieldTarget : RequiredFieldBase { }
        public class SetsRequiredMembersTarget
        {
            [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
            public SetsRequiredMembersTarget() { Value = string.Empty; }
            public required string Value { get; set; }
        }
        public class DisposableTarget : IDisposable { public void Dispose() { } }
        public class OptionalConstructorTarget
        {
            public OptionalConstructorTarget(int value = 0) { Value = value; }
            public int Value { get; set; }
        }
        public class ChangedConstructorDefaultTarget
        {
            public ChangedConstructorDefaultTarget(int value = 1) { Value = value; }
            public int Value { get; set; }
        }
        public class AmbiguousConstructorTarget
        {
            public AmbiguousConstructorTarget(int value = 0) { Value = value; }
            public AmbiguousConstructorTarget(string text = "") { }
            public int Value { get; set; }
        }
        public class FieldBase { public int Value; }
        public class HiddenFieldTarget : FieldBase { public new string Value = string.Empty; }
        public class ConstructorTarget
        {
            public ConstructorTarget(string name, int value) { Name = name; Value = value; }
            public string Name { get; set; }
            public int Value { get; set; }
        }
    }
}
