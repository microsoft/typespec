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
        public void ExperimentalVariantsAreSuppressedInBothHelpers()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Experimental(InputFactory.Model("cat", baseModel: model), "CAT001");
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, cat], [union]);
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            foreach (var name in new[] { "SerializePetsUnion", "DeserializePetsUnion" })
            {
                var method = serialization.Methods.Single(method => method.Signature.Name == name);
                using var writer = new CodeWriter();
                writer.WriteMethod(method);
                StringAssert.Contains("#pragma warning disable CAT001", writer.ToString(false));
            }
        }

        [Test]
        public void UnionHelperNamesDoNotCollideWithModelDeserialization()
        {
            var model = InputFactory.Model("PetsUnion");
            var cat = InputFactory.Model("cat", baseModel: model);
            var variants = new Dictionary<string, InputModelType> { ["cat"] = cat };
            var first = new InputUnionType("Pets", [cat], model, "kind", "value", variants);
            var second = new InputUnionType("Pets", [cat], model, "type", "data", variants);
            var third = new InputUnionType("PetsUnion", [cat], model, "kind", "value", variants);
            LoadUnions([model, cat], [first, second, third]);
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var deserializers = serialization.Methods.Where(method => method.Signature.Name.StartsWith("Deserialize", System.StringComparison.Ordinal))
                .Select(method => method.Signature.Name).ToArray();
            CollectionAssert.AllItemsAreUnique(deserializers);
            StringAssert.Contains("SerializePetsUnion1", DiscriminatedUnionSerialization.SerializeValue(first,
                serialization.Type, Null, Default.As<Utf8JsonWriter>(), Default.As<ModelReaderWriterOptions>()).ToDisplayString());
        }

        [Test]
        public void AUnionBaseThatIsAlsoAPayloadRemainsConcrete()
        {
            var root = InputFactory.Model("root");
            var mammal = InputFactory.Model("mammal", baseModel: root);
            var cat = InputFactory.Model("cat", baseModel: mammal);
            var outer = new InputUnionType("outer", [mammal], root, "kind", "value",
                new Dictionary<string, InputModelType> { ["mammal"] = mammal });
            var inner = new InputUnionType("inner", [cat], mammal, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([root, mammal, cat], [outer, inner]);
            var model = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(mammal)!;
            Assert.IsFalse(model.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            var serialization = model.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            StringAssert.DoesNotContain("throw", serialization.Methods.Single(method =>
                method.Signature.Name == "DeserializeMammal").BodyStatements!.ToDisplayString());
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ExternallyMappedUnionsAndBasesKeepTheirSerializationPath(bool mappedUnion)
        {
            var model = InputFactory.Model("pet",
                external: mappedUnion ? null : new InputExternalTypeMetadata("System.Object", null, null));
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = (InputUnionType)InputFactory.Union([cat], "pets",
                external: mappedUnion ? new InputExternalTypeMetadata("System.Text.Json.JsonElement", null, null) : null,
                baseModel: model, discriminatorPropertyName: "kind", envelopePropertyName: "value",
                discriminatedSubtypes: new Dictionary<string, InputModelType> { ["cat"] = cat });
            var operation = InputFactory.Operation("Echo",
                parameters: [InputFactory.BodyParameter("pet", union, isRequired: true)],
                responses: [InputFactory.OperationResponse([200], union)], httpMethod: "POST");
            var serviceMethod = InputFactory.BasicServiceMethod("Echo", operation,
                parameters: [InputFactory.MethodParameter("pet", union, location: InputRequestLocation.Body, isRequired: true)],
                response: InputFactory.ServiceMethodResponse(union, null));
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            LoadUnions([model, cat], [union], [inputClient]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(union, factory.CreateCSharpType(union)!));
            Assert.IsTrue(factory.CreateCSharpType(union)!.Equals(mappedUnion ? typeof(JsonElement) : typeof(System.BinaryData)));
            var modelProvider = factory.CreateModel(model)!;
            Assert.IsFalse(modelProvider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsFalse(modelProvider.SerializationProviders.SelectMany(provider => provider.Methods)
                .Any(method => method.Signature.Name.EndsWith("PetsUnion", System.StringComparison.Ordinal)));
            if (!mappedUnion)
            {
                var serialization = factory.CreateModel(cat)!.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
                var write = serialization.Methods.Single(method => method.Signature.Name == "JsonModelWriteCore");
                Assert.IsFalse(write.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Override));
                StringAssert.DoesNotContain("base.JsonModelWriteCore", write.BodyStatements!.ToDisplayString());
            }
            var client = factory.CreateClient(inputClient)!;
            var method = new ScmMethodProviderCollection(serviceMethod, client).Single(candidate =>
                candidate.Signature.Name == "EchoAsync" && candidate.Signature.Parameters.All(parameter => parameter.Name != "content"));
            StringAssert.DoesNotContain("SerializePetsUnion", method.BodyStatements!.ToDisplayString());
            StringAssert.DoesNotContain("DeserializePetsUnion", method.BodyStatements!.ToDisplayString());
        }

        [TestCase(true)]
        [TestCase(false)]
        public void NestedUnionHelperNamesDoNotHideInheritedDeserializers(bool reverseOrder)
        {
            var root = InputFactory.Model("root");
            var mammal = InputFactory.Model("mammal", baseModel: root);
            var cat = InputFactory.Model("cat", baseModel: mammal);
            var outer = new InputUnionType("pets", [mammal], root, "kind", "value",
                new Dictionary<string, InputModelType> { ["mammal"] = mammal });
            var inner = new InputUnionType("pets", [cat], mammal, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([root, mammal, cat], reverseOrder ? [inner, outer] : [outer, inner]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            var outerNames = factory.CreateModel(root)!.SerializationProviders.SelectMany(provider => provider.Methods)
                .Where(method => method.Signature.Name.StartsWith("Deserialize", System.StringComparison.Ordinal))
                .Select(method => method.Signature.Name).ToArray();
            var innerSerialization = factory.CreateModel(mammal)!.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var innerNames = innerSerialization.Methods
                .Where(method => method.Signature.Name.StartsWith("Deserialize", System.StringComparison.Ordinal))
                .Select(method => method.Signature.Name).ToArray();
            CollectionAssert.IsEmpty(outerNames.Intersect(innerNames));
            StringAssert.Contains("DeserializePetsUnion1",
                new TypeProviderWriter(innerSerialization).Write().Content);
        }

        [Test]
        public void ExternallyMappedVariantKeepsRawUnionRepresentation()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model,
                external: new InputExternalTypeMetadata("System.Text.Json.JsonElement", null, null));
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, cat], [union]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.IsTrue(factory.CreateCSharpType(union)!.Equals(typeof(System.BinaryData)));
            var provider = factory.CreateModel(model)!;
            Assert.IsFalse(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsFalse(provider.SerializationProviders.SelectMany(serialization => serialization.Methods)
                .Any(method => method.Signature.Name is "SerializePetsUnion" or "DeserializePetsUnion"));
        }

        [TestCase("serializePetsUnion", false)]
        [TestCase("deserializePetsUnion", false)]
        [TestCase("serializePetsUnion", true)]
        [TestCase("deserializePetsUnion", true)]
        public void UnionHelperNamesDoNotCollideWithProperties(string propertyName, bool inherited)
        {
            var parent = InputFactory.Model("parent",
                properties: inherited ? [InputFactory.Property(propertyName, InputPrimitiveType.String)] : []);
            var model = InputFactory.Model("pet", baseModel: parent,
                properties: inherited ? [] : [InputFactory.Property(propertyName, InputPrimitiveType.String)]);
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([parent, model, cat], [union]);
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            CollectionAssert.IsSubsetOf(new[] { "SerializePetsUnion1", "DeserializePetsUnion1" },
                serialization.Methods.Select(method => method.Signature.Name).ToArray());
        }

        [TestCase("serializePetsUnion")]
        [TestCase("deserializePetsUnion")]
        public void UnionHelperNamesDoNotMatchEnclosingType(string modelName)
        {
            var model = InputFactory.Model(modelName);
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, cat], [union]);
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            CollectionAssert.IsSubsetOf(new[] { "SerializePetsUnion1", "DeserializePetsUnion1" },
                serialization.Methods.Select(method => method.Signature.Name).ToArray());
        }

        [TestCase("cat", false)]
        [TestCase("intermediateCat", false)]
        [TestCase("goodCat", true)]
        [TestCase("bridgeCat", true)]
        [TestCase("rebasedCat", true)]
        [TestCase("brokenBridgeCat", false)]
        public async Task CustomizedPayloadHierarchyControlsUnionRepresentation(string variantName, bool compatible)
        {
            var model = InputFactory.Model("pet");
            var mammal = InputFactory.Model("mammal", baseModel: model);
            var otherPet = InputFactory.Model("otherPet", baseModel: model);
            var cat = InputFactory.Model(variantName, baseModel: variantName == "intermediateCat" ? mammal : model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            var container = InputFactory.Model("container", properties: [InputFactory.Property("children", InputFactory.Array(union))]);
            var generator = LoadUnions([model, mammal, otherPet, cat, container], [union]);
            generator.SetupProperty(input => input.SourceInputModel,
                new SourceInputModel(await Helpers.GetCompilationFromDirectoryAsync(), null));
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;

            var unionType = factory.CreateCSharpType(union)!;
            Assert.AreEqual(compatible, DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.AreEqual(!compatible, unionType.Equals(typeof(System.BinaryData)));
            var provider = factory.CreateModel(model)!;
            Assert.AreEqual(compatible, provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.AreEqual(compatible, provider.SerializationProviders.SelectMany(serialization => serialization.Methods)
                .Any(method => method.Signature.Name == "DeserializePetsUnion"));
            var serialization = factory.CreateModel(container)!.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var code = new TypeProviderWriter(serialization).Write().Content;
            StringAssert.Contains(compatible ? "IList<global::Sample.Models.Pet>" : "IList<global::System.BinaryData>", code);
        }

        [Test]
        public async Task UnionHelperNamesDoNotCollideWithCustomMembers()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            var generator = LoadUnions([model, cat], [union]);
            generator.SetupProperty(input => input.SourceInputModel,
                new SourceInputModel(await Helpers.GetCompilationFromDirectoryAsync(), null));
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            CollectionAssert.IsSubsetOf(new[] { "SerializePetsUnion2", "DeserializePetsUnion2" },
                serialization.Methods.Select(method => method.Signature.Name).ToArray());
        }

        [TestCase("b")]
        [TestCase("c")]
        public async Task CustomRebasedVariantsDispatchMostDerivedFirst(string variantName)
        {
            var model = InputFactory.Model("pet");
            var a = InputFactory.Model("a", baseModel: model);
            var b = InputFactory.Model(variantName, baseModel: model);
            var union = new InputUnionType("pets", [a, b], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["a"] = a, ["b"] = b });
            var generator = LoadUnions([model, a, b], [union]);
            generator.SetupProperty(input => input.SourceInputModel,
                new SourceInputModel(await Helpers.GetCompilationFromDirectoryAsync(), null));
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var code = serialization.Methods.Single(method => method.Signature.Name == "SerializePetsUnion")
                .BodyStatements!.ToDisplayString();
            const string matchA = "value is global::Sample.Models.A";
            var matchB = $"value is global::Sample.Models.{(variantName == "b" ? "B" : "C")}";
            StringAssert.Contains(matchA, code);
            StringAssert.Contains(matchB, code);
            Assert.Less(code.IndexOf(matchB, System.StringComparison.Ordinal), code.IndexOf(matchA, System.StringComparison.Ordinal));
        }

        [TestCase(true, "deserializePetsUnion")]
        [TestCase(false, "deserializePetsUnion")]
        [TestCase(true, "serializePetsUnion")]
        [TestCase(false, "serializePetsUnion")]
        public void UnionHelperNamesAvoidDescendantProperties(bool declaredVariant, string propertyName)
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var descendant = InputFactory.Model("descendant", baseModel: declaredVariant ? cat : model,
                properties: [InputFactory.Property(propertyName, InputPrimitiveType.String)]);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, cat, descendant], [union]);
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            Assert.IsTrue(serialization.Methods.Any(method => method.Signature.Name == "DeserializePetsUnion1"));
        }

        [Test]
        public async Task UnionHelperNamesAvoidDescendantCustomMembers()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            var generator = LoadUnions([model, cat], [union]);
            generator.SetupProperty(input => input.SourceInputModel,
                new SourceInputModel(await Helpers.GetCompilationFromDirectoryAsync(), null));
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            CollectionAssert.IsSubsetOf(new[] { "SerializePetsUnion2", "DeserializePetsUnion2" },
                serialization.Methods.Select(method => method.Signature.Name).ToArray());
        }

        [Test]
        public void IntermediateExternalAncestorKeepsRawUnionRepresentation()
        {
            var model = InputFactory.Model("pet");
            var mammal = InputFactory.Model("mammal", baseModel: model,
                external: new InputExternalTypeMetadata("System.Object", null, null));
            var cat = InputFactory.Model("cat", baseModel: mammal);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, mammal, cat], [union]);
            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.IsTrue(factory.CreateCSharpType(union)!.Equals(typeof(System.BinaryData)));
            var provider = factory.CreateModel(model)!;
            Assert.IsFalse(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            Assert.IsFalse(provider.SerializationProviders.SelectMany(serialization => serialization.Methods)
                .Any(method => method.Signature.Name == "DeserializePetsUnion"));
        }

        [TestCase("array")]
        [TestCase("dictionary")]
        [TestCase("nested")]
        public void DynamicUnionCollectionsKeepPatchTraversal(string shape)
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            InputType collection = shape switch
            {
                "dictionary" => InputFactory.Dictionary(union),
                "nested" => InputFactory.Array(InputFactory.Dictionary(union)),
                _ => InputFactory.Array(union)
            };
            var container = InputFactory.Model("container", isDynamicModel: true,
                properties: [InputFactory.Property("pets", collection)]);
            LoadUnions([model, cat, container], [union]);
            var serialization = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(container)!
                .SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            var code = serialization.Methods.Single(method => method.Signature.Name == "JsonModelWriteCore")
                .BodyStatements!.ToDisplayString();
            StringAssert.Contains(shape == "dictionary" ? "Patch.Contains" : "Patch.IsRemoved", code);
            StringAssert.Contains(shape == "dictionary" ? "patchContains" : "for (int i", code);
            StringAssert.Contains("SerializePetsUnion", code);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ExternalAncestorAboveUnionBaseDoesNotBreakPayloadInheritance(bool baseAsVariant)
        {
            var ancestor = InputFactory.Model("ancestor",
                external: new InputExternalTypeMetadata("System.Object", null, null));
            var model = InputFactory.Model("pet", baseModel: ancestor);
            var cat = InputFactory.Model("cat", baseModel: model);
            var variant = baseAsVariant ? model : cat;
            var union = new InputUnionType("pets", [variant], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["pet"] = variant });
            LoadUnions([ancestor, model, cat], [union]);
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.AreEqual(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(model),
                ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union));
        }

        [TestCase("response")]
        [TestCase("request")]
        [TestCase("property")]
        [TestCase("array")]
        [TestCase("dictionary")]
        [TestCase("nullable")]
        [TestCase("stream")]
        [TestCase("union")]
        public void StandaloneBaseUsesKeepConcreteJsonDeserialization(string shape)
        {
            var model = InputFactory.Model("pet", properties: [InputFactory.Property("name", InputPrimitiveType.String)]);
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            InputType directType = shape switch
            {
                "array" => InputFactory.Array(model),
                "dictionary" => InputFactory.Dictionary(model),
                "nullable" => new InputNullableType(model),
                "stream" => new InputStreamingType("JsonlStream", "Streaming.Jsonl.JsonlStream", model, ["application/jsonl"]),
                "union" => new InputUnionType("optionalPet", [model, InputPrimitiveType.String]),
                _ => model
            };
            var container = InputFactory.Model("container", properties:
                shape is "property" or "array" or "dictionary" or "nullable" or "union"
                    ? [InputFactory.Property("pet", directType)] : []);
            var responseType = shape == "request" ? null :
                shape is "property" or "array" or "dictionary" or "nullable" or "union" ? container : directType;
            var operation = InputFactory.Operation("Read",
                parameters: shape == "request" ? [InputFactory.BodyParameter("pet", model, isRequired: true)] : [],
                responses: [InputFactory.OperationResponse([200], responseType)]);
            var serviceMethod = InputFactory.BasicServiceMethod("Read", operation,
                parameters: shape == "request" ? [InputFactory.MethodParameter("pet", model, location: InputRequestLocation.Body)] : [],
                response: InputFactory.ServiceMethodResponse(responseType, null));
            var client = InputFactory.Client("TestClient", methods: [serviceMethod]);
            LoadUnions([model, cat, container], [union], [client]);
            var provider = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            Assert.IsFalse(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            var serialization = provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            StringAssert.DoesNotContain("throw", serialization.Methods.Single(method =>
                method.Signature.Name == "DeserializePet").BodyStatements!.ToDisplayString());
            Assert.IsTrue(serialization.Methods.Any(method => method.Signature.Name == "DeserializePetsUnion"));
        }

        [Test]
        public void XmlEnvelopeBaseKeepsConcreteStandaloneDeserialization()
        {
            var model = InputFactory.Model("pet",
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json | InputModelTypeUsage.Xml);
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            LoadUnions([model, cat], [union]);
            var provider = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(model)!;
            Assert.IsFalse(provider.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
            var serialization = provider.SerializationProviders.OfType<MrwSerializationTypeDefinition>().Single();
            Assert.IsTrue(serialization.Methods.Any(method => method.Signature.Name == "DeserializePetsUnion"));
            Assert.IsTrue(serialization.Methods.Any(method => method.Signature.Name == "DeserializePet" &&
                method.Signature.Parameters[0].Type.Equals(typeof(System.Xml.Linq.XElement))));
        }

        [Test]
        public void JsonLinesBytesDoNotUseRawEnvelopeWriter()
        {
            MockHelpers.LoadMockGenerator();
            var content = new JsonLinesBinaryContentDefinition();
            var constructor = content.Constructors.Single();
            Assert.AreEqual(2, constructor.Signature.Parameters.Count);
            Assert.AreEqual("false", constructor.Signature.Parameters[1].DefaultValue!.ToDisplayString());
            var method = content.Methods.Single(method => method.Signature.Name == "WriteToAsync");
            StringAssert.Contains("_writeRawData", method.BodyStatements!.ToDisplayString());
        }

        [TestCase("union")]
        [TestCase("nullable")]
        [TestCase("array")]
        [TestCase("dictionary")]
        public void JsonLinesEnvelopeUnionsKeepRawRequestAndResponseTypes(string shape)
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            InputType item = shape switch
            {
                "nullable" => new InputNullableType(union),
                "array" => InputFactory.Array(union),
                "dictionary" => InputFactory.Dictionary(union),
                _ => union
            };
            var stream = new InputStreamingType("JsonlStream", "Streaming.Jsonl.JsonlStream", item, ["application/jsonl"]);
            var operation = InputFactory.Operation("Echo",
                parameters: [InputFactory.BodyParameter("stream", stream, isRequired: true)],
                responses: [InputFactory.OperationResponse([200], stream)],
                requestMediaTypes: ["application/jsonl"], httpMethod: "POST", bufferResponse: false);
            var serviceMethod = InputFactory.BasicServiceMethod("Echo", operation,
                parameters: [InputFactory.MethodParameter("stream", stream, location: InputRequestLocation.Body, isRequired: true)],
                response: InputFactory.ServiceMethodResponse(stream, null));
            var inputClient = InputFactory.Client("TestClient", methods: [serviceMethod]);
            LoadUnions([model, cat], [union], [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient)!;
            var method = new ScmMethodProviderCollection(serviceMethod, client).Single(candidate =>
                candidate.Signature.Name == "EchoAsync" && candidate.Signature.Parameters.All(parameter => parameter.Name != "content"));
            Assert.IsTrue(method.Signature.Parameters[0].Type.Arguments[0].Equals(typeof(System.BinaryData)));
            Assert.IsTrue(method.Signature.ReturnType!.Arguments[0].Arguments[0].Equals(typeof(System.BinaryData)));
            var body = method.BodyStatements!.ToDisplayString();
            StringAssert.Contains("JsonLinesBinaryContent<global::System.BinaryData>", body);
            StringAssert.Contains("(stream, true)", body);
            StringAssert.DoesNotContain("ModelReaderWriter.Read", body);
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

        private static Mock<ScmCodeModelGenerator> LoadUnions(IReadOnlyList<InputModelType> models, IReadOnlyList<InputUnionType> unions,
            IReadOnlyList<InputClient>? clients = null)
        {
            var library = new Mock<InputLibrary>(string.Empty);
            library.SetupGet(input => input.InputNamespace).Returns(new InputNamespace { Name = "Sample", Models = models, Unions = unions, RootClients = clients ?? [] });
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
            LoadUnions([model, cat], [union]);
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(union));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(new InputNullableType(union)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Array(union)));
            Assert.IsTrue(DiscriminatedUnionSerialization.RequiresEnvelope(InputFactory.Dictionary(union)));
            Assert.IsFalse(DiscriminatedUnionSerialization.RequiresEnvelope(cat));
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
