// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using AutoRest.TestServer.Tests.Infrastructure;
using MgmtCustomizations.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class MgmtCustomizationsTests
    {
        [Test]
        public void Cat_SizeSerializeIntoString()
        {
            Pet pet = new Cat()
            {
                Size = 8,
                Meow = "MEOW"
            };

            var root = JsonAsserts.AssertWireSerializes(pet);
            var sizeProperty = root.GetProperty("size");

            // asserts we serialize the int size into a string
            Assert.AreEqual(JsonValueKind.String, sizeProperty.ValueKind);
            Assert.AreEqual("8", sizeProperty.GetString());
        }

        [Test]
        public void Cat_SizeDeserializeIntoInt()
        {
            var json = @"{""kind"": ""Cat"", ""size"": ""10"", ""meow"": ""MEOW""}";
            using var document = JsonDocument.Parse(json);

            var pet = Pet.DeserializePet(document.RootElement);
            var cat = pet as Cat;

            Assert.IsTrue(cat != null);
            Assert.AreEqual(10, cat.Size);
            Assert.AreEqual("MEOW", cat.Meow);
        }

        [Test]
        public void Dog_SerializeIntoProperties()
        {
            Pet pet = new Dog()
            {
                Bark = "Dog barks"
            };

            // this should serialize into:
            // { "kind": "Dog", "properties": { "dog": { "bark": "DOG BARKS" } } }

            var root = JsonAsserts.AssertWireSerializes(pet);
            var properties = root.GetProperty("properties");
            Assert.AreEqual(JsonValueKind.Object, properties.ValueKind);
            var dogProperty = properties.GetProperty("dog");
            Assert.AreEqual(JsonValueKind.Object, dogProperty.ValueKind);
            var barkProperty = dogProperty.GetProperty("bark");
            Assert.AreEqual(JsonValueKind.String, barkProperty.ValueKind);
            Assert.AreEqual("DOG BARKS", barkProperty.GetString());
        }

        [Test]
        public void Dog_DeserializeFromProperties()
        {
            var json = @"{""kind"": ""Dog"", ""properties"": { ""dog"": { ""bark"": ""dog barks"" }}}";
            using var document = JsonDocument.Parse(json);

            var pet = Pet.DeserializePet(document.RootElement);
            var dog = pet as Dog;

            Assert.IsTrue(dog != null);
            Assert.AreEqual("dog barks", dog.Bark);
        }
    }
}
