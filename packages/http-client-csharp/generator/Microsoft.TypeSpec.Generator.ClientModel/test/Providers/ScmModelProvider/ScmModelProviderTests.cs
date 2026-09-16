// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using ScmModel = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ScmModelProvider
{
    public class ScmModelProviderTests
    {
        private sealed class DerivedScmModelProvider : ScmModel
        {
            public DerivedScmModelProvider(InputModelType inputModel) : base(inputModel)
            {
            }
        }

        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void CanBeInherited()
        {
            var provider = new DerivedScmModelProvider(InputFactory.Model("model"));

            Assert.IsInstanceOf<ScmModel>(provider);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void OptionalNullablePropertiesTrackPresenceWithoutChangingConstructorSignatures(bool isDynamic)
        {
            var inputModel = InputFactory.Model("model", isDynamicModel: isDynamic, properties:
            [
                InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String)),
                InputFactory.Property("number", new InputNullableType(InputPrimitiveType.Int32)),
                InputFactory.Property("child", new InputNullableType(InputFactory.Model("child"))),
                InputFactory.Property("optionalText", InputPrimitiveType.String),
                InputFactory.Property("requiredText", new InputNullableType(InputPrimitiveType.String), isRequired: true)
            ]);
            var model = new ScmModel(inputModel);

            foreach (var name in new[] { "Text", "Number", "Child" })
            {
                var property = model.Properties.Single(p => p.Name == name);
                Assert.That(property.Body, Is.InstanceOf<MethodPropertyBody>());
                Assert.That(property.BackingField, Is.Not.Null);
                Assert.That(property.BackingField!.Type, Is.EqualTo(property.Type));
                Assert.That(property.BackingField.WireInfo, Is.Null);
                Assert.That(property.Body.HasSetter, Is.True);
            }
            Assert.That(model.Properties.Single(p => p.Name == "OptionalText").Body, Is.InstanceOf<AutoPropertyBody>());
            Assert.That(model.Properties.Single(p => p.Name == "RequiredText").Body, Is.InstanceOf<AutoPropertyBody>());
            Assert.That(model.FullConstructor.Signature.Parameters.Count, Is.EqualTo(6));
            Assert.That(model.FullConstructor.Signature.Parameters.Take(5).Select(p => p.Type),
                Is.EqualTo(model.Properties.Where(p => p.WireInfo != null).Select(p => p.Type)));
            Assert.That(model.Constructors.Single(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public))
                .Signature.Parameters.Select(p => p.Name), Is.EqualTo(new[] { "requiredText" }));
        }

        [Test]
        public void OptionalNullableOutputPropertyTracksPresenceWithoutAddingSetter()
        {
            var inputModel = InputFactory.Model("model", usage: InputModelTypeUsage.Output | InputModelTypeUsage.Json, properties:
            [
                InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String), isReadOnly: true)
            ]);
            var model = new ScmModel(inputModel);
            var property = model.Properties.Single();

            Assert.That(property.BackingField, Is.Not.Null);
            Assert.That(property.Body.HasSetter, Is.False);
            Assert.That(model.FullConstructor.Signature.Parameters.Count, Is.EqualTo(2));
        }

        [Test]
        public void OptionalNullablePresenceFieldsDoNotCollideWithOtherBackingFields()
        {
            var model = new ScmModel(InputFactory.Model("model", properties:
            [
                InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String)),
                InputFactory.Property("textIsDefined", new InputNullableType(InputPrimitiveType.String))
            ]));

            Assert.That(model.Fields.Select(f => f.Name), Is.Unique);
            Assert.That(model.Properties.Select(p => p.BackingField!.Type), Is.All.EqualTo(model.Properties[0].Type));
        }

        [TestCase(false)]
        [TestCase(true)]
        public void OptionalNullableBackingFieldsDoNotCollideWithAdditionalProperties(bool isDynamic)
        {
            var model = new ScmModel(InputFactory.Model("model", isDynamicModel: isDynamic,
                additionalProperties: InputPrimitiveType.String, properties:
                [
                    InputFactory.Property("additionalStringProperties", new InputNullableType(InputPrimitiveType.String)),
                    InputFactory.Property("additionalStringPropertiesIsDefined", new InputNullableType(InputPrimitiveType.String))
                ]));

            var property = model.Properties.Single(p => p.Name == "AdditionalStringProperties");
            Assert.That(property.BackingField!.Name, Is.Not.EqualTo("_additionalStringProperties"));
            Assert.That(model.Fields.Select(f => f.Name), Is.Unique);
            Assert.That(model.Fields, Does.Contain(property.BackingField));
            Assert.That(model.Properties.Single(p => p.IsAdditionalProperties).BackingField!.Type.IsDictionary, Is.True);
        }

        [Test]
        public async Task OptionalNullableFieldsDoNotHideInheritedCustomFields()
        {
            var baseModel = InputFactory.Model("baseModel");
            var middleModel = InputFactory.Model("middleModel", baseModel: baseModel);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: middleModel, properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [baseModel, middleModel, derivedModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;
            var customFields = model.BaseModelProvider!.BaseModelProvider!.CustomCodeView!.Fields;

            Assert.That(customFields.Select(f => f.Name), Is.EquivalentTo(new[] { "_text", "_textIsDefined" }));
            Assert.That(model.Fields.Select(f => f.Name).Intersect(customFields.Select(f => f.Name)), Is.Empty);
            Assert.That(ScmModel.GetNullablePropertyPresence(model.Properties.Single()), Is.Not.Null);
        }

        [TestCase("URL", "_url", "_urlIsDefined")]
        [TestCase("IPAddress", "_ipAddress", "_ipAddressIsDefined")]
        [TestCase("class", "_class", "_classIsDefined")]
        public void OptionalNullableFieldsUseVariableNames(string name, string backingName, string presenceName)
        {
            var model = new ScmModel(InputFactory.Model("model", properties:
                [InputFactory.Property(name, new InputNullableType(InputPrimitiveType.String))]));
            var property = model.Properties.Single();

            Assert.That(property.BackingField!.Name, Is.EqualTo(backingName));
            Assert.That(ScmModel.GetNullablePropertyPresence(property)!.Name, Is.EqualTo(presenceName));
        }

        [Test]
        public void OptionalNullableReadonlyStructDoesNotAddMutableFields()
        {
            var model = new ScmModel(InputFactory.Model("model", modelAsStruct: true, properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]));
            var property = model.Properties.Single();

            Assert.That(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.ReadOnly), Is.True);
            Assert.That(ScmModel.GetNullablePropertyPresence(property), Is.Null);
            Assert.That(property.BackingField, Is.Null);
            Assert.That(property.Body.HasSetter, Is.False);
            Assert.That(model.Fields.All(f => f.Modifiers.HasFlag(FieldModifiers.ReadOnly)), Is.True);
        }

        [Test]
        public void OptionalNullableBackingFieldDoesNotHideInheritedPresence()
        {
            var baseModel = InputFactory.Model("baseModel", properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            var middleModel = InputFactory.Model("middleModel", baseModel: baseModel);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: middleModel, properties:
                [InputFactory.Property("textIsDefined", new InputNullableType(InputPrimitiveType.String))]);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, middleModel, derivedModel]);
            var provider = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;
            var baseProperty = provider.BaseModelProvider!.BaseModelProvider!.Properties.Single();
            var property = provider.Properties.Single();

            Assert.That(property.BackingField!.Name, Is.Not.EqualTo(ScmModel.GetNullablePropertyPresence(baseProperty)!.Name));
            Assert.That(provider.Fields.Select(f => f.Name), Is.Unique);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void OptionalNullableOverrideSharesBasePresence(bool narrowed)
        {
            var baseModel = InputFactory.Model("baseModel", properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: baseModel, properties:
                [InputFactory.Property("text", new InputNullableType(narrowed ? InputFactory.Literal.String("value") : InputPrimitiveType.String))]);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, derivedModel]);
            var provider = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;
            var baseProperty = provider.BaseModelProvider!.Properties.Single();
            var property = provider.Properties.Single();

            Assert.That(ScmModel.GetNullablePropertyPresence(property),
                Is.SameAs(ScmModel.GetNullablePropertyPresence(baseProperty)));
            Assert.That(ScmModel.GetNullablePropertyPresence(property), Is.Not.Null);
            Assert.That(provider.Fields, Is.Empty);
            Assert.That(property.Body, Is.InstanceOf<MethodPropertyBody>());
        }

        [Test]
        public void OptionalNullableOverrideThroughIntermediateModelSharesBasePresence()
        {
            var baseModel = InputFactory.Model("baseModel", properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            var middleModel = InputFactory.Model("middleModel", baseModel: baseModel);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: middleModel, properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, middleModel, derivedModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;
            var baseProperty = model.BaseModelProvider!.BaseModelProvider!.CanonicalView.Properties.Single();
            var property = model.Properties.Single();

            Assert.That(property.Modifiers.HasFlag(MethodSignatureModifiers.Override), Is.True);
            Assert.That(ScmModel.GetNullablePropertyPresence(property), Is.Not.Null);
            Assert.That(ScmModel.GetNullablePropertyPresence(property), Is.SameAs(ScmModel.GetNullablePropertyPresence(baseProperty)));
            Assert.That(model.Fields, Is.Empty);
        }

        [Test]
        public void OptionalNullableBasePreservesStorageUsedByRequiredDerivedProperty()
        {
            var baseModel = InputFactory.Model("baseModel", properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: baseModel, properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String), isRequired: true)]);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, derivedModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;
            var baseProperty = model.BaseModelProvider!.Properties.Single();
            var property = model.Properties.Single();

            Assert.That(property.Modifiers.HasFlag(MethodSignatureModifiers.New), Is.True);
            Assert.That(property.BackingField, Is.Not.Null);
            Assert.That(baseProperty.BackingField!.Name, Is.EqualTo(property.BackingField!.Name));
            Assert.That(baseProperty.BackingField.Modifiers, Is.EqualTo(FieldModifiers.Private | FieldModifiers.Protected));
            Assert.That(model.BaseModelProvider.Fields.Select(f => f.Name), Is.Unique);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void OptionalNullableNewPropertyHasOwnPresenceAndStorage(bool baseIsNullable)
        {
            var baseModel = InputFactory.Model("baseModel", properties:
                [InputFactory.Property("text", baseIsNullable ? new InputNullableType(InputPrimitiveType.String) : InputPrimitiveType.String, isRequired: true)]);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: baseModel, properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, derivedModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;
            var property = model.Properties.Single();
            var presence = ScmModel.GetNullablePropertyPresence(property);

            Assert.That(property.Modifiers.HasFlag(MethodSignatureModifiers.New), Is.True);
            Assert.That(presence, Is.Not.Null);
            Assert.That(presence!.EnclosingType, Is.SameAs(model));
            Assert.That(property.BackingField!.EnclosingType, Is.SameAs(model));
            Assert.That(model.Fields, Does.Contain(property.BackingField));
            Assert.That(model.Fields, Does.Contain(presence));
            var setter = (MethodPropertyBody)property.Body;
            Assert.That(setter.Setter!.OfType<ExpressionStatement>()
                .Select(s => s.Expression).OfType<AssignmentExpression>().Select(a => a.Variable),
                Is.EquivalentTo(new ValueExpression[] { property.BackingField, presence }));
            Assert.That(model.Constructors, Does.Contain(model.FullConstructor));
            Assert.That(model.FullConstructor.BodyStatements!.OfType<ExpressionStatement>()
                .Select(s => s.Expression).OfType<AssignmentExpression>().Select(a => a.Variable),
                Does.Contain(property.BackingField.AsValueExpression));
        }

        [Test]
        public async Task OptionalNullableOverrideOfCustomBaseRetainsHandwrittenBehavior()
        {
            var baseModel = InputFactory.Model("baseModel", properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            var derivedModel = InputFactory.Model("derivedModel", baseModel: baseModel, properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [baseModel, derivedModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(derivedModel)!;

            Assert.That(model.BaseModelProvider!.CanonicalView.Properties.Single().EnclosingType,
                Is.SameAs(model.BaseModelProvider.CustomCodeView));
            Assert.That(model.Properties, Is.Empty);
            Assert.That(model.Fields, Is.Empty);
        }

        [Test]
        public async Task OptionalNullableCustomPropertyRetainsHandwrittenBehavior()
        {
            var inputModel = InputFactory.Model("model", properties:
                [InputFactory.Property("text", new InputNullableType(InputPrimitiveType.String))]);
            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var property = model.CanonicalView.Properties.Single();

            Assert.That(property.Name, Is.EqualTo("RenamedText"));
            Assert.That(ScmModel.GetNullablePropertyPresence(property), Is.Null);
            Assert.That(model.Fields.Select(f => f.Name), Is.EqualTo(new[] { "_additionalBinaryDataProperties" }));
            Assert.That(model.FullConstructor.Signature.Parameters.First().Name, Is.EqualTo("renamedText"));
        }

        [Test]
        public void TestSimpleDynamicModel()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestSingleDiscriminatorDynamicModel(bool validateBase)
        {
            InputModelType catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            ],
                isDynamicModel: true);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel]);
            var outputLibrary = ScmCodeModelGenerator.Instance.OutputLibrary;

            var baseModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModelProvider);

            var catModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModelProvider);
            var model = validateBase
                ? baseModelProvider
                : catModelProvider;

            Assert.IsNotNull(model);

            Assert.IsTrue(model!.IsDynamicModel);

            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            var caseName = TestContext.CurrentContext.Test.Properties.Get("caseName");
            Assert.AreEqual(Helpers.GetExpectedFromFile($"{caseName}{validateBase}"), file.Content);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestNestedDiscriminatorDynamicModel(bool discriminatedTypeIsDynamicModel)
        {
            InputModelType tigerModel = InputFactory.Model(
                "tiger",
                discriminatedKind: "tiger",
                isDynamicModel: discriminatedTypeIsDynamicModel,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ]);
            InputModelType catModel = InputFactory.Model(
                "cat",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "tiger", tigerModel } });
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel, tigerModel]);
            var outputLibrary = ScmCodeModelGenerator.Instance.OutputLibrary;

            var model = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Tiger");
            Assert.IsNotNull(model);
            Assert.AreEqual(discriminatedTypeIsDynamicModel, model!.IsDynamicModel);

            if (discriminatedTypeIsDynamicModel)
            {
                AssertJsonIgnoreAttributeOnPatchProperty(model);
            }

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            var caseName = TestContext.CurrentContext.Test.Properties.Get("caseName");
            Assert.AreEqual(Helpers.GetExpectedFromFile($"{caseName}{discriminatedTypeIsDynamicModel}"), file.Content);
        }

        [Test]
        public void TestDynamicModelWithBinaryDataAdditionalProps()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                additionalProperties: InputPrimitiveType.Any,
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            // Dynamic models with Record<unknown> (BinaryData additional properties) should generate
            // JsonPatch instead of AdditionalProperties.
            Assert.IsNotNull(model.JsonPatchProperty, "Dynamic models with Record<unknown> should generate JsonPatch");
            Assert.IsFalse(model.Properties.Any(p => p.IsAdditionalProperties),
                "Dynamic models with Record<unknown> should not generate AdditionalProperties");
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestDynamicModelWithBinaryDataAdditionalPropsBackCompat()
        {
            // Scenario: A model was previously shipped with AdditionalProperties (IDictionary<string, BinaryData>)
            // but the model has now been updated to use @dynamicModel. Both JsonPatch and AdditionalProperties
            // should be generated to maintain backward compatibility.
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                additionalProperties: InputPrimitiveType.Any,
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            // Backcompat: both JsonPatch and AdditionalProperties should be generated
            Assert.IsNotNull(model.JsonPatchProperty, "Dynamic model should generate JsonPatch");
            Assert.IsTrue(model.Properties.Any(p => p.IsAdditionalProperties),
                "Dynamic model should still generate AdditionalProperties for backcompat");
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task BackCompat_ParameterlessConstructorRestoredRemovesMockingConstructor()
        {
            // The last contract published a parameterless `protected BaseModel()`. The current generation
            // makes the discriminator required, so the abstract base's initialization constructor now takes a
            // parameter and the parameterless constructor is dropped. It is restored, and the generated
            // parameterless mocking constructor on the serialization partial is removed to avoid a duplicate.
            var derivedInputModel = InputFactory.Model(
                "derivedModel",
                discriminatedKind: "one",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)
                ]);
            var inputModel = InputFactory.Model(
                "baseModel",
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "one", derivedInputModel } });

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ScmModel>().Single(t => t.Name == "BaseModel");

            model.ProcessTypeForBackCompatibility();

            // The model gains the restored standalone parameterless constructor.
            var modelContent = new TypeProviderWriter(model).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile("Model"), modelContent);

            // The serialization partial no longer carries the parameterless mocking constructor (avoids CS0111).
            var serializationContent = new TypeProviderWriter(model.SerializationProviders.Single()).Write().Content;
            Assert.AreEqual(Helpers.GetExpectedFromFile("Serialization"), serializationContent);
        }

        [Test]
        public async Task BackCompat_AccessibleParameterlessSerializationConstructorIsPreserved()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ScmModel>().Single(t => t.Name == "MockInputModel");
            var serializationProvider = model.SerializationProviders.Single();
            var serializationConstructor = serializationProvider.Constructors
                .Single(c => c.Signature.Parameters.Count == 0);
            var originalSignature = serializationConstructor.Signature;
            ValueExpression[] fullConstructorArguments =
                [.. model.FullConstructor.Signature.Parameters.Select(_ => Snippet.Default)];
            var fullConstructorInitializer = new ConstructorInitializer(
                IsBase: false,
                fullConstructorArguments);

            // Simulate a visitor making the serialization constructor public and routing it through
            // the full constructor.
            serializationConstructor.Update(
                signature: new ConstructorSignature(
                    originalSignature.Type,
                    originalSignature.Description,
                    MethodSignatureModifiers.Public,
                    originalSignature.Parameters,
                    originalSignature.Attributes,
                    fullConstructorInitializer));

            model.ProcessTypeForBackCompatibility();

            Assert.IsFalse(model.Constructors.Any(c => c.Signature.Parameters.Count == 0),
                "An accessible parameterless constructor already exists on the serialization partial.");
            var preservedConstructor = serializationProvider.Constructors
                .Single(c => c.Signature.Parameters.Count == 0);
            Assert.AreSame(serializationConstructor, preservedConstructor);
            Assert.AreSame(fullConstructorInitializer, preservedConstructor.Signature.Initializer);
        }

        [Test]
        public async Task BackCompat_InaccessibleParameterlessSerializationConstructorIsReplaced()
        {
            var inputModel = InputFactory.Model(
                "mockInputModel",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(
                    method: nameof(BackCompat_AccessibleParameterlessSerializationConstructorIsPreserved)),
                inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ScmModel>().Single(t => t.Name == "MockInputModel");
            var serializationProvider = model.SerializationProviders.Single();
            Assert.IsTrue(serializationProvider.Constructors.Any(c =>
                c.Signature.Parameters.Count == 0
                && c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal)));

            model.ProcessTypeForBackCompatibility();

            Assert.IsFalse(serializationProvider.Constructors.Any(c => c.Signature.Parameters.Count == 0));
            Assert.IsTrue(model.Constructors.Any(c =>
                c.Signature.Parameters.Count == 0
                && c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)));
        }

        [Test]
        public async Task BackCompat_StructParameterlessConstructorNotMovedFromSerialization()
        {
            // A struct always exposes a public parameterless constructor via its serialization (mocking)
            // constructor, so the last contract's parameterless constructor is already present. It must not
            // be moved onto the model partial, which would be pointless churn with no public API change.
            var inputModel = InputFactory.Model(
                "structModel",
                modelAsStruct: true,
                properties:
                [
                    InputFactory.Property("prop", InputPrimitiveType.String, isRequired: true)
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [inputModel]);

            var model = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .OfType<ScmModel>().Single(t => t.Name == "StructModel");

            model.ProcessTypeForBackCompatibility();

            Assert.IsFalse(model.Constructors.Any(c => c.Signature.Parameters.Count == 0),
                "Struct model must not gain a parameterless constructor on the model partial.");
            Assert.IsTrue(model.SerializationProviders.Single().Constructors.Any(c => c.Signature.Parameters.Count == 0),
                "Struct serialization partial must retain its parameterless constructor.");
        }

        [Test]
        public void TestDynamicModelWithUnionAdditionalProps()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                additionalProperties: new InputUnionType("union", [InputPrimitiveType.String, InputPrimitiveType.Float64]),
                properties:
                [
                    InputFactory.Property("p1", InputPrimitiveType.String, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDynamicModelWithPropagators()
        {
            var inputModel = InputFactory.Model(
                "dynamicModel",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("p1",
                        InputFactory.Model(
                            "anotherDynamic",
                            isDynamicModel: true,
                            properties:
                            [
                                InputFactory.Property("a1", InputPrimitiveType.String, isRequired: true)
                            ]))
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDiscriminatedDynamicBaseModel()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("barks", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel }, { "dog", dogModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dogModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(baseModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDiscriminatedDynamicDerivedModel()
        {
            var catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("barks", InputPrimitiveType.Boolean, isRequired: true)
            ]);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                properties:
                [
                    InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", catModel }, { "dog", dogModel } });

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dogModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestDynamicDerivedModel()
        {
            var catModel = InputFactory.Model("cat", properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ], isDynamicModel: true);
            var baseModel = InputFactory.Model(
                "pet",
                isDynamicModel: true,
                derivedModels: [catModel]);

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestStructDynamicModel()
        {
            var catModel = InputFactory.Model("cat", isDynamicModel: true, modelAsStruct: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestCustomStructDynamicModel()
        {
            var catModel = InputFactory.Model("cat", isDynamicModel: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var writer = new TypeProviderWriter(model);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task TestDynamicModelWithCustomFullConstructor()
        {
            var catModel = InputFactory.Model("cat", isDynamicModel: true, properties:
            [
                InputFactory.Property("meows", InputPrimitiveType.Boolean, isRequired: true)
            ]);

            await MockHelpers.LoadMockGeneratorAsync(
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(),
                inputModels: () => [catModel]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(catModel) as ScmModel;

            Assert.IsNotNull(model);
            Assert.IsTrue(model!.IsDynamicModel);
            AssertJsonIgnoreAttributeOnPatchProperty(model);

            var customCtor = model.CustomCodeView?.Constructors.FirstOrDefault(c => c.Signature.Parameters.Count > 0);
            Assert.IsNotNull(customCtor);

            var patchParam = customCtor!.Signature.Parameters.FirstOrDefault(p => p.Name == "patch");
            Assert.IsNotNull(patchParam);
            Assert.IsTrue(patchParam!.IsIn);
        }

        [Test]
        public void TestDynamicModelInheritsFromNonDiscriminatedBase()
        {
            var baseModel = InputFactory.Model(
                "animal",
                isDynamicModel: false,
                properties:
                [
                    InputFactory.Property("species", InputPrimitiveType.String, isRequired: true)
                ]);

            var dynamicDerivedModel = InputFactory.Model(
                "dog",
                isDynamicModel: true,
                baseModel: baseModel,
                properties:
                [
                    InputFactory.Property("barks", InputPrimitiveType.Boolean, isRequired: true)
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [baseModel, dynamicDerivedModel]);
            var outputLibrary = ScmCodeModelGenerator.Instance.OutputLibrary;

            // Verify that the base model is NOT marked as dynamic
            var baseModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Animal");
            Assert.IsNotNull(baseModelProvider);
            Assert.IsFalse(baseModelProvider!.IsDynamicModel, "Non-discriminated base model should NOT be marked as dynamic");

            // Verify that the derived model IS marked as dynamic
            var derivedModelProvider = outputLibrary.TypeProviders.OfType<ScmModel>()
                .FirstOrDefault(t => t.Name == "Dog");
            Assert.IsNotNull(derivedModelProvider);
            Assert.IsTrue(derivedModelProvider!.IsDynamicModel, "Derived model should be marked as dynamic");

            AssertJsonIgnoreAttributeOnPatchProperty(derivedModelProvider);

            var writer = new TypeProviderWriter(derivedModelProvider);
            var file = writer.Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        private void AssertJsonIgnoreAttributeOnPatchProperty(ScmModel model)
        {
            var patchProperty = model.JsonPatchProperty;

            // JsonPatch property may be null if:
            // 1. The model only has additional properties without full dynamic model support
            // 2. The model inherits the property from a base class
            if (patchProperty == null)
            {
                return;
            }

            var jsonIgnoreAttribute = patchProperty.Attributes.FirstOrDefault(a => a.Type.Equals(typeof(JsonIgnoreAttribute)));
            Assert.IsNotNull(jsonIgnoreAttribute, "JsonPatch property should have JsonIgnore attribute");
        }

        [Test]
        public void TestMultipartFormDataModel_SingleRequiredFile()
        {
            var inputModel = MultipartModel(
                "MultiPartRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_MultiFileOnly()
        {
            var inputModel = MultipartModel(
                "BinaryArrayPartsRequest",
                [MultiFilePartProperty("pictures")]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_OptionalFile()
        {
            var inputModel = MultipartModel(
                "OptionalFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("optionalFile", isRequired: false),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_MultipleFiles()
        {
            var inputModel = MultipartModel(
                "DualFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("primaryFile"),
                    FilePartProperty("secondaryFile", isRequired: false),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_WithRequiredFilename_EmitsAugmentedOverloads()
        {
            // Required filename triggers the string/Stream/BinaryData augmented overloads.
            var filename = InputFactory.Property("filename", InputPrimitiveType.String, isRequired: true);
            var inputModel = MultipartModel(
                "FileNamedRequest",
                [FilePartProperty("file", filename: filename)]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestMultipartFormDataModel_MixedJsonAndMultipartUsage()
        {
            var inputModel = MultipartModel(
                "MixedUsageRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;
            var file = new TypeProviderWriter(model).Write();

            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestModelWithOptionalFile_DoesNotGenerateDuplicateConstructors()
        {
            var inputModel = MultipartModel(
                "MixedOptionalFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage", isRequired: false),
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json | InputModelTypeUsage.MultipartFormData);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            AssertNoDuplicateConstructors(model);
        }

        [Test]
        public void TestMultipartFormDataModel_OptionalFile_DoesNotGenerateDuplicateConstructors()
        {
            var inputModel = MultipartModel(
                "OptionalFileOnlyRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("optionalFile", isRequired: false),
                ]);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            AssertNoDuplicateConstructors(model);
        }

        [TestCase("Stream")]
        [TestCase("BinaryData")]
        public async Task TestMultipartFormDataModel_CustomizedFileType_DoesNotGenerateFileConstructors(string customType)
        {
            var inputModel = MultipartModel(
                "CustomizedFileRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(customType));

            var model = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ScmModel>().Single(t => t.Name == "CustomizedFileRequest");
            var file = new TypeProviderWriter(model).Write();

            Assert.IsFalse(
                file.Content.Contains("FileBinaryContent"),
                $"Customized file property should not produce FileBinaryContent constructors.\n{file.Content}");
        }

        [Test]
        public async Task TestMultipartFormDataModel_LastContractFileType_KeepsFileBinaryContentFrameworkType()
        {
            // The last contract already ships `public FileBinaryContent ProfileImage { get; }`. The
            // back-compat property type preservation must recognize the symbol-backed
            // `System.ClientModel.FileBinaryContent` as the same type as the generated framework type,
            // otherwise the model loses its convenience constructors and [Experimental] attributes.
            var inputModel = MultipartModel(
                "MultiPartRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var model = mockGenerator.Object.OutputLibrary.TypeProviders.OfType<ScmModel>().Single(t => t.Name == "MultiPartRequest");

            var profileImage = model.Properties.Single(p => p.Name == "ProfileImage");
            Assert.IsTrue(profileImage.Type.IsFrameworkType, "The file property must remain the FileBinaryContent framework type.");
            Assert.IsTrue(ScmModel.IsFileBinaryContentType(profileImage.Type));

            var file = new TypeProviderWriter(model).Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void TestFileBinaryContentConstructor_WithoutMultipartUsage_HasExperimentalAttribute()
        {
            var inputModel = MultipartModel(
                "PluginMultipartRequest",
                [
                    NonFilePartProperty("id", InputPrimitiveType.String),
                    FilePartProperty("profileImage"),
                ],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Json);

            MockHelpers.LoadMockGenerator(inputModels: () => [inputModel]);
            var model = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            var fileConstructors = model.Constructors
                .Where(c => c.Signature.Parameters.Any(p => ScmModel.IsFileBinaryContentType(p.Type)))
                .ToList();
            Assert.IsNotEmpty(fileConstructors, "Expected a constructor taking a FileBinaryContent parameter.");

            foreach (var constructor in fileConstructors)
            {
                if (constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal))
                {
                    Assert.IsNotEmpty(
                        constructor.Suppressions,
                        "Internal constructor with FileBinaryContent parameter should suppress the experimental diagnostic.");
                }
                else
                {
                    Assert.IsTrue(
                        constructor.Signature.Attributes.Any(a => a.Type.Equals(typeof(ExperimentalAttribute))),
                        "Public constructor with FileBinaryContent parameter should have the experimental attribute.");
                }
            }
        }

        private static void AssertNoDuplicateConstructors(ScmModel model)
        {
            var signatures = model.Constructors
                .Select(c => $"{c.Signature.Modifiers}({string.Join(",", c.Signature.Parameters.Select(p => p.Type.ToString()))})")
                .ToList();
            var duplicates = signatures
                .GroupBy(s => s)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            Assert.IsEmpty(
                duplicates,
                $"Model '{model.Name}' has duplicate constructor signatures: {string.Join(", ", duplicates)}.\nAll signatures: {string.Join("; ", signatures)}");
        }

        private static InputModelProperty FilePartProperty(string name, bool isRequired = true, InputModelProperty? filename = null)
            => InputFactory.Property(
                name,
                InputFactory.FileType(),
                isRequired: isRequired,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true, filename: filename)));

        private static InputModelProperty MultiFilePartProperty(string name)
            => InputFactory.Property(
                name,
                InputFactory.Array(InputFactory.FileType()),
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: true, isMulti: true)));

        private static InputModelProperty NonFilePartProperty(string name, InputType type)
            => InputFactory.Property(
                name,
                type,
                isRequired: true,
                serializationOptions: InputFactory.Serialization.Options(
                    multipart: InputFactory.Serialization.Multipart(name, isFilePart: false, defaultContentTypes: ["text/plain"])));

        private static InputModelType MultipartModel(
            string name,
            IEnumerable<InputModelProperty> properties,
            InputModelTypeUsage usage = InputModelTypeUsage.Input | InputModelTypeUsage.MultipartFormData)
            => InputFactory.Model(name, usage: usage, properties: properties);

    }
}
