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
