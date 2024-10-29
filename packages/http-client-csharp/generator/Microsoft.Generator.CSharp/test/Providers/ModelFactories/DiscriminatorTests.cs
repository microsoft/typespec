// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelFactories
{
    internal class DiscriminatorTests
    {
        private static readonly InputModelType _catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("willScratchOwner", InputPrimitiveType.Boolean, isRequired: true, isDiscriminator: true),
        ]);
        private static readonly InputModelType _birdModel = InputFactory.Model("bird", discriminatedKind: "bird", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("color", InputFactory.Literal.String("red"), isRequired: true, isDiscriminator: true)
        ]);
        private static readonly InputModelType _dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("likesBones", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _baseModel = InputFactory.Model(
            "pet",
            properties:
            [
                InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
            ],
            discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", _catModel }, { "dog", _dogModel }, { "bird", _birdModel } });

        [Test]
        public void BaseShouldReturnUnknownVariant()
        {
            ModelFactoryProvider modelFactory = SetupModelFactory();
            var baseModelMethod = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == "Pet");
            Assert.IsNotNull(baseModelMethod);
            Assert.IsTrue(baseModelMethod!.BodyStatements!.ToDisplayString().Contains("return new global::Sample.Models.UnknownPet("));
        }

        [Test]
        public void BaseShouldHaveDiscriminatorParameter()
        {
            ModelFactoryProvider modelFactory = SetupModelFactory();
            var baseModelMethod = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == "Pet");
            Assert.IsNotNull(baseModelMethod);
            var discriminatorParameter = baseModelMethod!.Signature.Parameters.FirstOrDefault(p => p.Name == "kind");
            Assert.IsNotNull(discriminatorParameter);
        }

        [Test]
        public void DerivedShouldNotHaveDiscriminatorParameter()
        {
            ModelFactoryProvider modelFactory = SetupModelFactory();
            var catModelMethod = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == "Cat");
            Assert.IsNotNull(catModelMethod);
            var discriminatorParameter = catModelMethod!.Signature.Parameters.FirstOrDefault(p => p.Name == "kind");
            Assert.IsNull(discriminatorParameter);
        }

        [Test]
        public void DerivedShouldUseItsDiscriminatorValueInModelFactory()
        {
            ModelFactoryProvider modelFactory = SetupModelFactory();
            var birdModelMethod = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == "Bird");
            Assert.IsNotNull(birdModelMethod);
            var discriminatorParameter = birdModelMethod!.Signature.Parameters.FirstOrDefault(p => p.Name == "kind");
            Assert.IsNull(discriminatorParameter);

            // ensure the signature is correct and includes the base discriminator value
            // and the cat model's discriminator with literal value
            Assert.IsTrue(birdModelMethod!.BodyStatements!.ToDisplayString()
                .Contains("return new global::Sample.Models.Bird(\"red\", \"bird\", name, null);"));
        }

        private static ModelFactoryProvider SetupModelFactory()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel, _birdModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var modelFactory = outputLibrary.TypeProviders.OfType<ModelFactoryProvider>().FirstOrDefault();
            Assert.IsNotNull(modelFactory);
            return modelFactory!;
        }
    }
}
