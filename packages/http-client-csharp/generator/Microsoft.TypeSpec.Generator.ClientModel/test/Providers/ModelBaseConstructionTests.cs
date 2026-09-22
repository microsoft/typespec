// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using ClientModelProvider = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;
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
}
