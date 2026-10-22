// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using ExternalModels;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class SerializationCustomizationTests
    {
        [Test]
        public async Task ExternalPropertyReplacementCompilesAndRoundTrips(
            [Values("J", "W")] string format, [Values] bool typedAdditionalProperties, [Values] bool readOnly,
            [Values] bool generatedGrandchild)
        {
            var externalKind = InputFactory.StringEnum("ResponseKind", [("Tool", "tool")], isExtensible: true,
                external: new InputExternalTypeMetadata(typeof(ExternalResponseKind).AssemblyQualifiedName!, null, null));
            var kind = InputFactory.Property("kind", externalKind, serializedName: "type", isDiscriminator: true, isRequired: true);
            var responseId = InputFactory.Property("responseId", InputPrimitiveType.String, serializedName: "response_id", isReadOnly: readOnly);
            var parentValue = InputFactory.Property("parentValue", InputPrimitiveType.String, serializedName: "parent_value", isRequired: true);
            var external = InputFactory.Model("ExternalResponse",
                properties: [kind, InputFactory.Property("id", InputPrimitiveType.String, isRequired: true), responseId, parentValue],
                external: new InputExternalTypeMetadata(typeof(ExternalResponse).AssemblyQualifiedName!, null, null));
            var input = InputFactory.Model("Model", baseModel: external,
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json,
                discriminatedKind: "tool",
                additionalProperties: typedAdditionalProperties ? InputPrimitiveType.Any : null);
            var leaf = generatedGrandchild ? InputFactory.Model("Leaf", baseModel: input,
                properties: [InputFactory.Property("leafName", InputPrimitiveType.String, isRequired: true)]) : null;
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => leaf is null ? [external, input] : [external, input, leaf],
                inputEnums: () => [externalKind]);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Append(typeof(ExternalResponse).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var custom = (await Helpers.GetCompilationFromDirectoryAsync(method: "ExternalPropertyReplacement"))
                .AddReferences(references);
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(custom, null));
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            var runtimeModel = leaf is null ? model : generator.Object.TypeFactory.CreateModel(leaf)!;
            if (leaf is not null)
            {
                _ = model.Constructors;
                var initialization = runtimeModel.Constructors.Single(constructor =>
                    constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
                Assert.That(initialization.Signature.Parameters.Select(parameter => parameter.Name),
                    Is.EqualTo(new[] { "id", "parentValue", "name", "leafName" }));
                Assert.That(initialization.Signature.Parameters[1].Property,
                    Is.SameAs(model.CanonicalView.Properties.Single(property => property.Name == "ParentValueInternal")),
                    "The nearest replacement must own the inherited slot at its original position.");
                Assert.That(runtimeModel.FullConstructor.Signature.Parameters.Count(parameter =>
                    parameter.Property?.InputProperty == parentValue), Is.EqualTo(1));
            }
            var replacement = model.CanonicalView.Properties.Single(property => property.Name == "ResponseIdInternal");
            Assert.That(replacement.OriginalName, Is.EqualTo("ResponseId"),
                string.Join(Environment.NewLine, custom.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));
            Assert.That(replacement.InputProperty, Is.SameAs(responseId),
                "CodeGenMember must bind the inherited spec property, not introduce a second wire property.");
            Assert.That(model.FullConstructor.Signature.Parameters.Count(parameter =>
                parameter.Property?.InputProperty == responseId), Is.EqualTo(1));
            Assert.That(model.BaseModelProvider!.FullConstructor.Signature.Parameters
                .Single(parameter => parameter.Property?.InputProperty == responseId).Property!.Name, Is.EqualTo("ResponseId"),
                "A replacement must not mutate the external provider shared by sibling models.");
            var providers = generator.Object.OutputLibrary.TypeProviders.Where(provider => provider == model || provider == runtimeModel ||
                provider.Name is "Argument" or "Optional" or "ChangeTrackingList" or "ChangeTrackingDictionary" or
                    "ModelSerializationExtensions" or "TypeFormatters" or "SerializationFormat" ||
                provider is ModelReaderWriterContextDefinition or ModelFactoryProvider).ToArray();
            var trees = providers.SelectMany(provider => new[] { provider }.Concat(provider.SerializationProviders))
                .Distinct().Select(provider => CSharpSyntaxTree.ParseText(new TypeProviderWriter(provider).Write().Content));
            var compilation = CSharpCompilation.Create("ExternalReplacement" + format + Guid.NewGuid().ToString("N"),
                custom.SyntaxTrees.Where(tree => Path.GetFileName(tree.FilePath).StartsWith("CodeGen", StringComparison.Ordinal) ||
                    Path.GetFileName(tree.FilePath) == "Model.cs").Concat(trees), references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Disable));
            var sourceGenerators = Assembly.Load("System.ClientModel.SourceGeneration").GetTypes()
                .Where(type => type.IsDefined(typeof(GeneratorAttribute)))
                .Select(type => Activator.CreateInstance(type))
                .Select(sourceGenerator => sourceGenerator is ISourceGenerator generator
                    ? generator : ((IIncrementalGenerator)sourceGenerator!).AsSourceGenerator());
            CSharpGeneratorDriver.Create(sourceGenerators).RunGeneratorsAndUpdateCompilation(compilation,
                out var generatedCompilation, out var generatorDiagnostics);
            Assert.That(generatorDiagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var stream = new MemoryStream();
            var result = generatedCompilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join(Environment.NewLine,
                result.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));
            var assembly = Assembly.Load(stream.ToArray());
            var generatedType = assembly.GetType("Sample.Models." + runtimeModel.Name)!;
            if (leaf is not null)
            {
                var initialized = Activator.CreateInstance(generatedType, "item", "parent", "payload", "leaf")!;
                Assert.That(generatedType.GetProperty("ParentValueInternal")!.GetValue(initialized), Is.EqualTo("parent"));
                Assert.That(generatedType.GetProperty("LeafName")!.GetValue(initialized), Is.EqualTo("leaf"));
            }
            var factory = providers.OfType<ModelFactoryProvider>().Single();
            var factoryMethod = factory.Methods.Single(method => method.Signature.Name == "Model");
            Assert.That(factoryMethod.Signature.Parameters.Select(parameter => parameter.Name), Does.Not.Contain("kind"));
            var factoryType = assembly.GetType(factory.Type.Namespace + "." + factory.Name)!;
            var factoryInstance = (ExternalResponse)factoryType.GetMethod("Model")!.Invoke(null,
                factoryMethod.Signature.Parameters.Select(_ => (object?)null).ToArray())!;
            Assert.That(factoryInstance.Kind.ToString(), Is.EqualTo("tool"));
            var deserialize = generatedType.GetMethod("Deserialize" + runtimeModel.Name, BindingFlags.Static | BindingFlags.NonPublic)!;
            var options = new ModelReaderWriterOptions(format);
            using var payload = JsonDocument.Parse("""{"type":"tool","id":"item","response_id":"response","parent_value":"parent","name":"payload","leafName":"leaf","extra":42}""");
            var instance = (ExternalResponse)deserialize.Invoke(null, [payload.RootElement, options])!;
            Assert.That(generatedType.GetProperty("ResponseIdInternal", BindingFlags.Instance | BindingFlags.NonPublic)!
                .GetValue(instance), Is.EqualTo("response"));
            using var output = new MemoryStream();
            using (var writer = new Utf8JsonWriter(output))
            {
                ((IJsonModel<ExternalResponse>)instance).Write(writer, options);
            }
            using var document = JsonDocument.Parse(output.ToArray());
            var properties = document.RootElement.EnumerateObject().ToArray();
            Assert.That(properties.Select(property => property.Name).Distinct().Count(), Is.EqualTo(properties.Length),
                "The proxy and its backing additional-data bag must not both write response_id.");
            bool writesResponseId = !readOnly || format == "J";
            Assert.That(document.RootElement.TryGetProperty("response_id", out var serializedResponseId), Is.EqualTo(writesResponseId));
            if (writesResponseId)
            {
                Assert.That(serializedResponseId.GetString(), Is.EqualTo("response"));
            }
            Assert.That(document.RootElement.GetProperty("type").GetString(), Is.EqualTo("tool"));
            Assert.That(document.RootElement.GetProperty("parent_value").GetString(), Is.EqualTo("parent"));
            Assert.That(document.RootElement.TryGetProperty("extra", out _), Is.EqualTo(typedAdditionalProperties || format == "J"));
            var restored = deserialize.Invoke(null, [document.RootElement, options])!;
            Assert.That(generatedType.GetProperty("ResponseIdInternal", BindingFlags.Instance | BindingFlags.NonPublic)!
                .GetValue(restored), Is.EqualTo(writesResponseId ? "response" : null));
            var persisted = ((IPersistableModel<ExternalResponse>)instance).Write(options);
            using var persistedDocument = JsonDocument.Parse(persisted);
            Assert.That(JsonElement.DeepEquals(document.RootElement, persistedDocument.RootElement), Is.True);
            var persistedModel = ((IPersistableModel<ExternalResponse>)instance).Create(persisted, options);
            Assert.That(generatedType.GetProperty("ResponseIdInternal", BindingFlags.Instance | BindingFlags.NonPublic)!
                .GetValue(persistedModel), Is.EqualTo(writesResponseId ? "response" : null));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ExternalPropertyReplacementsHonorNormalizedNames(bool exactName)
        {
            var ipFoo = InputFactory.Property("ipFoo", InputPrimitiveType.String, serializedName: "ip_foo", isExactName: exactName);
            var createdAt = InputFactory.Property("createdAt",
                new InputDateTimeType(DateTimeKnownEncoding.Rfc3339, "utcDateTime", "TypeSpec.utcDateTime", InputPrimitiveType.String),
                serializedName: "created_at", isExactName: exactName);
            var external = InputFactory.Model("ExternalResponse", properties: [ipFoo, createdAt],
                external: new InputExternalTypeMetadata(typeof(ExternalResponse).AssemblyQualifiedName!, null, null));
            var input = InputFactory.Model("Model", properties: [], baseModel: external);
            var generator = await MockHelpers.LoadMockGeneratorAsync(inputModels: () => [external, input],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            var properties = model.CanonicalView.Properties;
            Assert.Multiple(() =>
            {
                Assert.That(properties.Single(property => property.Name == "IPFooInternal").InputProperty,
                    exactName ? Is.Null : Is.SameAs(ipFoo));
                Assert.That(properties.Single(property => property.Name == "CreatedOnInternal").InputProperty,
                    exactName ? Is.Null : Is.SameAs(createdAt));
            });
            var write = model.SerializationProviders.Single().Methods.Single(method => method.Signature.Name == "JsonModelWriteCore")
                .BodyStatements!.ToDisplayString();
            Assert.That(write.Contains("\"ip_foo\""), Is.EqualTo(!exactName));
            Assert.That(write.Contains("\"created_at\""), Is.EqualTo(!exactName));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task SerializationNameDoesNotReplaceInheritedProperty(bool externalBase)
        {
            var baseModel = InputFactory.Model("ExternalResponse",
                properties: [InputFactory.Property("responseId", InputPrimitiveType.String, serializedName: "response_id")],
                external: externalBase ? new InputExternalTypeMetadata(typeof(ExternalResponse).AssemblyQualifiedName!, null, null) : null);
            var input = InputFactory.Model("Model", properties: [], baseModel: baseModel);
            var generator = await MockHelpers.LoadMockGeneratorAsync(inputModels: () => [baseModel, input],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            var proxy = model.CanonicalView.Properties.Single(property => property.Name == "ResponseIdInternal");
            Assert.That(proxy.InputProperty, Is.Null);
            Assert.That(model.ExternalPropertyReplacements, Is.Empty);
            Assert.That(model.FullConstructor.Signature.Parameters.Count(parameter =>
                parameter.Property?.WireInfo?.SerializedName == "response_id"), Is.EqualTo(2),
                "Wire-name aliases alone must not silently replace an inherited member.");
        }

        [Test]
        public async Task BackCompat_RenamedPropertiesKeepSerializationParameters(
            [Values(false, true)] bool useLastContract)
        {
            var inputEnum = InputFactory.StringEnum("DestinationKind", [("VirtualNetwork", "virtualNetwork")]);
            var inputModel = InputFactory.Model("MockInputModel", properties: [
                    InputFactory.Property("isEnabled", InputPrimitiveType.Boolean, isRequired: true, serializedName: "enabled"),
                    InputFactory.Property("destinationType", inputEnum, isRequired: true, serializedName: "type"),
                    InputFactory.Property("enforcement", inputEnum)
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputEnums: () => [inputEnum],
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync("Custom"),
                lastContractCompilation: useLastContract
                    ? async () => await Helpers.GetCompilationFromDirectoryAsync("Previous")
                    : null);

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().Single();
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            modelProvider.EnsureBuilt();
            serializationProvider.EnsureBuilt();
            modelProvider.ProcessTypeForBackCompatibility();

            var publicConstructor = modelProvider.Constructors.Single(c =>
                c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.That(publicConstructor.Signature.Parameters.Select(p => p.Name),
                Is.EqualTo(useLastContract ? new[] { "enabled", "type" } : new[] { "isEnabled", "destinationType" }));
            Assert.That(publicConstructor.Signature.Parameters.Select(p => p.Property?.Name),
                Is.EqualTo(new[] { "IsEnabled", "DestinationType" }));
            Assert.That(modelProvider.FullConstructor.Signature.Parameters.Take(2).Select(p => p.Name),
                Is.EqualTo(new[] { "isEnabled", "destinationType" }));
            Assert.That(modelProvider.FullConstructor.Signature.Parameters.Take(2).Select(p => p.AsVariable().Declaration.RequestedName),
                Is.EqualTo(new[] { "isEnabled", "destinationType" }));

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider, name => name is "DeserializeMockInputModel" or "JsonModelWriteCore"));
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.Write().Content);
        }

        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("Model", properties: props, usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task ReadOnlyMemPropertyType()
        {
            var inputModel = InputFactory.Model("Model", properties: [
                    InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String)),
                    InputFactory.Property("Prop2", InputFactory.Array(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task ConcreteListPropertyType()
        {
            var inputModel = InputFactory.Model("Model", properties: [
                    InputFactory.Property("requiredNames", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
                    InputFactory.Property("requiredNullableNames", new InputNullableType(InputFactory.Array(InputPrimitiveType.String)), isRequired: true),
                    InputFactory.Property("optionalNames", InputFactory.Array(InputPrimitiveType.String))
                ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider, name => name is "DeserializeModel" or "JsonModelWriteCore"));
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.Write().Content);
        }

        [Test]
        public async Task ConcreteOptionalNullableCollectionsStartUndefined()
        {
            var inputModel = InputFactory.Model("Model", properties: [
                    InputFactory.Property("concreteNames", new InputNullableType(InputFactory.Array(InputPrimitiveType.String))),
                    InputFactory.Property("concreteLabels", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String))),
                    InputFactory.Property("trackedNames", new InputNullableType(InputFactory.Array(InputPrimitiveType.String))),
                    InputFactory.Property("trackedLabels", new InputNullableType(InputFactory.Dictionary(InputPrimitiveType.String)))
                ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = (MrwSerializationTypeDefinition)modelProvider.SerializationProviders.Single();
            var content = serializationProvider.BuildDeserializationMethod().BodyStatements!.ToDisplayString();

            StringAssert.Contains(Helpers.GetExpectedFromFile().ReplaceLineEndings("\n"), content);
        }

        [Test]
        public async Task CanCustomizeSerializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                        InputFactory.Property("Prop1", InputPrimitiveType.String),
                        InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that when a custom deserialization hook has a ModelReaderWriterOptions parameter,
        // the generated code passes the options to the hook.
        [Test]
        public async Task CanCustomizeDeserializationMethodWithOptions()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                        InputFactory.Property("Prop1", InputPrimitiveType.String),
                        InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider!,
                name => name == "DeserializeMockInputModel"));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that when a custom deserialization hook does not have a ModelReaderWriterOptions parameter,
        // the generated code does not pass options to the hook.
        [Test]
        public async Task CanCustomizeDeserializationMethodWithoutOptions()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                        InputFactory.Property("Prop1", InputPrimitiveType.String),
                        InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider!,
                name => name == "DeserializeMockInputModel"));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanCustomizeSerializationMethodForRenamedProperty()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that the custom serialization method is used in the serialization provider
        // for the custom property that exists in the base model.
        [Test]
        public async Task CanCustomizeSerializationMethodForPropertyInBase()
        {
            var baseModel = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Input,
                properties: [InputFactory.Property("Prop1", InputPrimitiveType.Int32, isRequired: true)]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [
                    InputFactory.Model(
                        "mockInputModel",
                        usage: InputModelTypeUsage.Json,
                        properties:
                        [
                            InputFactory.Property("OtherProp", InputPrimitiveType.Int32, isRequired: true),
                        ],
                        baseModel: baseModel),
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider);
            Assert.IsNotNull(modelProvider);
            var serializationProvider = modelProvider!.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that a properties serialization name can be changed using custom code.
        [Test]
        public async Task CanChangePropertySerializedName()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Name", InputPrimitiveType.String),
                    InputFactory.Property("Color", InputPrimitiveType.String),
                    InputFactory.Property("Flavor", InputPrimitiveType.String)
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);

            Assert.IsNotNull(modelProvider);
            Assert.IsNotNull(serializationProvider);

            var properties = modelProvider.Properties;
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("Name", properties[0].Name);
            Assert.AreEqual("customName", properties[0].WireInfo?.SerializedName);
            Assert.AreEqual("Flavor", properties[1].Name);
            Assert.AreEqual("flavor", properties[1].WireInfo?.SerializedName);


            var customCodeView = modelProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customProperties = customCodeView!.Properties;
            Assert.AreEqual(1, customProperties.Count);
            Assert.AreEqual("CustomColor", customProperties[0].Name);
            Assert.AreEqual("customColor2", customProperties[0].WireInfo?.SerializedName);

            // validate the serialization provider uses the custom property name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanChangeDictionaryToBinaryData()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    // generated type is a dictionary of string to BinaryData
                    InputFactory.Property("Prop1", InputFactory.Dictionary(InputPrimitiveType.Any))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private static IEnumerable<TestCaseData> ExtensibleEnumCases =>
        [
            new TestCaseData(InputFactory.StringEnum("EnumType", [("value", "value")], isExtensible: true)),
            new TestCaseData(InputFactory.Int32Enum("EnumType", [("one", 1)], isExtensible: true)),
        ];

        [Test]
        public async Task BackCompat_EnumChangedToExtensibleUsesCurrentSerialization(
            [Values(false, true)] bool customizeEnum)
        {
            var inputEnum = InputFactory.StringEnum(
                "StatusEnum",
                [("Active", "active"), ("Inactive", "inactive")],
                isExtensible: true);
            var inputModel = InputFactory.Model("MockInputModel", properties: [
                    InputFactory.Property("status", inputEnum, isRequired: true),
                    InputFactory.Property("optionalStatus", inputEnum),
                    InputFactory.Property("statuses", InputFactory.Array(inputEnum)),
                    InputFactory.Property("statusMap", InputFactory.Dictionary(inputEnum))
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputEnums: () => [inputEnum],
                inputModels: () => [inputModel],
                compilation: customizeEnum
                    ? async () => await Helpers.GetCompilationFromDirectoryAsync("Custom")
                    : null,
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync("Previous"));

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>().Single();
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            modelProvider.EnsureBuilt();
            serializationProvider.EnsureBuilt();
            modelProvider.ProcessTypeForBackCompatibility();

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider, name => name is "DeserializeMockInputModel" or "JsonModelWriteCore"));
            var content = writer.Write().Content;
            StringAssert.DoesNotContain("ToSerialString", content);
            StringAssert.DoesNotContain(".ToStatusEnum()", content);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), content);
        }

        [TestCaseSource(nameof(ExtensibleEnumCases))]
        public async Task CanCustomizeExtensibleEnum(InputEnumType enumType)
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", enumType)
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(enumType.ValueType.Name));

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(enumType.ValueType.Name), file.Content);
        }

        private static IEnumerable<TestCaseData> ExtensibleEnumCasesFromLiteral =>
        [
            new TestCaseData(InputFactory.Literal.String("foo", name: "EnumType")),
            new TestCaseData(InputFactory.Literal.Int32(1, name: "EnumType")),
        ];

        [TestCaseSource(nameof(ExtensibleEnumCasesFromLiteral))]
        public async Task CanCustomizeLiteralExtensibleEnum(InputLiteralType literal)
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", literal)
                    ],
                usage: InputModelTypeUsage.Json);
            var parameters = $"{literal.ValueType.Name},{literal.Value}";
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputLiterals: () => [literal],
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(parameters));

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider.Fields.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(parameters), file.Content);
        }

        [Test]
        public async Task CanReplaceSerializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var methods = serializationProvider!.Methods;
            Assert.AreEqual(9, methods.Count);

            // validate the serialization method doesn't exist in the serialization provider
            Assert.IsNull(methods.FirstOrDefault(m => m.Signature.Name == "JsonModelWriteCore"));

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanReplaceWriteMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var methods = serializationProvider!.Methods;
            Assert.AreEqual(8, methods.Count);

            // validate the Write method doesn't exist in the serialization provider
            Assert.IsNull(methods.FirstOrDefault(m => m.Signature.Name == "Write"));
        }

        [Test]
        public async Task CanReplaceDeserializationMethod()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    InputFactory.Property("Prop2", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var methods = serializationProvider!.Methods;
            Assert.AreEqual(9, methods.Count);

            // validate the deserialization method doesn't exist in the serialization provider
            Assert.IsNull(methods.FirstOrDefault(m => m.Signature.Name == "DeserializeMockInputModel"));

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task CanCustomizePropertyUsingField(bool redefineProperty)
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("Prop1", InputPrimitiveType.String),
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(redefineProperty.ToString()));

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, modelProvider.Properties.Count);

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);

            var fullCtor = modelProvider.Constructors.Last();
            Assert.IsTrue(fullCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.AreEqual(2, fullCtor.Signature.Parameters.Count);
        }

        [Test]
        public async Task CanChangeToNonNullableProp()
        {
            var inputModel = InputFactory.Model("Model", properties: [
                    InputFactory.Property("Prop1", new InputNullableType(InputPrimitiveType.String))
                    ],
                usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var deserializationMethod = serializationProvider!.Methods.Where(m => m.Signature.Name.StartsWith("Deserialize")).FirstOrDefault();
            Assert.IsNotNull(deserializationMethod);

            var deserializationStatements = deserializationMethod!.BodyStatements;

            Assert.IsTrue(deserializationStatements!.ToDisplayString().Contains(
                "if ((prop.Value.ValueKind == global::System.Text.Json.JsonValueKind.Null))"));
            // since the customized property is non-nullable, the assignment to null should not be present
            Assert.IsFalse(deserializationStatements!.ToDisplayString().Contains("prop1 = null;"));
        }

        [Test]
        public async Task CanChangeListOfEnumPropToListOfExtensibleEnum()
        {
            var inputModel = InputFactory.Model("Model", properties: [
                    InputFactory.Property("Prop1", InputFactory.Array(InputFactory.StringEnum(
                        "MyEnum",
                        [("foo", "bar")],
                        usage: InputModelTypeUsage.Input)))
                    ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanChangePropertyNameAndRedefineOriginal()
        {
            var inputModel = InputFactory.Model("mockInputModel", properties: [
                    InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String))
                ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => new[] { inputModel },
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task CanPreserveArrayEncodingForCustomizedProperty()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String), encode: ArrayKnownEncoding.CommaDelimited)
            };

            var inputModel = InputFactory.Model("Model", properties: props, usage: InputModelTypeUsage.Json);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(
                serializationProvider!,
                name => name == "DeserializeModel" || name == "JsonModelWriteCore"));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // A hand-authored base that does not take part in MRW serialization must not widen the
        // return type of the generated *Core methods. Doing so makes derived overrides covariant,
        // which fails to compile on runtimes without covariant return support (e.g. netstandard2.0).
        [Test]
        public async Task JsonModelCreateCoreIgnoresNonMrwCustomBase()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json,
                properties: [InputFactory.Property("Prop1", InputPrimitiveType.String)]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = (ModelProvider)mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            Assert.AreEqual("PlainBase", modelProvider.BaseType?.Name);

            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);

            foreach (var methodName in new[] { "JsonModelCreateCore", "PersistableModelCreateCore" })
            {
                var method = serializationProvider.Methods.Single(m => m.Signature.Name == methodName);
                Assert.AreEqual(modelProvider.Type.Name, method.Signature.ReturnType!.Name);
                Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
                Assert.IsFalse(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override));
            }
        }

        // When the hand-authored base does take part in MRW, the generated *Core methods must match
        // the base signature so that they override rather than hide it.
        [Test]
        public async Task JsonModelCreateCoreUsesMrwCustomBase()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json,
                properties: [InputFactory.Property("Prop1", InputPrimitiveType.String)]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = (ModelProvider)mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            Assert.AreEqual("MrwBase", modelProvider.BaseType?.Name);

            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);

            foreach (var methodName in new[] { "JsonModelCreateCore", "PersistableModelCreateCore" })
            {
                var method = serializationProvider.Methods.Single(m => m.Signature.Name == methodName);
                Assert.AreEqual("MrwBase", method.Signature.ReturnType!.Name);
            }
        }

        // A hand-authored base only supports being overridden when it declares a JsonModelWriteCore that is
        // protected, overridable and has the exact generated signature. Anything else must keep the generated
        // method virtual, otherwise the emitted `override` fails to compile.
        [TestCase("JsonModelWriteCoreDoesNotOverrideNonVirtualCustomBase")]
        [TestCase("JsonModelWriteCoreDoesNotOverrideSealedCustomBase")]
        [TestCase("JsonModelWriteCoreDoesNotOverrideMismatchedSignatureCustomBase")]
        [TestCase("JsonModelWriteCoreDoesNotOverridePrivateCustomBase")]
        public async Task JsonModelWriteCoreDoesNotOverrideIncompatibleCustomBase(string testName)
        {
            var writeCore = await GetJsonModelWriteCoreWithCustomBaseAsync(testName);

            Assert.IsTrue(writeCore.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
            Assert.IsFalse(writeCore.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override));
        }

        [Test]
        public async Task JsonModelWriteCoreOverridesVirtualCustomBase()
        {
            var writeCore = await GetJsonModelWriteCoreWithCustomBaseAsync(nameof(JsonModelWriteCoreOverridesVirtualCustomBase));

            Assert.IsTrue(writeCore.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override));
            Assert.IsFalse(writeCore.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        private static async Task<MethodProvider> GetJsonModelWriteCoreWithCustomBaseAsync(string testName)
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json,
                properties: [InputFactory.Property("Prop1", InputPrimitiveType.String)]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(method: testName));

            var modelProvider = (ModelProvider)mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            return serializationProvider.Methods.Single(m => m.Signature.Name == "JsonModelWriteCore");
        }
    }
}
