// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class ConstructorViewTests
    {
        [TestCase(false, false, false)]
        [TestCase(false, true, true)]
        [TestCase(true, false, true)]
        [TestCase(true, true, false)]
        public async Task CustomizedParameterlessConstructorDoesNotCreateDuplicateAfterVisitor(bool multipart, bool outputOnly, bool suppressed)
        {
            var usage = (outputOnly ? InputModelTypeUsage.Output : InputModelTypeUsage.Input) |
                (multipart ? InputModelTypeUsage.MultipartFormData : InputModelTypeUsage.Json);
            var input = InputFactory.Model("Widget", properties: [], usage: usage);
            var customization = suppressed ? "Suppressed" : "Custom";
            Compilation? customCompilation = null;
            var generator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [input],
                compilation: async () => customCompilation = await Helpers.GetCompilationFromDirectoryAsync(customization));
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            model.EnsureBuilt();
            var serialization = model.SerializationProviders.Single(provider => multipart
                ? provider is MultipartFormDataSerializationDefinition
                : provider is MrwSerializationTypeDefinition);
            Assert.That(model.GeneratedConstructors.Any(c => c.Signature.Parameters.Count == 0), Is.True);
            Assert.That(model.Constructors.Any(c => c.Signature.Parameters.Count == 0), Is.False);

            var output = generator.Object.OutputLibrary;
            new AddConstructorParameterVisitor().VisitLibrary(output);
            CSharpGen.FilterAllCustomizedMembers(output);

            Assert.That(model.Constructors.Count(c => c.Signature.Parameters.Count == 1 &&
                c.Signature.Parameters[0].Type.FrameworkType == typeof(int)), Is.EqualTo(1));
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Concat([typeof(BinaryData).Assembly.Location, typeof(ModelReaderWriterOptions).Assembly.Location])
                .Distinct()
                .Select(path => MetadataReference.CreateFromFile(path));
            Assert.That(new TypeProviderWriter(model).Write().Content,
                Is.EqualTo(Helpers.GetExpectedFromFile($"{multipart},{outputOnly},Model")));
            Assert.That(new TypeProviderWriter(serialization).Write().Content,
                Is.EqualTo(Helpers.GetExpectedFromFile($"{multipart},Serialization")));
            var customTrees = customCompilation!.SyntaxTrees.Where(tree =>
                Path.GetFileName(tree.FilePath) is "Widget.cs" or "CodeGenSuppressAttribute.cs");
            var compilation = CSharpCompilation.Create("ConstructorViews",
                new[] { ConstructorSurface(model), ConstructorSurface(serialization) }.Concat(customTrees),
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void EffectiveConstructorsIncludeSerializationPartial(bool multipart)
        {
            var usage = InputModelTypeUsage.Input | (multipart ? InputModelTypeUsage.MultipartFormData : InputModelTypeUsage.Json);
            var input = InputFactory.Model("Widget", usage: usage,
                properties: [InputFactory.Property("value", InputPrimitiveType.String, isRequired: true)]);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [input]);
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            model.EnsureBuilt();
            var serialization = model.SerializationProviders.Single(provider => multipart
                ? provider is MultipartFormDataSerializationDefinition
                : provider is MrwSerializationTypeDefinition);
            var serializationConstructor = serialization.Constructors.Single(c => c.Signature.Parameters.Count == 0);

            Assert.That(model.CanonicalView.Constructors, Does.Not.Contain(serializationConstructor));
            Assert.That(model.EffectiveConstructors, Does.Contain(serializationConstructor));
            Assert.That(serialization.EffectiveConstructors, Is.EqualTo(model.EffectiveConstructors));
            Assert.That(serialization.CanonicalView.EffectiveConstructors, Is.EqualTo(model.EffectiveConstructors));
            var canonical = model.CanonicalView;
            Assert.That(canonical.EffectiveConstructors, Does.Contain(serializationConstructor));

            canonical.Update(constructors: []);

            Assert.That(canonical.Constructors, Is.Empty);
            Assert.That(canonical.EffectiveConstructors, Is.EqualTo(new[] { serializationConstructor }));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task VisitorCreatingParameterlessModelConstructorDoesNotDuplicateSerializationConstructor(bool multipart)
        {
            var usage = InputModelTypeUsage.Input | (multipart ? InputModelTypeUsage.MultipartFormData : InputModelTypeUsage.Json);
            var input = InputFactory.Model("Widget", usage: usage,
                properties: [InputFactory.Property("value", InputPrimitiveType.String, isRequired: true)]);
            var customCode = File.ReadAllText(Path.Combine(Helpers.GetAssetFileOrDirectoryPath(false), "Widget.cs"));
            var generator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [input],
                compilation: () => Helpers.GetCompilationFromDirectoryAsync());
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            Assert.That(model.Constructors.Any(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)), Is.False);
            model.EnsureBuilt();
            var serialization = model.SerializationProviders.Single(provider => multipart
                ? provider is MultipartFormDataSerializationDefinition
                : provider is MrwSerializationTypeDefinition);

            var output = generator.Object.OutputLibrary;
            new MakeModelConstructorParameterlessVisitor(model).VisitLibrary(output);
            CSharpGen.FilterAllCustomizedMembers(output);

            Assert.That(model.Constructors.Any(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public) &&
                c.Signature.Parameters.Count == 0), Is.True);
            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Concat([typeof(BinaryData).Assembly.Location, typeof(ModelReaderWriterOptions).Assembly.Location])
                .Distinct()
                .Select(path => MetadataReference.CreateFromFile(path));
            AssertOutput(model, serialization, multipart.ToString());
            var compilation = CSharpCompilation.Create("ConstructorViews",
                [ConstructorSurface(model), ConstructorSurface(serialization), CSharpSyntaxTree.ParseText(customCode)],
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            Assert.That(compilation.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error), Is.Empty);
        }

        private static void AssertOutput(TypeProvider model, TypeProvider serialization, string variant,
            [System.Runtime.CompilerServices.CallerMemberName] string method = "")
        {
            Assert.That(new TypeProviderWriter(model).Write().Content,
                Is.EqualTo(Helpers.GetExpectedFromFile($"{variant},Model", method)));
            Assert.That(new TypeProviderWriter(serialization).Write().Content,
                Is.EqualTo(Helpers.GetExpectedFromFile($"{variant},Serialization", method)));
        }

        private static SyntaxTree ConstructorSurface(TypeProvider provider)
        {
            var root = CSharpSyntaxTree.ParseText(new TypeProviderWriter(provider).Write().Content).GetRoot();
            var declaration = root.DescendantNodes().OfType<ClassDeclarationSyntax>().Single();
            var members = declaration.Members.Where(member => member is ConstructorDeclarationSyntax or FieldDeclarationSyntax or PropertyDeclarationSyntax);
            var updated = declaration.WithBaseList(null).WithMembers(SyntaxFactory.List(members));
            return CSharpSyntaxTree.Create((CSharpSyntaxNode)root.ReplaceNode(declaration, updated));
        }

        private sealed class MakeModelConstructorParameterlessVisitor(TypeProvider model) : LibraryVisitor
        {
            protected internal override ConstructorProvider? VisitConstructor(ConstructorProvider constructor)
            {
                if (constructor.EnclosingType == model && constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                {
                    constructor.Signature.Update(parameters: []);
                    constructor.Update(bodyStatements: MethodBodyStatement.Empty);
                }
                return constructor;
            }
        }

        private sealed class AddConstructorParameterVisitor : LibraryVisitor
        {
            protected internal override ConstructorProvider? VisitConstructor(ConstructorProvider constructor)
            {
                if (constructor.EnclosingType.Name == "Widget" && constructor.Signature.Parameters.Count == 0)
                {
                    constructor.Signature.Update(parameters: [new ParameterProvider("marker", $"", typeof(int))]);
                }
                return constructor;
            }
        }
    }
}
