// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class DiscriminatedUnionSerializationTests
    {
        [TestCase("kind", "value")]
        [TestCase("type", "data")]
        public void WritesContextualEnvelopeSerialization(string discriminator, string envelope)
        {
            var model = InputFactory.Model("pet", properties: [InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)]);
            var cat = InputFactory.Model("cat", baseModel: model, properties: [InputFactory.Property("meow", InputPrimitiveType.Boolean, isRequired: true)]);
            var dog = InputFactory.Model("dog", baseModel: model, properties: [InputFactory.Property("bark", InputPrimitiveType.Boolean, isRequired: true)]);
            var union = new InputUnionType("pets", [cat, dog], model, discriminator, envelope,
                new Dictionary<string, InputModelType> { ["feline"] = cat, ["canine"] = dog });
            LoadUnions([model, cat, dog], [union]);

            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            Assert.AreEqual(factory.CreateCSharpType(model), factory.CreateCSharpType(union));
            Assert.IsNull(model.DiscriminatorProperty);
            Assert.IsNull(cat.DiscriminatorValue);
            var provider = factory.CreateModel(model)!.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            provider.Update(methods: provider.Methods.Where(method =>
                method.Signature.Name is "SerializePetsUnion" or "DeserializePetsUnion").ToArray(),
                constructors: [], implements: []);
            Assert.AreEqual(Helpers.GetExpectedFromFile($"{discriminator},{envelope}"), new TypeProviderWriter(provider).Write().Content);
        }

        [Test]
        public void EnvelopeBaseIsAbstractAndOwnsUnionMethods()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, cat], [union]);

            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            var provider = factory.CreateModel(model)!;
            Assert.IsTrue(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsFalse(factory.CreateModel(cat)!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsFalse(factory.CreateModel(InputFactory.Model("ordinary"))!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsTrue(provider.Constructors.Any(constructor =>
                constructor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected)));
            var serialization = provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            foreach (var name in new[] { "SerializePetsUnion", "DeserializePetsUnion" })
            {
                var method = serialization.Methods.Single(method => method.Signature.Name == name);
                Assert.AreEqual(MethodSignatureModifiers.Internal | MethodSignatureModifiers.Static, method.Signature.Modifiers);
                Assert.AreSame(serialization, method.EnclosingType);
            }
        }

        [Test]
        public void UnionsSharingABaseKeepSeparateSerializationMethods()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var variants = new Dictionary<string, InputModelType> { ["cat"] = cat };
            var pets = new InputUnionType("pets", [cat], model, "kind", "value", variants);
            var animals = new InputUnionType("animals", [cat], model, "type", "data", variants);
            LoadUnions([model, cat], [pets, animals]);

            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            CollectionAssert.IsSubsetOf(
                new[] { "SerializePetsUnion", "DeserializePetsUnion", "SerializeAnimalsUnion", "DeserializeAnimalsUnion" },
                serialization.Methods.Select(method => method.Signature.Name).ToArray());
            Assert.IsFalse(ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders.Any(
                provider => provider.Name.EndsWith("UnionSerialization", System.StringComparison.Ordinal)));
        }

        [Test]
        public void UnionsWithTheSameNameDoNotCollideOnTheirSharedBase()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var variants = new Dictionary<string, InputModelType> { ["cat"] = cat };
            var first = new InputUnionType("pets", [cat], model, "kind", "value", variants);
            var second = new InputUnionType("pets", [cat], model, "type", "data", variants);
            LoadUnions([model, cat], [first, second]);

            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            CollectionAssert.IsSubsetOf(
                new[] { "SerializePetsUnion", "DeserializePetsUnion", "SerializePetsUnion1", "DeserializePetsUnion1" },
                serialization.Methods.Select(method => method.Signature.Name).ToArray());
            Assert.AreNotEqual(
                DiscriminatedUnionSerialization.SerializeValue(first, serialization.Type,
                    Null, Default.As<Utf8JsonWriter>(), Default.As<ModelReaderWriterOptions>()).ToDisplayString(),
                DiscriminatedUnionSerialization.SerializeValue(second, serialization.Type,
                    Null, Default.As<Utf8JsonWriter>(), Default.As<ModelReaderWriterOptions>()).ToDisplayString());
        }

        [Test]
        public async Task BinaryDataCustomizationsKeepRawSerialization()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            var container = InputFactory.Model("container", properties:
            [
                InputFactory.Property("pet", union, isRequired: true),
                InputFactory.Property("nullablePet", new InputNullableType(union)),
                InputFactory.Property("pets", InputFactory.Array(union)),
                InputFactory.Property("lookup", InputFactory.Dictionary(union)),
                InputFactory.Property("rawPets", InputFactory.Array(union)),
                InputFactory.Property("rawLookup", InputFactory.Dictionary(union))
            ]);
            var generator = LoadUnions([model, cat, container], [union]);
            generator.SetupProperty(input => input.SourceInputModel,
                new SourceInputModel(await Helpers.GetCompilationFromDirectoryAsync(), null));
            var provider = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(container)!;
            Assert.IsTrue(provider.CanonicalView.Properties.Single(property => property.Name == "Pet").Type.Equals(typeof(System.BinaryData)));
            var serialization = provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var write = serialization.Methods.Single(method => method.Signature.Name == "JsonModelWriteCore");
            var read = serialization.Methods.Single(method => method.Signature.Name == "DeserializeContainer");
            using var writer = new CodeWriter();
            writer.WriteMethod(write);
            writer.WriteMethod(read);
            var code = writer.ToString(false);
            StringAssert.DoesNotContain("SerializePetsUnion", code);
            StringAssert.DoesNotContain("DeserializePetsUnion", code);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), code);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void EnvelopeVariantsFollowBaseAccessibility(bool rooted)
        {
            var model = InputFactory.Model("pet", access: null!);
            var cat = InputFactory.Model("cat", baseModel: model, access: null!);
            var dog = InputFactory.Model("dog", baseModel: model, access: null!);
            var unrelated = InputFactory.Model("otherPet", baseModel: model, access: null!);
            var union = new InputUnionType("pets", [cat, dog], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat, ["dog"] = dog });
            LoadUnions([model, cat, dog, unrelated], [union]);
            var providers = ScmCodeModelGenerator.Instance.OutputLibrary.TypeProviders;
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            if (rooted)
            {
                ScmCodeModelGenerator.Instance.AddTypeToKeep(factory.CreateModel(model)!);
            }

            try
            {
                ProviderReferenceMapAnalyzer.ApplyPreWriteAccessibility(providers);
                Assert.AreEqual(rooted, factory.CreateModel(cat)!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
                Assert.AreEqual(rooted, factory.CreateModel(dog)!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
                Assert.IsFalse(factory.CreateModel(unrelated)!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));
            }
            finally
            {
                ProviderReferenceMapAnalyzer.ResetPreWriteAccessibility();
            }
        }

        private static Mock<ScmCodeModelGenerator> LoadUnions(IReadOnlyList<InputModelType> models, IReadOnlyList<InputUnionType> unions)
        {
            var library = new Mock<InputLibrary>(string.Empty);
            library.SetupGet(input => input.InputNamespace).Returns(new InputNamespace { Name = "Sample", Models = models, Unions = unions });
            return MockHelpers.LoadMockGenerator(inputModels: () => models,
                createInputLibrary: () => library.Object);
        }

        [Test]
        public void OrdinaryUnionKeepsBinaryDataRepresentation()
        {
            MockHelpers.LoadMockGenerator();
            var union = new InputUnionType("pets", [InputFactory.Model("cat"), InputFactory.Model("dog")]);
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.IsTrue(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union)!.Equals(typeof(System.BinaryData)));
        }

        [Test]
        public void DetectsEnvelopesThroughContainersButNotDirectPayloads()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(new InputNullableType(union)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Array(union)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Dictionary(union)));
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(cat));
            LoadUnions([model, cat], [union]);
            var type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(model)!;
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(union, type));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(new InputNullableType(union), type.WithNullable(true)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Array(union), new CSharpType(typeof(IList<>), type)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Array(union), new CSharpType(typeof(IReadOnlyList<>), type)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Dictionary(union), new CSharpType(typeof(IDictionary<,>), typeof(string), type)));
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(union, typeof(System.BinaryData)));
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Array(union), new CSharpType(typeof(IList<>), typeof(System.BinaryData))));
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Dictionary(union), typeof(System.BinaryData)));
        }
    }
}
