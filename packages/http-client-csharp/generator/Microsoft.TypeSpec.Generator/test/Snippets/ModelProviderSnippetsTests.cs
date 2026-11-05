// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Snippets
{
    public class ModelProviderSnippetsTests
    {
        public ModelProviderSnippetsTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void GetPropertyExpression_SingleProperty()
        {
            var model = InputFactory.Model("TestModel", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [model]);
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model);
            var modelVariable = new VariableExpression(modelProvider!.Type, "testModel");

            var result = modelProvider.GetPropertyExpression(modelVariable, ["name"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Name", writer.ToString(false));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GetPropertyExpression_CanPreferInputNameAcrossModelHierarchy(bool inherited)
        {
            var matching = InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "payloadName");
            var collision = InputFactory.Property("other", InputPrimitiveType.String, isHttpMetadata: true, wireName: "name");
            var baseModel = InputFactory.Model("BaseModel", properties: inherited ? [matching] : []);
            var model = InputFactory.Model("TestModel", baseModel: inherited ? baseModel : null,
                properties: inherited ? [collision] : [collision, matching]);
            MockHelpers.LoadMockGenerator(inputModelTypes: [baseModel, model]);
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            var modelVariable = new VariableExpression(modelProvider.Type, "testModel");

            var sourceFirst = modelProvider.GetPropertyExpression(modelVariable, ["name"], out var leaf, requireInputName: true);
            var legacy = modelProvider.GetPropertyExpression(modelVariable, ["name"]);
            using CodeWriter sourceWriter = new CodeWriter();
            using CodeWriter legacyWriter = new CodeWriter();
            sourceFirst.Write(sourceWriter);
            legacy.Write(legacyWriter);
            Assert.That(sourceWriter.ToString(false), Is.EqualTo("testModel.Name"));
            Assert.That(leaf.InputProperty, Is.SameAs(matching));
            Assert.That(legacyWriter.ToString(false), Is.EqualTo("testModel.Other"), "Existing callers retain their wire-first lookup.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task GetPropertyExpression_DoesNotBindToUnrelatedHidingMember(bool field)
        {
            var inheritedName = InputFactory.Property("name", InputPrimitiveType.String, isRequired: true);
            var ancestor = InputFactory.Model("BaseModel", properties: [inheritedName]);
            var model = InputFactory.Model("TestModel", baseModel: ancestor, properties:
                [InputFactory.Property("other", InputPrimitiveType.String, isRequired: true)]);
            var member = field ? "public new string Name;" : "public new string Name { get; set; }";
            var source = CSharpSyntaxTree.ParseText($$"""
                namespace Sample.Models
                {
                    [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Field)]
                    internal sealed class CodeGenMemberAttribute : System.Attribute { public CodeGenMemberAttribute(string name) { } }
                    public partial class TestModel { [CodeGenMember("other")] {{member}} }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("HidingCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [ancestor, model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var provider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            var receiver = new VariableExpression(provider.Type, "request");
            ValueExpression expression;
            try
            {
                expression = provider.GetPropertyExpression(receiver, ["name"], out var selected, requireInputName: true);
                Assert.That(selected.InputProperty, Is.SameAs(inheritedName));
            }
            catch (InvalidOperationException exception)
            {
                // A diagnostic is safe when the inherited member cannot be bound unambiguously.
                Assert.That(exception.Message, Does.Contain("hidden").And.Contain("Name"));
                return;
            }

            var probeMember = field ? "public new string Name = \"child\";" : "public new string Name { get; set; } = \"child\";";
            var probe = CSharpSyntaxTree.ParseText($$"""
                namespace Sample.Models
                {
                    public class BaseModel { public string Name { get; set; } = "ancestor"; }
                    public class TestModel : BaseModel { {{probeMember}} }
                }
                public static class BindingProbe { public static string Read(Sample.Models.TestModel request) => {{expression.ToDisplayString()}}; }
                """);
            var compilation = CSharpCompilation.Create("BindingProbe", [probe], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
            var assembly = System.Reflection.Assembly.Load(stream.ToArray());
            var instance = Activator.CreateInstance(assembly.GetType("Sample.Models.TestModel")!)!;
            var value = assembly.GetType("BindingProbe")!.GetMethod("Read")!.Invoke(null, [instance]);
            Assert.That(value, Is.EqualTo("ancestor"), "The emitted member access must bind to the selected source property.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task GetPropertyExpression_CustomPropertyOrFieldReplacement(bool field)
        {
            var model = InputFactory.Model("TestModel", properties:
                [InputFactory.Property("other", InputPrimitiveType.String, isRequired: true)]);
            var member = field ? "public string Renamed;" : "public string Renamed { get; set; }";
            var source = CSharpSyntaxTree.ParseText($$"""
                namespace Sample.Models
                {
                    [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Field)]
                    internal sealed class CodeGenMemberAttribute : System.Attribute { public CodeGenMemberAttribute(string name) { } }
                    public partial class TestModel { [CodeGenMember("other")] {{member}} }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("ReplacementCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var provider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            var receiver = new VariableExpression(provider.Type, "request");
            if (field)
            {
                // The original wire-first property helper also cannot resolve field replacements.
                Assert.Throws<InvalidOperationException>(() => provider.GetPropertyExpression(receiver, ["other"]));
                Assert.Throws<InvalidOperationException>(() => provider.GetPropertyExpression(receiver, ["other"], out _, requireInputName: true));
            }
            else
            {
                var expression = provider.GetPropertyExpression(receiver, ["other"], out var selected, requireInputName: true);
                Assert.That(selected.Name, Is.EqualTo("Renamed"));
                Assert.That(expression.ToDisplayString(), Is.EqualTo("request.Renamed"));
            }
        }

        [TestCase(typeof(PublicMappedProperty), true)]
        [TestCase(typeof(ProtectedMappedProperty), false)]
        public void GetPropertyExpression_RespectsActualMappedGetterAccessibility(Type frameworkType, bool accessible)
        {
            var input = InputFactory.Model("MappedModel", properties:
                [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, isReadOnly: true)]);
            MockHelpers.LoadMockGenerator(inputModelTypes: [input]);
            var provider = new SystemObjectModelProvider(new Microsoft.TypeSpec.Generator.Primitives.CSharpType(frameworkType), input);
            var receiver = new VariableExpression(provider.Type, "request");
            if (!accessible)
            {
                var error = Assert.Throws<InvalidOperationException>(() =>
                    provider.GetPropertyExpression(receiver, ["name"], out _, requireInputName: true));
                Assert.That(error!.Message, Does.Contain("accessible").IgnoreCase);
            }
            else
            {
                var expression = provider.GetPropertyExpression(receiver, ["name"], out _, requireInputName: true);
                Assert.That(expression.ToDisplayString(), Is.EqualTo("request.Name"));
            }
        }

        public class PublicMappedProperty { public string Name { get; } = string.Empty; }
        public class ProtectedMappedProperty { protected string Name { get; } = string.Empty; }

        [Test]
        public async Task GetPropertyExpression_UsesExplicitReplacementOfExternalBaseProperty()
        {
            var inputSource = InputFactory.Property("source", InputPrimitiveType.String, isRequired: true);
            var ancestor = InputFactory.Model("ExternalBase", properties: [inputSource],
                external: new InputExternalTypeMetadata("System.Exception", package: null, minVersion: null));
            var model = InputFactory.Model("TestModel", baseModel: ancestor, properties: []);
            var source = CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    [System.AttributeUsage(System.AttributeTargets.Property)]
                    internal sealed class CodeGenMemberAttribute : System.Attribute { public CodeGenMemberAttribute(string name) { } }
                    public partial class TestModel { [CodeGenMember("source")] public string RenamedSource { get; set; } }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("ExternalReplacementCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [ancestor, model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var baseProvider = factory.CreateModel(ancestor)!;
            var provider = factory.CreateModel(model)!;
            Assert.That(provider.BaseModelProvider, Is.SameAs(baseProvider));
            Assert.That(provider.CanonicalView.Properties.Single(property => property.Name == "RenamedSource").InputProperty, Is.SameAs(inputSource));
            Assert.That(baseProvider.CanonicalView.Properties.Single(property => property.Name == "Source").InputProperty, Is.SameAs(inputSource));
            var expression = provider.GetPropertyExpression(new VariableExpression(provider.Type, "request"), ["source"],
                out var selected, requireInputName: true);
            Assert.That(expression.ToDisplayString(), Is.EqualTo("request.RenamedSource"));
            Assert.That(selected.Name, Is.EqualTo("RenamedSource"));
            var probe = CSharpSyntaxTree.ParseText($$"""
                public class TestModel : System.Exception
                {
                    public TestModel() { Source = "ancestor"; }
                    public string RenamedSource { get; set; } = "replacement";
                }
                public static class ExternalBindingProbe { public static string Read(TestModel request) => {{expression.ToDisplayString()}}; }
                """);
            var compilation = CSharpCompilation.Create("ExternalBindingProbe", [probe], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
            var assembly = System.Reflection.Assembly.Load(stream.ToArray());
            var instance = Activator.CreateInstance(assembly.GetType("TestModel")!)!;
            var value = assembly.GetType("ExternalBindingProbe")!.GetMethod("Read")!.Invoke(null, [instance]);
            Assert.That(value, Is.EqualTo("replacement"), "The explicit replacement must bind instead of the external base property.");
        }

        [TestCase("private", false)]
        [TestCase("protected", false)]
        [TestCase("internal", true)]
        [TestCase("protected internal", true)]
        public async Task GetPropertyExpression_RespectsCustomGetterAccessibility(string getterAccessibility, bool accessible)
        {
            var model = InputFactory.Model("TestModel", properties:
                [InputFactory.Property("other", InputPrimitiveType.String, isRequired: true)]);
            var source = CSharpSyntaxTree.ParseText($$"""
                namespace Sample.Models
                {
                    [System.AttributeUsage(System.AttributeTargets.Property)]
                    internal sealed class CodeGenMemberAttribute : System.Attribute { public CodeGenMemberAttribute(string name) { } }
                    public partial class TestModel { [CodeGenMember("other")] public string Renamed { {{getterAccessibility}} get; set; } }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("GetterCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(customization.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var provider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            var receiver = new VariableExpression(provider.Type, "request");
            if (!accessible)
            {
                var error = Assert.Throws<InvalidOperationException>(() =>
                    provider.GetPropertyExpression(receiver, ["other"], out _, requireInputName: true));
                Assert.That(error!.Message, Does.Contain("accessible").IgnoreCase);
            }
            else
            {
                var expression = provider.GetPropertyExpression(receiver, ["other"], out _, requireInputName: true);
                Assert.That(expression.ToDisplayString(), Is.EqualTo("request.Renamed"));
            }
        }

        [Test]
        public async Task GetPropertyExpression_AllowsAnOverrideOfTheSelectedInheritedProperty()
        {
            var inheritedName = InputFactory.Property("name", InputPrimitiveType.String, isRequired: true);
            var ancestor = InputFactory.Model("BaseModel", properties: [inheritedName]);
            var model = InputFactory.Model("TestModel", baseModel: ancestor, properties: []);
            var source = CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    public partial class BaseModel { public virtual string Name { get; set; } }
                    public partial class TestModel : BaseModel { public override string Name { get; set; } }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("OverrideCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [ancestor, model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var baseProvider = factory.CreateModel(ancestor)!;
            var provider = factory.CreateModel(model)!;
            Assert.That(provider.BaseModelProvider, Is.SameAs(baseProvider), "The fixture must resolve the customized model's base.");
            var expression = provider.GetPropertyExpression(new VariableExpression(provider.Type, "request"), ["name"],
                out var selected, requireInputName: true);
            Assert.That(expression.ToDisplayString(), Is.EqualTo("request.Name"));
            Assert.That(selected.InputProperty, Is.SameAs(inheritedName));
        }

        [Test]
        public async Task GetPropertyExpression_AllowsACovariantOverrideOfTheSelectedInheritedProperty()
        {
            var inheritedValue = InputFactory.Property("value", InputPrimitiveType.Any, isRequired: true, isReadOnly: true);
            var ancestor = InputFactory.Model("BaseModel", properties: [inheritedValue]);
            var model = InputFactory.Model("TestModel", baseModel: ancestor, properties: []);
            var source = CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    public partial class BaseModel { public virtual object Value => "base"; }
                    public partial class TestModel : BaseModel { public override string Value => "derived"; }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("CovariantOverrideCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(customization.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [ancestor, model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var baseProvider = factory.CreateModel(ancestor)!;
            var provider = factory.CreateModel(model)!;
            Assert.That(provider.BaseModelProvider, Is.SameAs(baseProvider));
            var expression = provider.GetPropertyExpression(new VariableExpression(provider.Type, "request"), ["value"],
                out var selected, requireInputName: true);
            Assert.That(expression.ToDisplayString(), Is.EqualTo("request.Value"));
            Assert.That(selected.InputProperty, Is.SameAs(inheritedValue));
        }

        [Test]
        public async Task GetPropertyExpression_NestedCovariantOverridePreservesSourceMemberBinding()
        {
            var baseName = InputFactory.Property("name", InputPrimitiveType.String, isRequired: true);
            var baseOptions = InputFactory.Model("BaseOptions", properties: [baseName]);
            var derivedOptions = InputFactory.Model("DerivedOptions", baseModel: baseOptions, properties:
                [InputFactory.Property("other", InputPrimitiveType.String, isRequired: true)]);
            var ancestor = InputFactory.Model("BaseModel", properties:
                [InputFactory.Property("options", baseOptions, isRequired: true, isReadOnly: true)]);
            var model = InputFactory.Model("TestModel", baseModel: ancestor, properties: []);
            var source = CSharpSyntaxTree.ParseText("""
                namespace Sample.Models
                {
                    [System.AttributeUsage(System.AttributeTargets.Property)]
                    internal sealed class CodeGenMemberAttribute : System.Attribute { public CodeGenMemberAttribute(string name) { } }
                    public partial class BaseOptions { public string Name { get; set; } }
                    public partial class DerivedOptions : BaseOptions { [CodeGenMember("other")] public new string Name { get; set; } }
                    public partial class BaseModel { public virtual BaseOptions Options => null; }
                    public partial class TestModel : BaseModel { public override DerivedOptions Options => null; }
                }
                """);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
            var customization = CSharpCompilation.Create("NestedCovariantCustomization", [source], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(customization.GetDiagnostics().Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [baseOptions, derivedOptions, ancestor, model],
                compilation: () => Task.FromResult<Compilation>(customization));
            var factory = CodeModelGenerator.Instance.TypeFactory;
            var optionsProvider = factory.CreateModel(baseOptions)!;
            _ = factory.CreateModel(derivedOptions);
            var baseProvider = factory.CreateModel(ancestor)!;
            var provider = factory.CreateModel(model)!;
            Assert.That(provider.BaseModelProvider, Is.SameAs(baseProvider));
            var optionsProperty = baseProvider.CanonicalView.Properties.Single(property => property.Name == "Options");
            Assert.That(optionsProperty.Type.AreNamesEqual(optionsProvider.Type), Is.True);
            Assert.That(factory.CSharpTypeMap.TryGetValue(optionsProperty.Type, out var mappedOptions), Is.True,
                "A customized intermediate type must resolve without test-only changes to the type map.");
            Assert.That(mappedOptions, Is.SameAs(optionsProvider));
            var expression = provider.GetPropertyExpression(new VariableExpression(provider.Type, "request"), ["options", "name"],
                out var selected, requireInputName: true);
            Assert.That(selected.InputProperty, Is.SameAs(baseName));
            var probe = CSharpSyntaxTree.ParseText($$"""
                namespace Sample.Models
                {
                    public class BaseOptions { public string Name { get; set; } = "ancestor"; }
                    public class DerivedOptions : BaseOptions { public new string Name { get; set; } = "child"; }
                    public class BaseModel { public virtual BaseOptions Options { get; } = new BaseOptions(); }
                    public class TestModel : BaseModel { public override DerivedOptions Options { get; } = new DerivedOptions(); }
                }
                public static class BindingProbe { public static string Read(Sample.Models.TestModel request) => {{expression.ToDisplayString()}}; }
                """);
            var compilation = CSharpCompilation.Create("CovariantBindingProbe", [probe], references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join("\n", result.Diagnostics));
            var assembly = System.Reflection.Assembly.Load(stream.ToArray());
            var instance = Activator.CreateInstance(assembly.GetType("Sample.Models.TestModel")!)!;
            var value = assembly.GetType("BindingProbe")!.GetMethod("Read")!.Invoke(null, [instance]);
            Assert.That(value, Is.EqualTo("ancestor"), "The full emitted path must bind to the selected source property.");
        }

        [TestCase(false)]
        [TestCase(true)]
        public void GetPropertyExpression_DoesNotSubstituteUnrelatedWireNameForMissingInput(bool suppressInput)
        {
            var requested = InputFactory.Property("options", InputPrimitiveType.String, isRequired: true, wireName: "payloadOptions");
            var collision = InputFactory.Property("other", InputPrimitiveType.String, isHttpMetadata: true, wireName: "options");
            var model = InputFactory.Model("TestModel", properties: suppressInput ? [requested, collision] : [collision]);
            MockHelpers.LoadMockGenerator(inputModelTypes: [model]);
            if (suppressInput)
            {
                CodeModelGenerator.Instance.AddVisitor(new SuppressOptionsVisitor());
            }
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            var modelVariable = new VariableExpression(modelProvider.Type, "testModel");
            Assert.That(modelProvider.CanonicalView.Properties.Select(property => property.Name), Does.Contain("Other").And.Not.Contain("Options"));
            Assert.Throws<System.InvalidOperationException>(() =>
                modelProvider.GetPropertyExpression(modelVariable, ["options"], out _, requireInputName: true));
        }

        [Test]
        public void GetPropertyExpression_DoesNotReplaceSuppressedInputWithSameNamedAncestor()
        {
            var ancestor = InputFactory.Model("BaseModel", properties:
                [InputFactory.Property("options", InputPrimitiveType.String, isRequired: true)]);
            var model = InputFactory.Model("TestModel", baseModel: ancestor, properties:
                [InputFactory.Property("options", InputPrimitiveType.String, isRequired: true)]);
            MockHelpers.LoadMockGenerator(inputModelTypes: [ancestor, model]);
            CodeModelGenerator.Instance.AddVisitor(new SuppressOptionsVisitor());
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            var modelVariable = new VariableExpression(modelProvider.Type, "testModel");
            Assert.Throws<System.InvalidOperationException>(() =>
                modelProvider.GetPropertyExpression(modelVariable, ["options"], out _, requireInputName: true));
        }

        private sealed class SuppressOptionsVisitor : LibraryVisitor
        {
            protected internal override PropertyProvider? PreVisitProperty(InputProperty input, PropertyProvider? property)
                => input.Name == "options" && input.EnclosingType?.Name == "TestModel" ? null : property;
        }

        [Test]
        public void GetPropertyExpression_NestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: true, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");

            var result = outerModelProvider.GetPropertyExpression(modelVariable, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value", writer.ToString(false));
        }

        [Test]
        public void GetPropertyExpression_NullableNestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: false, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");

            var result = outerModelProvider.GetPropertyExpression(modelVariable, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value", writer.ToString(false));
        }

        [Test]
        public void GetPropertyExpression_MultipleNestedPropertiesWithNullable()
        {
            var deepModel = InputFactory.Model("DeepModel", properties:
            [
                InputFactory.Property("data", InputPrimitiveType.String, isRequired: true, wireName: "data")
            ]);

            var middleModel = InputFactory.Model("MiddleModel", properties:
            [
                InputFactory.Property("deep", deepModel, isRequired: false, wireName: "deep")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("middle", middleModel, isRequired: true, wireName: "middle")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [deepModel, middleModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");

            var result = outerModelProvider.GetPropertyExpression(modelVariable, ["middle", "deep", "data"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Middle?.Deep?.Data", writer.ToString(false));
        }

        [Test]
        public void SetPropertyExpression_SingleProperty()
        {
            var model = InputFactory.Model("TestModel", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [model]);
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model);
            var modelVariable = new VariableExpression(modelProvider!.Type, "testModel");
            var value = Snippet.Literal("newValue");

            var result = modelProvider.SetPropertyExpression(modelVariable, value, ["name"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Name = \"newValue\"", writer.ToString(false));
        }

        [Test]
        public void SetPropertyExpression_NestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: true, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");
            var value = Snippet.Literal("newValue");

            var result = outerModelProvider.SetPropertyExpression(modelVariable, value, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value = \"newValue\"", writer.ToString(false));
        }

        [Test]
        public void SetPropertyExpression_NullableNestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: false, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");
            var value = Snippet.Literal("newValue");

            var result = outerModelProvider.SetPropertyExpression(modelVariable, value, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value = \"newValue\"", writer.ToString(false));
        }
    }
}
