// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class DiscriminatedUnionSerializationProviderTests
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
            MockHelpers.LoadMockGenerator(inputModels: () => [model, cat, dog]);

            var factory = ScmCodeModelGenerator.Instance.TypeFactory;
            Assert.AreEqual(factory.CreateCSharpType(model), factory.CreateCSharpType(union));
            Assert.IsNull(model.DiscriminatorProperty);
            Assert.IsNull(cat.DiscriminatorValue);
            var provider = factory.CreateDiscriminatedUnionSerialization(union);
            Assert.AreSame(provider, factory.CreateDiscriminatedUnionSerialization(union));
            Assert.AreEqual(Helpers.GetExpectedFromFile($"{discriminator},{envelope}"), new TypeProviderWriter(provider).Write().Content);
        }

        [Test]
        public void OrdinaryUnionKeepsBinaryDataRepresentation()
        {
            MockHelpers.LoadMockGenerator();
            var union = new InputUnionType("pets", [InputFactory.Model("cat"), InputFactory.Model("dog")]);
            Assert.IsFalse(DiscriminatedUnionSerializationProvider.RequiresEnvelope(union));
            Assert.IsTrue(ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(union)!.Equals(typeof(System.BinaryData)));
        }

        [Test]
        public void DetectsEnvelopesThroughContainersButNotDirectPayloads()
        {
            var model = InputFactory.Model("pet");
            var cat = InputFactory.Model("cat", baseModel: model);
            var union = new InputUnionType("pets", [cat], model, "kind", "value",
                new Dictionary<string, InputModelType> { ["cat"] = cat });
            Assert.IsTrue(DiscriminatedUnionSerializationProvider.RequiresEnvelope(union));
            Assert.IsTrue(DiscriminatedUnionSerializationProvider.RequiresEnvelope(new InputNullableType(union)));
            Assert.IsTrue(DiscriminatedUnionSerializationProvider.RequiresEnvelope(InputFactory.Array(union)));
            Assert.IsTrue(DiscriminatedUnionSerializationProvider.RequiresEnvelope(InputFactory.Dictionary(union)));
            Assert.IsFalse(DiscriminatedUnionSerializationProvider.RequiresEnvelope(cat));
        }
    }
}
