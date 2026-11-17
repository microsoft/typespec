// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelFactories
{
    public class ModelFactoriesCustomizationTests
    {
        [TestCase(false)]
        [TestCase(true)]
        public async Task CustomConstructorDiscriminator(bool unknown)
        {
            var discriminator = InputFactory.Property("kind", InputPrimitiveType.String, isDiscriminator: true);
            var baseModel = InputFactory.Model("Base", properties:
                [discriminator, InputFactory.Property("name", InputPrimitiveType.String)],
                discriminatorProperty: discriminator);
            var derived = InputFactory.Model("Derived", properties: [], baseModel: baseModel, discriminatedKind: unknown ? "unknown" : "tool",
                modelAsStruct: false);
            Compilation? custom = null;
            var generator = await MockHelpers.LoadMockGeneratorAsync(inputModelTypes: [baseModel, derived],
                compilation: async () => custom = await Helpers.GetCompilationFromDirectoryAsync(),
                additionalMetadataReferences: [MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location)]);
            var provider = generator.Object.TypeFactory.CreateModel(derived)!;
            Assert.That(provider.CanonicalView.Constructors.Single(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal))
                .Signature.Parameters.First().Property, Is.Null, "Exercise a source-backed constructor.");
            var method = generator.Object.OutputLibrary.ModelFactory.Value.Methods.Single(method =>
                method.Signature.Name == "Derived");
            Assert.That(method.Signature.Parameters.Any(parameter => parameter.Name == "kind"), Is.EqualTo(unknown));
            Assert.That(method.BodyStatements!.ToDisplayString(), Does.Contain(unknown
                ? "kind" : "\"tool\""));

            var references = ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(BinaryData).Assembly.Location).Distinct()
                .Select(path => MetadataReference.CreateFromFile(path));
            var trees = generator.Object.OutputLibrary.TypeProviders.Select(provider =>
                CSharpSyntaxTree.ParseText(new TypeProviderWriter(provider).Write().Content));
            var compilation = CSharpCompilation.Create("CustomFactory" + Guid.NewGuid().ToString("N"),
                custom!.SyntaxTrees.Where(tree => Path.GetFileName(tree.FilePath) == "Models.cs").Concat(trees),
                references, new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            using var stream = new MemoryStream();
            var result = compilation.Emit(stream);
            Assert.That(result.Success, Is.True, string.Join(Environment.NewLine,
                result.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));
            var assembly = Assembly.Load(stream.ToArray());
            var factory = generator.Object.OutputLibrary.ModelFactory.Value;
            var factoryType = assembly.GetType(factory.Type.Namespace + "." + factory.Name)!;
            var instance = factoryType.GetMethod("Derived")!.Invoke(null,
                method.Signature.Parameters.Select(parameter => parameter.Name == "kind" ? "future_kind" : (object?)null).ToArray())!;
            Assert.That(instance.GetType().GetProperty("Kind", BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!
                .GetValue(instance), Is.EqualTo(unknown ? "future_kind" : "tool"));
        }

        [Test]
        public async Task CanReplaceModelMethod()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
               inputNamespaceName: "Sample.Namespace",
               inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String),
                            InputFactory.Property("OptionalBool", InputPrimitiveType.Boolean, isRequired: false)
                        ]),
                    InputFactory.Model(
                        "otherModel",
                        properties: [InputFactory.Property("Prop2", InputPrimitiveType.String)]),
               ],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

            // The model factory method should be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);
            Assert.AreEqual("OtherModel", modelFactoryMethods[0].Signature.Name);

            var customCodeView = modelFactory.CustomCodeView;
            Assert.IsNotNull(customCodeView);

            // The custom code view should contain the method
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("MockInputModel", customMethods[0].Signature.Name);
            Assert.IsNull(customMethods[0].BodyExpression);
            Assert.AreEqual(string.Empty, customMethods[0].BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task DoesNotReplaceMethodIfNotCustomized()
        {
            var mockGenerator = MockHelpers.LoadMockGenerator(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        // specify a different property to ensure the method is not replaced
                        properties: [InputFactory.Property("Prop2", InputPrimitiveType.String)])
                ]);
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

            // The model factory method should not be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);
        }

        private static void ValidateModelFactoryCommon(TypeProvider modelFactory)
        {
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static));
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Partial));
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Class));
        }

        [Test]
        public async Task CanChangeAccessibilityOfModelFactory()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputNamespaceName: "Sample.Namespace",
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String),
                            InputFactory.Property("OptionalBool", InputPrimitiveType.Boolean, isRequired: false)
                        ]),
                    InputFactory.Model(
                        "otherModel",
                        properties: [InputFactory.Property("Prop2", InputPrimitiveType.String)]),
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be internal
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsFalse(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);
        }

        // This test validates that the model factory method for a model is omitted if the
        // model type is customized to be internal.
        [Test]
        public async Task OmitsModelFactoryMethodIfModelTypeInternal()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String),
                            InputFactory.Property("OptionalBool", InputPrimitiveType.Boolean, isRequired: false)
                        ])
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Model factory should be omitted since there are no methods to generate
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNull(modelFactory);
        }

        // This test validates that the model factory method for a model is omitted if the
        // any of the model's serialization ctor have parameters whose type are customized to be internal.
        [Test]
        public async Task OmitsModelFactoryMethodIfParamTypeInternal()
        {
            var modelProperty = InputFactory.Property("Prop1", InputFactory.Model("otherModel"));
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            modelProperty,
                        ])
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Model factory should be omitted since there are no methods to generate
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNull(modelFactory);
        }

        // This test validates that a derived model customized to be internal does not get a
        // public model factory method just because its base model remains public.
        [Test]
        public async Task OmitsModelFactoryMethodIfDerivedModelTypeInternal()
        {
            var baseModel = InputFactory.Model(
                "baseModel",
                properties: [InputFactory.Property("BaseProp", InputPrimitiveType.String)]);
            var derivedModel = InputFactory.Model(
                "derivedModel",
                properties: [InputFactory.Property("DerivedProp", InputPrimitiveType.String)],
                baseModel: baseModel);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [baseModel, derivedModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);
            CollectionAssert.Contains(modelFactory!.Methods.Select(m => m.Signature.Name), "BaseModel");
            CollectionAssert.DoesNotContain(modelFactory.Methods.Select(m => m.Signature.Name), "DerivedModel");
        }

        [Test]
        public async Task CustomFullConstructorModelParametersRetainNamespaces()
        {
            var resource = InputFactory.Model("NetworkSubResource");
            var association = InputFactory.Model("EffectiveNetworkSecurityGroupAssociation");
            var rule = InputFactory.Model("EffectiveSecurityRule");
            var model = InputFactory.Model("EffectiveNetworkSecurityGroup", properties:
            [
                InputFactory.Property("NetworkSecurityGroup", resource),
                InputFactory.Property("Association", association),
                InputFactory.Property("EffectiveSecurityRules", InputFactory.Array(rule), isReadOnly: true),
                InputFactory.Property("TagMap", InputPrimitiveType.String)
            ]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [resource, association, rule, model],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                additionalMetadataReferences: [MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location)]);

            await new CSharpGen().ExecuteAsync();

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelProvider>()
                .Single(p => p.Name == "EffectiveNetworkSecurityGroup");
            Assert.That(modelProvider.Constructors, Does.Not.Contain(modelProvider.FullConstructor),
                "The factory must use the custom constructor, not the generated full constructor.");
            Assert.That(modelProvider.CustomCodeView!.Constructors, Has.Count.EqualTo(1));

            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ModelFactoryProvider>().Single();
            var method = modelFactory.Methods.Single(m => m.Signature.Name == model.Name);
            Assert.That(method.Signature.Parameters, Has.Count.EqualTo(4));
            Assert.That(modelFactory.CustomCodeView!.Methods.Single().Signature.Parameters, Has.Count.EqualTo(1));

            var content = new TypeProviderWriter(modelFactory).Write().Content;
            Assert.That(content, Does.Not.Contain("using ;"));
            Assert.That(content, Does.Not.Contain("global::."));
            Assert.That(content, Does.Contain("global::Sample.Models.NetworkSubResource networkSecurityGroup"));
            Assert.That(content, Does.Contain("global::Sample.Models.EffectiveNetworkSecurityGroupAssociation association"));
            Assert.That(content, Does.Contain("IEnumerable<global::Sample.Models.EffectiveSecurityRule> effectiveSecurityRules"));
            Assert.That(content, Does.Contain("ChangeTrackingList<global::Sample.Models.EffectiveSecurityRule>"));
            Assert.That(content, Does.Contain("effectiveSecurityRules.ToList(), tagMap, additionalBinaryDataProperties: null"));
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task CanCustomizeModelFullConstructor(bool extraParameters)
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
               inputModelTypes: [
                    InputFactory.Model(
                        "mockInputModel",
                        properties:
                        [
                            InputFactory.Property("Prop1", InputPrimitiveType.String, isRequired: true),
                        ])
               ],
               compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(extraParameters.ToString()),
               additionalMetadataReferences: [MetadataReference.CreateFromFile(typeof(BinaryData).Assembly.Location)]);

            var csharpGen = new CSharpGen();

            await csharpGen.ExecuteAsync();

            // Find the model factory provider
            var modelFactory = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ModelFactoryProvider);
            Assert.IsNotNull(modelFactory);

            // The model factory should be public
            Assert.IsTrue(modelFactory!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            ValidateModelFactoryCommon(modelFactory);

            // The model factory method should be replaced
            var modelFactoryMethods = modelFactory!.Methods;
            Assert.AreEqual(1, modelFactoryMethods.Count);

            var modelFactoryMethod = modelFactoryMethods[0];
            Assert.AreEqual("MockInputModel", modelFactoryMethod.Signature.Name);

            Assert.AreEqual(extraParameters ? 2 : 1, modelFactoryMethod.Signature.Parameters.Count);
            if (extraParameters)
            {
                Assert.AreEqual("data", modelFactoryMethod.Signature.Parameters[0].Name);
                Assert.AreEqual("prop1", modelFactoryMethod.Signature.Parameters[1].Name);
                Assert.IsTrue(modelFactoryMethod.BodyStatements!.ToDisplayString()
                        .Contains("return new global::Sample.Models.MockInputModel(data.ToList(), prop1, additionalData: null);"),
                    modelFactoryMethod.BodyStatements!.ToDisplayString());
            }
            else
            {
                Assert.AreEqual("prop1", modelFactoryMethod.Signature.Parameters[0].Name);
                Assert.IsTrue(modelFactoryMethod.BodyStatements!.ToDisplayString()
                        .Contains("return new global::Sample.Models.MockInputModel(prop1, additionalData: null);"),
                    modelFactoryMethod.BodyStatements!.ToDisplayString());
            }
        }
    }
}
