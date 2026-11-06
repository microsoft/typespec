// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class UnionExtendsTests
    {
        [TestCase(true)]
        [TestCase(false)]
        public void EnvelopeRoundTripsTheConcreteVariant(bool cat)
        {
            UnionPet value = cat ? new UnionCat("Whiskers", true) : new UnionDog("Rex", false);
            var data = Serialize(value);
            using var document = JsonDocument.Parse(data);
            var envelope = document.RootElement;
            Assert.AreEqual(cat ? "cat" : "dog", envelope.GetProperty("kind").GetString());
            Assert.AreEqual(value.Name, envelope.GetProperty("value").GetProperty("name").GetString());
            Assert.IsFalse(envelope.GetProperty("value").TryGetProperty("kind", out _));
            var result = UnionPet.DeserializeUnionPetsUnion(envelope, ModelSerializationExtensions.WireOptions);
            Assert.AreEqual(value.GetType(), result.GetType());
            Assert.AreEqual(value.Name, result.Name);
            if (result is UnionCat resultCat)
            {
                Assert.IsTrue(resultCat.Meow);
            }
            else
            {
                Assert.IsFalse(((UnionDog)result).Bark);
            }
        }

        [Test]
        public void DirectPayloadUseIsNotEnveloped()
        {
            var cat = new UnionCat("Whiskers", true);
            using var document = JsonDocument.Parse(ModelReaderWriter.Write(cat));
            Assert.AreEqual("Whiskers", document.RootElement.GetProperty("name").GetString());
            Assert.IsTrue(document.RootElement.GetProperty("meow").GetBoolean());
            Assert.IsFalse(document.RootElement.TryGetProperty("kind", out _));
            Assert.IsFalse(document.RootElement.TryGetProperty("value", out _));
        }

        [Test]
        public void PropertiesCollectionsAndNullRoundTrip()
        {
            var cat = new UnionCat("Whiskers", true);
            var dog = new UnionDog("Rex", false);
            var container = new UnionPetContainer(cat, null) { AlternatePet = cat };
            container.Pets.Add(dog);
            container.Lookup.Add("best", cat);

            var data = ModelReaderWriter.Write(container);
            using var document = JsonDocument.Parse(data);
            Assert.AreEqual("cat", document.RootElement.GetProperty("pet").GetProperty("kind").GetString());
            Assert.AreEqual(JsonValueKind.Null, document.RootElement.GetProperty("nullablePet").ValueKind);
            Assert.AreEqual("dog", document.RootElement.GetProperty("pets")[0].GetProperty("kind").GetString());
            Assert.AreEqual("cat", document.RootElement.GetProperty("lookup").GetProperty("best").GetProperty("kind").GetString());
            Assert.AreEqual("feline", document.RootElement.GetProperty("alternatePet").GetProperty("type").GetString());
            Assert.IsTrue(document.RootElement.GetProperty("alternatePet").GetProperty("data").GetProperty("meow").GetBoolean());

            var result = ModelReaderWriter.Read<UnionPetContainer>(data)!;
            Assert.IsInstanceOf<UnionCat>(result.Pet);
            Assert.IsNull(result.NullablePet);
            Assert.IsInstanceOf<UnionDog>(result.Pets[0]);
            Assert.IsInstanceOf<UnionCat>(result.Lookup["best"]);
            Assert.IsInstanceOf<UnionCat>(result.AlternatePet);
        }

        [Test]
        public void UnionBaseIsAbstract()
        {
            Assert.IsTrue(typeof(UnionPet).IsAbstract);
            Assert.IsFalse(typeof(UnionCat).IsAbstract);
            Assert.IsFalse(typeof(UnionDog).IsAbstract);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void DynamicUnionCollectionsPreservePatchesAndEnvelopes(bool patched)
        {
#pragma warning disable SCME0001
            var cat = new UnionCat("Whiskers", true);
            var dog = new UnionDog("Rex", false);
            var container = new DynamicUnionPetContainer();
            container.Pets.Add(cat);
            container.Pets.Add(dog);
            container.Pets.Add(null);
            container.Lookup.Add("remove", cat);
            container.Lookup.Add("replace", cat);
            container.Lookup.Add("keep", dog);
            container.Lookup.Add("null", null);
            container.Nested.Add(new List<UnionPet> { cat, dog, null! });
            container.NestedLookup.Add(new Dictionary<string, UnionPet> { ["remove"] = cat, ["keep"] = dog, ["null"] = null! });
            container = ModelReaderWriter.Read<DynamicUnionPetContainer>(ModelReaderWriter.Write(container))!;
            if (patched)
            {
                container.Patch.Remove("$.pets[0]"u8);
                container.Patch.Remove("$.lookup.remove"u8);
                container.Patch.Set("$.lookup.replace"u8, """{"kind":"dog","value":{"name":"Patch","bark":true}}"""u8);
                container.Patch.Set("$.lookup.add"u8, """{"kind":"cat","value":{"name":"Added","meow":false}}"""u8);
                container.Patch.Remove("$.nested[0][0]"u8);
                container.Patch.Remove("$.nestedLookup[0].remove"u8);
            }

            using var document = JsonDocument.Parse(ModelReaderWriter.Write(container, ModelSerializationExtensions.WireOptions));
            var root = document.RootElement;
            var pets = root.GetProperty("pets");
            Assert.AreEqual(patched ? 2 : 3, pets.GetArrayLength());
            Assert.AreEqual(patched ? "dog" : "cat", pets[0].GetProperty("kind").GetString());
            Assert.AreEqual(patched ? "Rex" : "Whiskers", pets[0].GetProperty("value").GetProperty("name").GetString());
            Assert.AreEqual(JsonValueKind.Null, pets[pets.GetArrayLength() - 1].ValueKind);
            var lookup = root.GetProperty("lookup");
            Assert.AreEqual(!patched, lookup.TryGetProperty("remove", out _));
            Assert.AreEqual(patched ? "dog" : "cat", lookup.GetProperty("replace").GetProperty("kind").GetString());
            Assert.AreEqual("dog", lookup.GetProperty("keep").GetProperty("kind").GetString());
            Assert.AreEqual(JsonValueKind.Null, lookup.GetProperty("null").ValueKind);
            if (patched)
            {
                Assert.AreEqual("Patch", lookup.GetProperty("replace").GetProperty("value").GetProperty("name").GetString());
                Assert.AreEqual("Added", lookup.GetProperty("add").GetProperty("value").GetProperty("name").GetString());
            }
            var nested = root.GetProperty("nested")[0];
            Assert.AreEqual(patched ? 2 : 3, nested.GetArrayLength());
            Assert.AreEqual(patched ? "dog" : "cat", nested[0].GetProperty("kind").GetString());
            Assert.AreEqual(JsonValueKind.Null, nested[nested.GetArrayLength() - 1].ValueKind);
            var nestedLookup = root.GetProperty("nestedLookup")[0];
            Assert.AreEqual(!patched, nestedLookup.TryGetProperty("remove", out _));
            Assert.AreEqual("dog", nestedLookup.GetProperty("keep").GetProperty("kind").GetString());
            Assert.AreEqual(JsonValueKind.Null, nestedLookup.GetProperty("null").ValueKind);
#pragma warning restore SCME0001
        }

        [Test]
        public void DescendantPropertiesDoNotHideUnionHelpers()
        {
            var cat = new DescendantUnionCat("Whiskers")
            {
                DeserializeDescendantPetsUnion = "read",
                SerializeDescendantPetsUnion = "write"
            };
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                DescendantUnionPet.SerializeDescendantPetsUnion1(writer, cat, ModelSerializationExtensions.WireOptions);
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            var result = (DescendantUnionCat)DescendantUnionPet.DeserializeDescendantPetsUnion1(
                document.RootElement, ModelSerializationExtensions.WireOptions);
            Assert.AreEqual("read", result.DeserializeDescendantPetsUnion);
            Assert.AreEqual("write", result.SerializeDescendantPetsUnion);
        }

        [Test]
        public void UnionVariantsArePublic()
        {
            Assert.IsTrue(typeof(UnionPet).IsPublic);
            Assert.IsTrue(typeof(UnionCat).IsPublic);
            Assert.IsTrue(typeof(UnionDog).IsPublic);
        }

        [Test]
        public async Task JsonLinesPreserveRawUnionEnvelopes()
        {
            var cat = Serialize(new UnionCat("Whiskers", true));
            var dog = Serialize(new UnionDog("Rex", false));
            var response = new Mock<PipelineResponse>();
            var client = new Mock<UnionExtends> { CallBase = true };
            BinaryData? requestData = null;
            client.Setup(value => value.SendPetsAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Returns(async (BinaryContent content, RequestOptions _) =>
                {
                    using var stream = new MemoryStream();
                    await content.WriteToAsync(stream, CancellationToken.None);
                    requestData = BinaryData.FromBytes(stream.ToArray());
                    return ClientResult.FromResponse(response.Object);
                });

            await client.Object.SendPetsAsync(GetJsonLines(cat, dog));

            var expected = $"{cat}\n{dog}";
            Assert.AreEqual(expected, requestData!.ToString());
            using var responseStream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(expected));
            response.SetupGet(value => value.ContentStream).Returns(responseStream);
            await using var result = AsyncStreamingResult.CreateJsonLines(response.Object);
            var lines = new List<string>();
            await foreach (var line in result)
            {
                lines.Add(line.ToString());
            }
            CollectionAssert.AreEqual(new[] { cat.ToString(), dog.ToString() }, lines);
        }

        private static async IAsyncEnumerable<BinaryData> GetJsonLines(params BinaryData[] values)
        {
            await Task.CompletedTask;
            foreach (var value in values)
            {
                yield return value;
            }
        }

        [Test]
        public async Task JsonLinesBytesKeepBase64Encoding()
        {
            var response = new Mock<PipelineResponse>();
            var client = new Mock<UnionExtends> { CallBase = true };
            string? requestData = null;
            client.Setup(value => value.SendBytesAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Returns(async (BinaryContent content, RequestOptions _) =>
                {
                    using var stream = new MemoryStream();
                    await content.WriteToAsync(stream, CancellationToken.None);
                    requestData = BinaryData.FromBytes(stream.ToArray()).ToString();
                    return ClientResult.FromResponse(response.Object);
                });
            await client.Object.SendBytesAsync(GetJsonLines(BinaryData.FromString("hello"), BinaryData.FromString("world")));
            Assert.AreEqual("\"aGVsbG8=\"\n\"d29ybGQ=\"", requestData);
        }

        [Test]
        public void XmlUnionBaseRoundTripsWithoutAnEnvelope()
        {
            Assert.IsFalse(typeof(XmlUnionPet).IsAbstract);
            var options = new ModelReaderWriterOptions("X");
            var pet = new XmlUnionPet("Whiskers");
            var result = ModelReaderWriter.Read<XmlUnionPet>(ModelReaderWriter.Write(pet, options), options)!;
            Assert.AreEqual("Whiskers", result.Name);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void AlternateTypesPreserveRawUnionEnvelopes(bool mappedUnion)
        {
            var data = BinaryData.FromString("{\"kind\":\"cat\",\"value\":{\"name\":\"Whiskers\"}}");
            var response = new Mock<PipelineResponse>();
            response.SetupGet(value => value.Content).Returns(data);
            var client = new Mock<UnionExtends> { CallBase = true };
            string? requestData = null;
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream, CancellationToken.None);
                requestData = BinaryData.FromBytes(stream.ToArray()).ToString();
            }
            client.Setup(value => value.EchoMappedUnion(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(ClientResult.FromResponse(response.Object));
            client.Setup(value => value.EchoMappedBase(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(ClientResult.FromResponse(response.Object));
            if (mappedUnion)
            {
                using var document = JsonDocument.Parse(data);
                var result = client.Object.EchoMappedUnion(document.RootElement);
                Assert.AreEqual(data.ToString(), result.Value.GetRawText());
            }
            else
            {
                var result = client.Object.EchoMappedBase(data);
                Assert.AreEqual(data.ToString(), result.Value.ToString());
            }
            Assert.AreEqual(data.ToString(), requestData);
        }

        [Test]
        public void NestedSameNamedUnionRoundTrips()
        {
#pragma warning disable UNION001
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                NestedMammal.SerializeCollisionPetsUnion2(writer, new ExperimentalUnionCat("Whiskers", true), ModelSerializationExtensions.WireOptions);
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            var result = NestedMammal.DeserializeCollisionPetsUnion2(document.RootElement, ModelSerializationExtensions.WireOptions);
            Assert.IsInstanceOf<ExperimentalUnionCat>(result);
            Assert.AreEqual("Whiskers", result.Name);
#pragma warning restore UNION001
        }

        [Test]
        public void StandaloneUnionBaseAndPropertyRoundTrip()
        {
            Assert.IsFalse(typeof(DirectUnionPet).IsAbstract);
            var pet = new DirectUnionPet("Whiskers")
            {
                DeserializeDirectPetsUnion = "read",
                SerializeDirectPetsUnion = "write"
            };
            var result = ModelReaderWriter.Read<DirectUnionPet>(ModelReaderWriter.Write(pet))!;
            Assert.AreEqual("Whiskers", result.Name);
            Assert.AreEqual("read", result.DeserializeDirectPetsUnion);
            Assert.AreEqual("write", result.SerializeDirectPetsUnion);
            var container = new DirectUnionPetContainer(pet);
            var containerResult = ModelReaderWriter.Read<DirectUnionPetContainer>(ModelReaderWriter.Write(container))!;
            Assert.AreEqual("Whiskers", containerResult.Pet.Name);
        }

        [Test]
        public void HelpersAvoidPropertyNamesAndPreserveUnionEnvelopes()
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                DirectUnionPet.SerializeDirectPetsUnion1(writer, new DirectUnionCat("Whiskers", true), ModelSerializationExtensions.WireOptions);
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            Assert.AreEqual("cat", document.RootElement.GetProperty("kind").GetString());
            var result = DirectUnionPet.DeserializeDirectPetsUnion1(document.RootElement, ModelSerializationExtensions.WireOptions);
            Assert.IsInstanceOf<DirectUnionCat>(result);
            Assert.AreEqual("Whiskers", result.Name);
        }

        [TestCase(false)]
        [TestCase(true)]
        public void ExternallyMappedVariantOrAncestorUsesRawEnvelope(bool intermediate)
        {
            var data = BinaryData.FromString("{\"kind\":\"cat\",\"value\":{\"name\":\"Whiskers\"}}");
            var response = new Mock<PipelineResponse>();
            response.SetupGet(value => value.Content).Returns(data);
            var client = new Mock<UnionExtends> { CallBase = true };
            string? requestData = null;
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream, CancellationToken.None);
                requestData = BinaryData.FromBytes(stream.ToArray()).ToString();
            }
            client.Setup(value => value.EchoMappedVariant(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(ClientResult.FromResponse(response.Object));
            client.Setup(value => value.EchoMappedIntermediate(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(ClientResult.FromResponse(response.Object));
            var result = intermediate ? client.Object.EchoMappedIntermediate(data) : client.Object.EchoMappedVariant(data);
            Assert.AreEqual(data.ToString(), result.Value.ToString());
            Assert.AreEqual(data.ToString(), requestData);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void HelpersDoNotMatchTheirEnclosingType(bool serializeName)
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                if (serializeName)
                {
                    SerializePetsUnion.SerializePetsUnion1(writer, new SerializeNamedCat("Whiskers"), ModelSerializationExtensions.WireOptions);
                }
                else
                {
                    DeserializePetsUnion.SerializePetsUnion1(writer, new DeserializeNamedCat("Whiskers"), ModelSerializationExtensions.WireOptions);
                }
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            Assert.AreEqual("cat", document.RootElement.GetProperty("kind").GetString());
            var name = serializeName
                ? SerializePetsUnion.DeserializePetsUnion1(document.RootElement, ModelSerializationExtensions.WireOptions).Name
                : DeserializePetsUnion.DeserializePetsUnion1(document.RootElement, ModelSerializationExtensions.WireOptions).Name;
            Assert.AreEqual("Whiskers", name);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void CustomizedPayloadBasesKeepRawEnvelopes(bool intermediate)
        {
            var data = BinaryData.FromString("{\"kind\":\"cat\",\"value\":{\"meow\":true}}");
            var response = new Mock<PipelineResponse>();
            response.SetupGet(value => value.Content).Returns(data);
            var client = new Mock<UnionExtends> { CallBase = true };
            string? requestData = null;
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream, CancellationToken.None);
                requestData = BinaryData.FromBytes(stream.ToArray()).ToString();
            }
            client.Setup(value => value.EchoCustomBase(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(ClientResult.FromResponse(response.Object));
            client.Setup(value => value.EchoCustomIntermediate(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(ClientResult.FromResponse(response.Object));
            var result = intermediate ? client.Object.EchoCustomIntermediate(data) : client.Object.EchoCustomBase(data);
            Assert.AreEqual(data.ToString(), result.Value.ToString());
            Assert.AreEqual(data.ToString(), requestData);
        }

        [Test]
        public void CustomizedPayloadUnionPropertiesKeepRawEnvelopes()
        {
            var data = BinaryData.FromString("{\"kind\":\"cat\",\"value\":{\"meow\":true}}");
            var container = new CustomUnionPet { Name = "Whiskers" };
            container.Children.Add(data);
            var result = ModelReaderWriter.Read<CustomUnionPet>(ModelReaderWriter.Write(container))!;
            Assert.AreEqual("Whiskers", result.Name);
            Assert.AreEqual(data.ToString(), result.Children[0].ToString());
        }

        [TestCase(true)]
        [TestCase(false)]
        public void CustomRebasedVariantsUseTheirOwnDiscriminator(bool derived)
        {
            RebasedUnionPet pet = derived ? new RebasedUnionB("Whiskers") : new RebasedUnionA("Rex");
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                RebasedUnionPet.SerializeRebasedPetsUnion(writer, pet, ModelSerializationExtensions.WireOptions);
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            Assert.AreEqual(derived ? "b" : "a", document.RootElement.GetProperty("kind").GetString());
            var result = RebasedUnionPet.DeserializeRebasedPetsUnion(document.RootElement, ModelSerializationExtensions.WireOptions);
            Assert.AreEqual(pet.GetType(), result.GetType());
            Assert.AreEqual(pet.Name, result.Name);
        }

        [Test]
        public void NestedUnionPayloadsRemainConcrete()
        {
            Assert.IsTrue(typeof(CollisionPetsUnion).IsAbstract);
            Assert.IsFalse(typeof(NestedMammal).IsAbstract);
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                CollisionPetsUnion.SerializeCollisionPetsUnion1(writer, new NestedMammal("Mammal"), ModelSerializationExtensions.WireOptions);
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            var result = CollisionPetsUnion.DeserializeCollisionPetsUnion1(document.RootElement, ModelSerializationExtensions.WireOptions);
            Assert.AreEqual(typeof(NestedMammal), result.GetType());
            Assert.AreEqual("Mammal", result.Name);
        }

        [Test]
        public void ExperimentalUnionVariantRoundTrips()
        {
#pragma warning disable UNION001
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                NestedMammal.SerializeNestedPetsUnion(writer, new ExperimentalUnionCat("Whiskers", true), ModelSerializationExtensions.WireOptions);
            }
            using var document = JsonDocument.Parse(stream.ToArray());
            var result = NestedMammal.DeserializeNestedPetsUnion(document.RootElement, ModelSerializationExtensions.WireOptions);
            Assert.IsInstanceOf<ExperimentalUnionCat>(result);
            Assert.AreEqual("Whiskers", result.Name);
            Assert.IsTrue(((ExperimentalUnionCat)result).Meow);
#pragma warning restore UNION001
        }

        [Test]
        public void CustomizedBinaryDataPropertiesRoundTripRawEnvelopes()
        {
            var cat = Serialize(new UnionCat("Whiskers", true));
            var dog = Serialize(new UnionDog("Rex", false));
            var container = new RawUnionPetContainer(cat)
            {
                NullablePet = dog,
                RawPets = BinaryData.FromString($"[{cat},{dog}]"),
                RawLookup = BinaryData.FromString($"{{\"best\":{dog}}}")
            };
            container.Pets.Add(cat);
            container.Pets.Add(null!);
            container.Lookup.Add("best", dog);
            container.Lookup.Add("missing", null!);

            var result = ModelReaderWriter.Read<RawUnionPetContainer>(ModelReaderWriter.Write(container))!;

            Assert.AreEqual(cat.ToString(), result.Pet.ToString());
            Assert.AreEqual(dog.ToString(), result.NullablePet.ToString());
            Assert.AreEqual(cat.ToString(), result.Pets[0].ToString());
            Assert.IsNull(result.Pets[1]);
            Assert.AreEqual(dog.ToString(), result.Lookup["best"].ToString());
            Assert.IsNull(result.Lookup["missing"]);
            Assert.AreEqual(container.RawPets.ToString(), result.RawPets.ToString());
            Assert.AreEqual(container.RawLookup.ToString(), result.RawLookup.ToString());

            container.NullablePet = null!;
            var nullResult = ModelReaderWriter.Read<RawUnionPetContainer>(ModelReaderWriter.Write(container))!;
            Assert.IsNull(nullResult.NullablePet);
        }

        [Test]
        public void AbstractBaseCannotBeDeserializedWithoutUnionContext()
        {
            using var document = JsonDocument.Parse("{\"name\":\"Other\"}");
            Assert.Throws<JsonException>(() => UnionPet.DeserializeUnionPet(
                document.RootElement, ModelSerializationExtensions.WireOptions));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task ConvenienceMethodsUseUnionContext(bool isAsync)
        {
            var responseData = Serialize(new UnionDog("Rex", false));
            var response = new Mock<PipelineResponse>();
            response.SetupGet(r => r.Content).Returns(responseData);
            var protocolResult = ClientResult.FromResponse(response.Object);
            var client = new Mock<UnionExtends> { CallBase = true };
            BinaryData? requestData = null;
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream, CancellationToken.None);
                requestData = BinaryData.FromBytes(stream.ToArray());
            }
            client.Setup(c => c.Echo(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(protocolResult);
            client.Setup(c => c.EchoAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(protocolResult);
            var cat = new UnionCat("Whiskers", true);

            var result = isAsync ? await client.Object.EchoAsync(cat) : client.Object.Echo(cat);

            using var request = JsonDocument.Parse(requestData!);
            Assert.AreEqual("cat", request.RootElement.GetProperty("kind").GetString());
            Assert.IsTrue(request.RootElement.GetProperty("value").GetProperty("meow").GetBoolean());
            Assert.IsInstanceOf<UnionDog>(result.Value);
            Assert.AreEqual("Rex", result.Value.Name);
            Assert.AreSame(response.Object, result.GetRawResponse());
        }

        [TestCase("{}")]
        [TestCase("[]")]
        [TestCase("\"cat\"")]
        [TestCase("{\"kind\": 42, \"value\": {}}")]
        [TestCase("{\"kind\": \"cat\"}")]
        [TestCase("{\"kind\": \"cat\", \"value\": null}")]
        [TestCase("{\"kind\": \"cat\", \"value\": []}")]
        [TestCase("{\"kind\": \"unknown\", \"value\": {}}")]
        public void InvalidEnvelopeIsRejected(string json)
        {
            using var document = JsonDocument.Parse(json);
            Assert.Throws<JsonException>(() => UnionPet.DeserializeUnionPetsUnion(
                document.RootElement, ModelSerializationExtensions.WireOptions));
        }

        [TestCase(false)]
        [TestCase(true)]
        public async Task TopLevelCollectionsUseUnionContext(bool isAsync)
        {
            var responseData = BinaryData.FromString($"[{Serialize(new UnionDog("Rex", false))}]");
            var response = new Mock<PipelineResponse>();
            response.SetupGet(r => r.Content).Returns(() => responseData);
            var protocolResult = ClientResult.FromResponse(response.Object);
            var client = new Mock<UnionExtends> { CallBase = true };
            BinaryData? requestData = null;
            void Capture(BinaryContent content, RequestOptions options)
            {
                using var stream = new MemoryStream();
                content.WriteTo(stream, CancellationToken.None);
                requestData = BinaryData.FromBytes(stream.ToArray());
            }
            client.Setup(c => c.EchoPets(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(protocolResult);
            client.Setup(c => c.EchoPetsAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(protocolResult);
            client.Setup(c => c.EchoLookup(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).Returns(protocolResult);
            client.Setup(c => c.EchoLookupAsync(It.IsAny<BinaryContent>(), It.IsAny<RequestOptions>()))
                .Callback<BinaryContent, RequestOptions>(Capture).ReturnsAsync(protocolResult);
            UnionPet[] pets = [new UnionCat("Whiskers", true)];

            var listResult = isAsync ? await client.Object.EchoPetsAsync(pets) : client.Object.EchoPets(pets);
            Assert.IsInstanceOf<UnionDog>(listResult.Value[0]);
            using (var request = JsonDocument.Parse(requestData!))
            {
                Assert.AreEqual("cat", request.RootElement[0].GetProperty("kind").GetString());
            }

            responseData = BinaryData.FromString($"{{\"best\":{Serialize(new UnionDog("Rex", false))}}}");
            var lookup = new Dictionary<string, UnionPet> { ["best"] = pets[0] };
            var dictionaryResult = isAsync ? await client.Object.EchoLookupAsync(lookup) : client.Object.EchoLookup(lookup);
            Assert.IsInstanceOf<UnionDog>(dictionaryResult.Value["best"]);
            using var dictionaryRequest = JsonDocument.Parse(requestData!);
            Assert.AreEqual("cat", dictionaryRequest.RootElement.GetProperty("best").GetProperty("kind").GetString());
        }

        [Test]
        public void ModelOutsideTheUnionIsRejected()
        {
            var exception = Assert.Throws<ArgumentException>(() => Serialize(new OtherPet()));
            Assert.AreEqual("value", exception!.ParamName);
        }

        [Test]
        public void NullUnionRoundTrips()
        {
            using var document = JsonDocument.Parse(Serialize(null!));
            Assert.AreEqual(JsonValueKind.Null, document.RootElement.ValueKind);
            Assert.IsNull(UnionPet.DeserializeUnionPetsUnion(
                document.RootElement, ModelSerializationExtensions.WireOptions));
        }

        private static BinaryData Serialize(UnionPet value)
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                UnionPet.SerializeUnionPetsUnion(writer, value, ModelSerializationExtensions.WireOptions);
            }
            return BinaryData.FromBytes(stream.ToArray());
        }

        private sealed class OtherPet() : UnionPet("Other");
    }
}
