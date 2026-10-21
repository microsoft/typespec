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
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
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
    public class FlatMappedBaseRegressionTests
    {
        [TestCase("value", true)]
        [TestCase("Value", true)]
        [TestCase("other", false)]
        public void CustomizedInputRetainsOneWireOwner(string originalName, bool customizesInheritedProperty)
        {
            var value = InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue");
            var child = InputFactory.Property("child", InputPrimitiveType.String, isRequired: true);
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [value, child, InputFactory.Property("other", InputPrimitiveType.Int32)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var customization = CreateCustomization(originalName);
            var generator = CreateGenerator(modelInput, customization: customization);
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            var generatedType = CompileModel(generator, model, customization);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            generatedType.GetProperty("RenamedValue")!.SetValue(instance, 42);
            if (instance is FlatMrwBase frameworkBase)
            {
                frameworkBase.Value = 99;
            }

            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = (BinaryData)persistable.GetMethod("Write")!.Invoke(instance, [options])!;
            TestContext.WriteLine(data.ToString());
            using var document = JsonDocument.Parse(data);
            Assert.Multiple(() =>
            {
                Assert.That(document.RootElement.EnumerateObject().Count(property => property.Name == "wireValue"), Is.EqualTo(1),
                    "A customization and the restored base must not both own the same wire property.");
                Assert.That(document.RootElement.GetProperty("wireValue").GetInt32(), Is.EqualTo(customizesInheritedProperty ? 42 : 99));
                Assert.That(document.RootElement.GetProperty("child").GetString(), Is.EqualTo("payload"));
                Assert.That(model.BaseType?.Name, Is.EqualTo(customizesInheritedProperty ? null : nameof(FlatMrwBase)),
                    "Only customizations claiming projected input properties should prevent restoration.");
                Assert.That(modelInput.BaseModel, Is.Null);
                Assert.That(value.EnclosingType, Is.SameAs(modelInput));
            });
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.That(generatedType.GetProperty("RenamedValue")!.GetValue(restored), Is.EqualTo(42));
        }

        [TestCase("value", true)]
        [TestCase("Value", true)]
        [TestCase("other", false)]
        public void CustomizedFieldPreventsOnlyClaimedProjection(string originalName, bool customizesInheritedProperty)
        {
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue"),
                    InputFactory.Property("other", InputPrimitiveType.Int32)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = CreateGenerator(modelInput, customization: CreateCustomization(originalName, field: true));
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(customizesInheritedProperty ? null : nameof(FlatMrwBase)));
            var customField = model.CanonicalView.Fields.Single(field => field.Name == "RenamedValue");
            Assert.That(customField.WireInfo?.SerializedName, Is.EqualTo(customizesInheritedProperty ? "wireValue" : "other"));
        }

        [TestCase(false, false, false)]
        [TestCase(false, false, true)]
        [TestCase(false, true, false)]
        [TestCase(false, true, true)]
        [TestCase(true, false, false)]
        [TestCase(true, false, true)]
        [TestCase(true, true, false)]
        [TestCase(true, true, true)]
        public void MultipartRetainsProjectedAndOwnParts(bool restoreBase, bool json, bool required)
        {
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue", isRequired: required),
                    InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.MultipartFormData |
                    (json ? InputModelTypeUsage.Json : 0));
            var generator = CreateGenerator(modelInput, restoreBase);
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(restoreBase ? nameof(FlatMrwBase) : null));
            var multipart = model.SerializationProviders.OfType<MultipartFormDataSerializationDefinition>().Single();
            var source = new TypeProviderWriter(multipart).Write().Content;
            TestContext.WriteLine(source);
            Assert.Multiple(() =>
            {
                Assert.That(source, Does.Contain("content.Add(\"wireValue\","),
                    "Restoration must not drop the inherited multipart part.");
                Assert.That(source, Does.Contain("content.Add(\"child\","));
                Assert.That(CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>()
                    .Count(invocation => invocation.Expression.ToString() == "content.Add"), Is.EqualTo(2),
                    "Inherited and model-owned parts must each be emitted exactly once.");
            });
        }

        private static Mock<ScmCodeModelGenerator> CreateGenerator(
            InputModelType modelInput,
            bool restoreBase = true,
            SyntaxTree? customization = null)
        {
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [modelInput]);
            var historical = CSharpCompilation.Create("HistoricalFlatMrwBase",
                [CSharpSyntaxTree.ParseText($"namespace Sample.Models {{ public class DerivedModel : {typeof(FlatMrwBase).FullName} {{ }} }}")],
                GetReferences(), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var current = customization is null ? null : CSharpCompilation.Create("CurrentCustomization", [customization],
                GetReferences(), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(current, historical));
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(restoreBase ? new CSharpType(typeof(FlatMrwBase)) : null);
            return generator;
        }

        private static Type CompileModel(Mock<ScmCodeModelGenerator> generator, ModelProvider model, SyntaxTree customization)
        {
            var providers = generator.Object.OutputLibrary.TypeProviders.Where(provider => provider == model ||
                provider.Name is "Argument" or "Optional" or "ChangeTrackingList" or "ChangeTrackingDictionary" or
                    "ModelSerializationExtensions" or "TypeFormatters" or "SerializationFormat" ||
                provider is ModelReaderWriterContextDefinition);
            var trees = providers.SelectMany(provider => new[] { provider }.Concat(provider.SerializationProviders))
                .Distinct().Select(provider => CSharpSyntaxTree.ParseText(
                    new TypeProviderWriter(provider).Write().Content, path: provider.Name + ".cs")).Append(customization);
            var compilation = CSharpCompilation.Create("GeneratedFlatCustomization", trees, GetReferences(),
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Disable));
            var sourceGenerators = Assembly.Load("System.ClientModel.SourceGeneration").GetTypes()
                .Where(type => type.IsDefined(typeof(GeneratorAttribute)))
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
            return Assembly.Load(assemblyStream.ToArray()).GetType("Sample.Models.DerivedModel")!;
        }

        private static MetadataReference[] GetReferences()
            => ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Append(typeof(FlatMrwBase).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path)).ToArray();

        private static SyntaxTree CreateCustomization(string originalName, bool field = false)
            => CSharpSyntaxTree.ParseText($$"""
                namespace Sample.Models
                {
                    [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Field)]
                    internal sealed class CodeGenMemberAttribute : System.Attribute
                    {
                        public CodeGenMemberAttribute(string name) { }
                    }
                    public partial class DerivedModel
                    {
                        [CodeGenMember("{{originalName}}")]
                        public int RenamedValue{{(field ? ";" : " { get; set; }")}}
                    }
                }
                """, path: "Customization.cs");
    }
}
