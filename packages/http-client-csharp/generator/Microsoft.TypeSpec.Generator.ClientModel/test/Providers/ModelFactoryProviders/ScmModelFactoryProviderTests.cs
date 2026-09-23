// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#pragma warning disable SCME0004 // FileBinaryContent is evaluation-only.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ModelFactoryProviders
{
    public class ScmModelFactoryProviderTests
    {
        [Test]
        public void ExperimentalExternalTypesOnlyContributeReferenceSuppressions()
        {
            var externalModel = InputFactory.Experimental(
                InputFactory.Model("ForeignPatch", properties: [],
                    external: new InputExternalTypeMetadata("System.ClientModel.Primitives.JsonPatch", null, null)),
                "SCME0001");
            var externalEnum = InputFactory.Experimental(
                InputFactory.StringEnum("ForeignStatus", [("OK", "OK")],
                    external: new InputExternalTypeMetadata("System.Net.HttpStatusCode", null, null)),
                "EXTERNAL_ENUM");
            var input = InputFactory.Model("Payload", properties: [InputFactory.Property("patch", externalModel)]);
            MockHelpers.LoadMockGenerator(inputModels: () => [externalModel, input], inputEnums: () => [externalEnum]);
            var generator = ScmCodeModelGenerator.Instance;
            var model = generator.TypeFactory.CreateModel(input)!;
            var factory = generator.TypeFactory.CreateModelFactory([externalModel, input]);

            Assert.IsInstanceOf<SystemObjectModelProvider>(generator.TypeFactory.CreateModel(externalModel));
            Assert.IsNull(generator.TypeFactory.CreateEnum(externalEnum));
            Assert.IsFalse(generator.OutputLibrary.TypeProviders.Any(p => p is SystemObjectModelProvider || p.Name == "ForeignStatus"));
            Assert.AreEqual("Payload", factory.Methods.Single().Signature.Name);
            Assert.IsFalse(model.Attributes.Any(a => a.Type.Equals(typeof(ExperimentalAttribute))));
            Assert.IsFalse(factory.Methods.Single().Signature.Attributes.Any(a => a.Type.Equals(typeof(ExperimentalAttribute))));
            Assert.IsTrue(model.DisabledFileWarnings.Any(s => s.Code.ToDisplayString() == Snippet.Literal("SCME0001").ToDisplayString()));

            var references = AppDomain.CurrentDomain.GetAssemblies()
                .Where(a => !a.IsDynamic && !string.IsNullOrEmpty(a.Location))
                .Select(a => MetadataReference.CreateFromFile(a.Location));
            var compilation = CSharpCompilation.Create(
                "ExperimentalExternalReferences",
                new TypeProvider[] { model, factory, new ArgumentDefinition() }
                    .Select(p => CSharpSyntaxTree.ParseText(new TypeProviderWriter(p).Write().Content)),
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, generalDiagnosticOption: ReportDiagnostic.Error));
            Assert.IsEmpty(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).Select(d => d.ToString()));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ExperimentalLiteralEnumMembersCompileInModelsAndFactories(bool extensible)
        {
            var choice = InputFactory.StringEnum("Choice", [("One", "one"), ("Two", "two")], isExtensible: extensible);
            InputFactory.Experimental(choice.Values[0], "SAMPLE_MEMBER");
            InputFactory.Experimental(choice.Values[1], "OTHER_MEMBER");
            var input = InputFactory.Model("Payload", properties:
                [InputFactory.Property("kind", choice.Values[0], isRequired: true)]);
            Compilation? customCompilation = null;
            await MockHelpers.LoadMockGeneratorAsync(
                inputEnums: () => [choice], inputModels: () => [input],
                compilation: extensible ? null : async () => customCompilation = await Helpers.GetCompilationFromDirectoryAsync());
            var generator = ScmCodeModelGenerator.Instance;
            var model = generator.TypeFactory.CreateModel(input)!;
            var factory = generator.TypeFactory.CreateModelFactory([input]);
            var enumProvider = generator.TypeFactory.CreateEnum(choice)!;

            Assert.IsFalse(enumProvider.Attributes.Any(a => a.Type.Equals(typeof(ExperimentalAttribute))));
            foreach (var provider in new TypeProvider[] { model, factory })
            {
                CollectionAssert.AreEqual(
                    new[] { Snippet.Literal("SAMPLE_MEMBER").ToDisplayString() },
                    provider.DisabledFileWarnings.Select(s => s.Code.ToDisplayString()));
            }
            var references = AppDomain.CurrentDomain.GetAssemblies()
                .Where(a => !a.IsDynamic && !string.IsNullOrEmpty(a.Location))
                .Select(a => MetadataReference.CreateFromFile(a.Location));
            var compilation = CSharpCompilation.Create(
                "ExperimentalLiteralEnum",
                new TypeProvider[] { model, factory, new ArgumentDefinition() }
                    .Select(p => CSharpSyntaxTree.ParseText(new TypeProviderWriter(p).Write().Content))
                    .Concat(extensible
                        ? new[] { CSharpSyntaxTree.ParseText(new TypeProviderWriter(enumProvider).Write().Content) }
                        : customCompilation!.SyntaxTrees.Where(t => t.FilePath.EndsWith("CustomTypes.cs", StringComparison.Ordinal))),
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, generalDiagnosticOption: ReportDiagnostic.Error));
            Assert.IsEmpty(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).Select(d => d.ToString()));
            if (!extensible)
            {
                StringAssert.Contains("Choice.One", factory.Methods.Single().BodyStatements!.ToDisplayString());
            }
        }

        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(true, true)]
        public void SourceExperimentalMultipartDeclarationsCompile(bool experimentalModel, bool experimentalProperty)
        {
            var property = FilePartProperty("file");
            if (experimentalProperty)
            {
                InputFactory.Experimental(property, "PROPERTY001");
            }
            var input = MultipartModel("Payload", [property]);
            if (experimentalModel)
            {
                InputFactory.Experimental(input, "MODEL001");
            }
            MockHelpers.LoadMockGenerator(inputModels: () => [input]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(input)!;
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([input]);
            var references = AppDomain.CurrentDomain.GetAssemblies()
                .Where(a => !a.IsDynamic && !string.IsNullOrEmpty(a.Location))
                .Select(a => MetadataReference.CreateFromFile(a.Location));
            var compilation = CSharpCompilation.Create(
                "ExperimentalMultipart",
                [CSharpSyntaxTree.ParseText(new TypeProviderWriter(model).Write().Content),
                 CSharpSyntaxTree.ParseText(new TypeProviderWriter(factory).Write().Content),
                 CSharpSyntaxTree.ParseText(new TypeProviderWriter(new ArgumentDefinition()).Write().Content)],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, generalDiagnosticOption: ReportDiagnostic.Error));

            var errors = compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToArray();
            Assert.IsEmpty(errors.Select(d => d.ToString()));
            Assert.AreEqual(Snippet.Literal(experimentalModel ? "MODEL001" : "SCME0004").ToDisplayString(),
                factory.Methods.Single().Signature.Attributes.Single(a => a.Type.Equals(typeof(ExperimentalAttribute))).Arguments[0].ToDisplayString());
            Assert.AreEqual(Snippet.Literal(experimentalProperty ? "PROPERTY001" : "SCME0004").ToDisplayString(),
                model.Properties.Single(p => p.Name == "File").Attributes.Single(a => a.Type.Equals(typeof(ExperimentalAttribute))).Arguments[0].ToDisplayString());
        }

        [Test]
        public void ExperimentalModelFactoryUsesThePublicModelDiagnostic()
        {
            var input = InputFactory.Experimental(InputFactory.Model("Payload"), "MODEL001", "DEP001");
            MockHelpers.LoadMockGenerator(inputModels: () => [input]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([input]);
            var method = factory.Methods.Single(m => m.Signature.Name == "Payload");

            Assert.AreEqual(Snippet.Literal("MODEL001").ToDisplayString(),
                method.Signature.Attributes.Single(a => a.Type.Equals(typeof(ExperimentalAttribute))).Arguments[0].ToDisplayString());
        }

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestFactory_MultipartFormDataOnly_CarriesExperimentalAttribute()
        {
            var fileRequest = MultipartModel(
                "FileRequest",
                [FilePartProperty("profileImage")]);

            MockHelpers.LoadMockGenerator(inputModels: () => [fileRequest]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([fileRequest]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_MixedJsonAndMultipartUsage_CarriesExperimentalAttribute()
        {
            var mixed = MultipartModel(
                "DualUsageRequest",
                [FilePartProperty("profileImage")],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [mixed]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([mixed]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_NonMultipartModel_DoesNotCarryExperimentalAttribute()
        {
            var regular = InputFactory.Model(
                "RegularModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [regular]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([regular]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_MultipartAndRegularModels_Combined()
        {
            var fileRequest = MultipartModel(
                "FileRequest",
                [FilePartProperty("profileImage")]);
            var regular = InputFactory.Model(
                "RegularModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [fileRequest, regular]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([fileRequest, regular]);
            var actual = new TypeProviderWriter(factory).Write().Content;

            Assert.AreEqual(Helpers.GetExpectedFromFile(), actual);
        }

        [Test]
        public void TestFactory_ExperimentalAttribute_OnlyAppliedToMethodsWithFileBinaryContentParameter()
        {
            var fileRequest = InputFactory.Model(
                "FileRequest",
                properties: [InputFactory.Property("profileImage", InputFactory.FileType(), isRequired: true)]);
            var regular = InputFactory.Model(
                "RegularModel",
                properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [fileRequest, regular]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory.CreateModelFactory([fileRequest, regular]);

            var fileRequestMethod = factory.Methods.Single(m => m.Signature.Name == "FileRequest");
            var regularMethod = factory.Methods.Single(m => m.Signature.Name == "RegularModel");

            Assert.IsTrue(
                fileRequestMethod.Signature.Parameters.Any(p => p.Type.FrameworkType == typeof(FileBinaryContent)),
                "FileRequest factory method should contain a FileBinaryContent parameter.");
            Assert.IsTrue(
                fileRequestMethod.Signature.Attributes.Any(a => a.Type.FrameworkType == typeof(ExperimentalAttribute)),
                "FileRequest factory method should carry the ExperimentalAttribute because it has a FileBinaryContent parameter.");

            Assert.IsFalse(
                regularMethod.Signature.Parameters.Any(p => p.Type.FrameworkType == typeof(FileBinaryContent)),
                "RegularModel factory method should not contain a FileBinaryContent parameter.");
            Assert.IsFalse(
                regularMethod.Signature.Attributes.Any(a => a.Type.FrameworkType == typeof(ExperimentalAttribute)),
                "RegularModel factory method should not carry the ExperimentalAttribute because it has no FileBinaryContent parameter.");
        }

        private static InputModelProperty FilePartProperty(string name)
            => InputFactory.Property(
                name,
                InputFactory.FileType(),
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true)));

        private static InputModelType MultipartModel(
            string name,
            IEnumerable<InputModelProperty> properties,
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData)
            => InputFactory.Model(name, usage: usage, properties: properties);

    }
}
