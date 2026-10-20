// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Tests.Providers.NetworkFramework;
using Moq;
using Moq.Protected;
using NUnit.Framework;
using ResourceLocation = Microsoft.TypeSpec.Generator.Tests.Providers.NetworkFramework.ResourceLocation;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class FlatFrameworkBaseConstructorTests
    {
        [Test]
        public async Task PreservesHistoricalPropertiesOnlyConstructorForRestoredFlatModel()
        {
            var (model, baseline) = await CreateModelAsync();
            var generatedType = CompileGeneratedModel(model);
            var baselineType = LoadAssembly(baseline).GetType("Sample.Models.ConnectionAnalyzerData")!;
            var previousConstructor = baselineType.GetConstructor([typeof(ConnectionAnalyzerProperties)])!;
            var properties = new ConnectionAnalyzerProperties { Endpoint = "original" };
            var previous = (TrackedResourceData)previousConstructor.Invoke([properties]);
            Assert.That(previous.Location, Is.EqualTo(default(ResourceLocation)));
            AssertRejectsNullProperties(previousConstructor, [null]);

            var restoredConstructor = generatedType.GetConstructor([typeof(ConnectionAnalyzerProperties)]);
            Assert.That(restoredConstructor, Is.Not.Null,
                "The shipped properties-only overload must survive even when the restored framework base adds a location parameter.");

            // Exercise the compiled overload, not just its signature: chaining must initialize the base
            // exactly once, preserve the historical default Location, assign Properties, and validate null.
            var restored = (TrackedResourceData)restoredConstructor!.Invoke([properties]);
            Assert.Multiple(() =>
            {
                Assert.That(restored.Location, Is.EqualTo(previous.Location));
                Assert.That(restored.BaseInitializationCount, Is.EqualTo(previous.BaseInitializationCount));
                Assert.That(restored.Tags, Is.Not.Null);
                Assert.That(generatedType.GetProperty("Properties")!.GetValue(restored), Is.SameAs(properties));
            });
            AssertRejectsNullProperties(restoredConstructor, [null]);
        }

        [Test]
        public async Task CurrentFlatModelConstructorInitializesBaseAndValidatesProperties()
        {
            var (model, _) = await CreateModelAsync();
            var generatedType = CompileGeneratedModel(model);
            var constructor = generatedType.GetConstructor([typeof(ResourceLocation), typeof(ConnectionAnalyzerProperties)]);
            Assert.That(constructor, Is.Not.Null, "The fixture must reproduce the newly generated location-plus-properties shape.");

            var location = new ResourceLocation("eastus");
            var properties = new ConnectionAnalyzerProperties { Endpoint = "current" };
            var instance = (TrackedResourceData)constructor!.Invoke([location, properties]);
            Assert.Multiple(() =>
            {
                Assert.That(instance.Location, Is.EqualTo(location));
                Assert.That(instance.BaseInitializationCount, Is.EqualTo(1));
                Assert.That(instance.Tags, Is.Not.Null);
                Assert.That(generatedType.GetProperty("Properties")!.GetValue(instance), Is.SameAs(properties));
            });
            AssertRejectsNullProperties(constructor, [location, null]);
        }

        [TestCase(false, false, false)]
        [TestCase(true, true, false)]
        [TestCase(true, false, true)]
        public async Task DoesNotInventDefaultsForUnapprovedOrRequiredProperties(
            bool approveFrameworkDefault, bool requiredWireLocation, bool requiredOwnProperty)
        {
            var (model, _) = await CreateModelAsync(approveFrameworkDefault, requiredWireLocation, requiredOwnProperty);
            Assert.That(model.Constructors.Any(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 1), Is.False);
        }

        [Test]
        public async Task DoesNotGuessBetweenMultipleInitializationTargets()
        {
            var (model, _) = await CreateModelAsync(ambiguousInitializationTargets: true);
            Assert.That(model.Constructors.Count(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 2), Is.EqualTo(2));
            Assert.That(model.Constructors.Any(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                constructor.Signature.Parameters.Count == 1), Is.False);
        }

        private static async Task<(ModelProvider Model, CSharpCompilation Baseline)> CreateModelAsync(
            bool approveFrameworkDefault = true, bool requiredWireLocation = false, bool requiredOwnProperty = false,
            bool ambiguousInitializationTargets = false)
        {
            var baselinePath = Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false,
                method: nameof(PreservesHistoricalPropertiesOnlyConstructorForRestoredFlatModel)), "ConnectionAnalyzerData.cs");
            var baseline = CreateCompilation([File.ReadAllText(baselinePath)]);
            Assert.That(baseline.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);

            var locationType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "azureLocation", "Azure.Core.azureLocation");
            var propertiesType = InputFactory.Model("ConnectionAnalyzerProperties");
            var location = InputFactory.Property("location", locationType, isRequired: requiredWireLocation);
            var tags = InputFactory.Property("tags", InputFactory.Dictionary(InputPrimitiveType.String));
            var flatModel = InputFactory.Model("ConnectionAnalyzerData", usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                properties: [location, tags, InputFactory.Property("properties", propertiesType, isRequired: true),
                    .. requiredOwnProperty ? new[] { InputFactory.Property("newRequired", InputPrimitiveType.Int32, isRequired: true) } : []]);

            // Isolate constructor preservation after the flat-base prerequisite (#12303) has succeeded.
            // The source model stays flat and its wire location stays optional. The mapped framework
            // projection models the restored base's location initialization requirement, not new wire ownership.
            var inheritedProjection = InputFactory.Model("TrackedResourceProjection", properties:
            [
                InputFactory.Property("location", locationType, isRequired: true),
            ]);
            var historicalBase = new NamedTypeSymbolProvider(
                baseline.GetTypeByMetadataName(typeof(TrackedResourceData).FullName!)!, baseline);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [flatModel],
                createModelCore: input => input == flatModel
                    ? new RestoredFlatModelProvider(input,
                        new SystemObjectModelProvider(new CSharpType(typeof(TrackedResourceData)), inheritedProjection, historicalBase), ambiguousInitializationTargets)
                    : new ModelProvider(input),
                lastContractCompilation: () => Task.FromResult<Compilation>(baseline),
                // The semantic scalar is represented by a reflected type in current input and a
                // symbol-backed type in the historical contract. Match only this known CLR shape.
                isLastContractModelBasePropertyCompatible: (mappedBase, input, previous) =>
                    mappedBase.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))) &&
                    ReferenceEquals(input.Type, locationType) && input.Name == "location" && !input.IsReadOnly &&
                    previous.Name == "Location" && previous.Type.AreNamesEqual(new CSharpType(typeof(ResourceLocation))) &&
                    !previous.Type.IsNullable && !previous.IsInitOnly && previous.Body.HasSetter);

            Mock.Get(CodeModelGenerator.Instance.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateCSharpTypeCore", ItExpr.Is<InputType>(input =>
                    ReferenceEquals(input, locationType) || ReferenceEquals(input, propertiesType)))
                .Returns((InputType input) => new CSharpType(ReferenceEquals(input, locationType)
                    ? typeof(ResourceLocation) : typeof(ConnectionAnalyzerProperties)));

            if (approveFrameworkDefault)
            {
                // This downstream opt-in is deliberately limited to the observed legacy Network overload.
                Mock.Get(CodeModelGenerator.Instance.TypeFactory).Protected()
                    .Setup<bool>("CanDefaultLastContractModelBaseConstructorParameterCore", ItExpr.IsAny<CSharpType>(),
                        ItExpr.IsAny<InputModelProperty>(), ItExpr.IsAny<ParameterProvider>(), ItExpr.IsAny<ConstructorSignature>())
                    .Returns((CSharpType mappedBase, InputModelProperty input, ParameterProvider parameter, ConstructorSignature previous) =>
                        mappedBase.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))) &&
                        ReferenceEquals(input.Type, locationType) && input.Name == "location" && parameter.Name == "location" &&
                        previous.Parameters.Count == 1 && previous.Parameters[0].Name == "properties");
            }

            var model = CodeModelGenerator.Instance.TypeFactory.CreateModel(flatModel)!;
            Assert.Multiple(() =>
            {
                Assert.That(flatModel.BaseModel, Is.Null, "This is the flat-input case, not the BotData mapped-base upgrade.");
                Assert.That(location.IsRequired, Is.EqualTo(requiredWireLocation), "Constructor repair must not change the wire contract.");
                Assert.That(model.CustomCodeView, Is.Null, "No handwritten base or constructor partial may repair this scenario.");
                Assert.That(model.BaseType?.AreNamesEqual(new CSharpType(typeof(TrackedResourceData))), Is.True);
                Assert.That(model.Properties.Select(property => property.Name),
                    Is.EqualTo(requiredOwnProperty ? new[] { "Properties", "NewRequired" } : new[] { "Properties" }));
                Assert.That(model.Constructors.Count(constructor => constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)),
                    Is.EqualTo(ambiguousInitializationTargets ? 2 : 1));
                Assert.That(model.Constructors.First(constructor =>
                    constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                    .Signature.Parameters.Select(parameter => parameter.Name),
                    Is.EqualTo(requiredOwnProperty ? new[] { "location", "properties", "newRequired" } : new[] { "location", "properties" }),
                    "The fixture must require a location before constructor back-compat repair, or the regression would pass vacuously.");
                Assert.That(model.LastContractView?.Constructors.Any(constructor =>
                    constructor.Signature.Parameters.Count == 1 &&
                    constructor.Signature.Parameters[0].Name == "properties"), Is.True);
            });
            var historicalParameters = model.LastContractView!.Constructors.SelectMany(constructor => constructor.Signature.Parameters)
                .Select(parameter => (Parameter: parameter, parameter.Property, parameter.WireInfo)).ToArray();
            model.ProcessTypeForBackCompatibility();
            foreach (var previous in historicalParameters)
            {
                Assert.That(ReferenceEquals(previous.Parameter.Property, previous.Property), Is.True);
                Assert.That(previous.Parameter.WireInfo, Is.SameAs(previous.WireInfo));
            }
            return (model, baseline);
        }

        private static Type CompileGeneratedModel(ModelProvider model)
        {
            // Compile the real emitted model and argument-validation helper; do not handwrite the overload under test.
            TypeProvider[] providers = [model, new ArgumentDefinition(), new ChangeTrackingDictionaryDefinition(),
                new ChangeTrackingListDefinition(), new OptionalDefinition()];
            var compilation = CreateCompilation(providers.Select(provider => new TypeProviderWriter(provider).Write().Content));
            return LoadAssembly(compilation).GetType("Sample.Models.ConnectionAnalyzerData")!;
        }

        private static CSharpCompilation CreateCompilation(IEnumerable<string> sources)
        {
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(TrackedResourceData).Assembly.Location)
                .Distinct(StringComparer.Ordinal)
                .Select(path => MetadataReference.CreateFromFile(path));
            return CSharpCompilation.Create($"NetworkConstructorContract_{Guid.NewGuid():N}",
                sources.Select(source => CSharpSyntaxTree.ParseText(source)), references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
        }

        private static Assembly LoadAssembly(CSharpCompilation compilation)
        {
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join(Environment.NewLine,
                result.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));
            return Assembly.Load(stream.ToArray());
        }

        private static void AssertRejectsNullProperties(ConstructorInfo constructor, object?[] arguments)
        {
            var exception = Assert.Throws<TargetInvocationException>(() => constructor.Invoke(arguments));
            Assert.That(exception!.InnerException, Is.TypeOf<ArgumentNullException>());
            Assert.That(((ArgumentNullException)exception.InnerException!).ParamName, Is.EqualTo("properties"));
        }

        // Supply only the already-restored hierarchy/projection. Constructor generation and back-compat
        // repair are deliberately NOT overridden. Full flat-base selection and ARM JSON integration belong
        // to the prerequisite changes; this fixture must not claim those paths or real GA ApiCompat coverage.
        private sealed class RestoredFlatModelProvider(InputModelType input, ModelProvider mappedBase, bool ambiguousTargets) : ModelProvider(input)
        {
            protected override CSharpType? BuildBaseType() => mappedBase.Type;
            protected override ModelProvider? BuildBaseModelProvider() => mappedBase;
            protected internal override PropertyProvider[] BuildProperties()
                => base.BuildProperties().Where(property => property.Name is not "Location" and not "Tags").ToArray();
            protected override TypeProvider[] BuildSerializationProviders() => [];
            protected internal override ConstructorProvider[] BuildConstructors()
            {
                var constructors = base.BuildConstructors();
                if (!ambiguousTargets)
                {
                    return constructors;
                }
                var parameters = constructors.Single(constructor =>
                    constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)).Signature.Parameters;
                var alternative = new ConstructorProvider(new ConstructorSignature(Type, null, MethodSignatureModifiers.Public,
                    [parameters[1], parameters[0]], initializer: new ConstructorInitializer(false, parameters)), MethodBodyStatement.Empty, this);
                return [.. constructors, alternative];
            }
        }
    }
}

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NetworkFramework
{
    public readonly struct ResourceLocation
    {
        public ResourceLocation(string value) => Value = value;
        public string? Value { get; }
    }

    public class TrackedResourceData
    {
        protected TrackedResourceData() : this(default) { }
        public TrackedResourceData(ResourceLocation location)
        {
            Location = location;
            BaseInitializationCount++;
        }

        public ResourceLocation Location { get; set; }
        public IDictionary<string, string> Tags { get; } = new Dictionary<string, string>();
        public int BaseInitializationCount { get; }
    }

    public sealed class ConnectionAnalyzerProperties
    {
        public string? Endpoint { get; set; }
    }
}
