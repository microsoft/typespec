// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelProviders
{
    public class DiscriminatorTests
    {
        private static readonly InputModelType _catModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("willScratchOwner", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _dogModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true),
            InputFactory.Property("likesBones", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _baseModel = InputFactory.Model(
            "pet",
            properties: [InputFactory.Property("kind", InputPrimitiveType.String, isRequired: true, isDiscriminator: true)],
            discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", _catModel }, { "dog", _dogModel } });

        private static readonly InputEnumType _petEnum = InputFactory.Enum("pet", InputPrimitiveType.String, isExtensible: true, values:
        [
            InputFactory.EnumMember.String("cat", "cat"),
            InputFactory.EnumMember.String("dog", "dog")
        ]);
        private static readonly InputModelType _catEnumModel = InputFactory.Model("cat", discriminatedKind: "cat", properties:
        [
            InputFactory.Property("kind", _petEnum, isRequired: true, isDiscriminator: true),
            InputFactory.Property("willScratchOwner", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _dogEnumModel = InputFactory.Model("dog", discriminatedKind: "dog", properties:
        [
            InputFactory.Property("kind", _petEnum, isRequired: true, isDiscriminator: true),
            InputFactory.Property("likesBones", InputPrimitiveType.Boolean, isRequired: true)
        ]);
        private static readonly InputModelType _baseEnumModel = InputFactory.Model(
            "pet",
            properties: [InputFactory.Property("kind", _petEnum, isRequired: true, isDiscriminator: true)],
            discriminatedModels: new Dictionary<string, InputModelType>() { { "cat", _catEnumModel }, { "dog", _dogEnumModel } });

        [Test]
        public void BaseShouldBeAbstract()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            Assert.IsTrue(baseModel!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Abstract));
        }

        [Test]
        public void DiscriminatorPropertyShouldBeInternal()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            var discriminator = baseModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNotNull(discriminator);
            Assert.IsTrue(discriminator!.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
        }

        [Test]
        public void BaseConstructorShouldBePrivateProtected()
        {
            MockHelpers.LoadMockPlugin();
            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_baseModel);
            Assert.IsNotNull(baseModel);
            Assert.AreEqual(2, baseModel!.Constructors.Count);
            var ctor1 = baseModel.Constructors[0];
            var ctor2 = baseModel.Constructors[1];
            var initCtor = ctor1.Signature.Parameters.Count < ctor2.Signature.Parameters.Count ? ctor1 : ctor2;
            var serializationCtor = ctor1.Signature.Parameters.Count < ctor2.Signature.Parameters.Count ? ctor2 : ctor1;
            Assert.IsNotNull(initCtor);
            Assert.IsTrue(initCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Protected));
            Assert.IsTrue(initCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Private));
            Assert.IsNotNull(serializationCtor);
            Assert.IsTrue(serializationCtor!.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
        }

        [Test]
        public void DerivedPublicCtorShouldSetDiscriminator()
        {
            MockHelpers.LoadMockPlugin();
            var catModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_catModel);
            Assert.IsNotNull(catModel);
            Assert.AreEqual(2, catModel!.Constructors.Count);
            var publicCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);

            var init = publicCtor!.Signature.Initializer;
            Assert.IsNotNull(init);
            var expression = init!.Arguments[0] as ScopedApi;
            Assert.IsNotNull(expression);
            var original = expression!.Original as LiteralExpression;
            Assert.IsNotNull(original);
            Assert.AreEqual("cat", original!.Literal);
        }

        [Test]
        public void DerivedPublicCtorShouldNotHaveKindParam()
        {
            MockHelpers.LoadMockPlugin();
            var dogModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_dogModel);
            Assert.IsNotNull(dogModel);
            Assert.AreEqual(2, dogModel!.Constructors.Count);
            var publicCtor = dogModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(publicCtor);
            Assert.IsFalse(publicCtor!.Signature.Parameters.Any(p => p.Name == "kind"));
        }

        [Test]
        public void DerviedCtorHasSardAsLastParam()
        {
            MockHelpers.LoadMockPlugin();
            var catModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(_catModel);
            Assert.IsNotNull(catModel);
            Assert.AreEqual(2, catModel!.Constructors.Count);
            var serializationCtor = catModel.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual("additionalBinaryDataProperties", serializationCtor!.Signature.Parameters.Last().Name);
        }

        [Test]
        public void CreateUnknownVariant()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var models = outputLibrary.TypeProviders.OfType<ModelProvider>();
            Assert.AreEqual(4, models.Count());
            var unknownModel = models.FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
        }

        [Test]
        public void UnknownVariantIsInternal()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.IsTrue(unknownModel!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
        }

        [Test]
        public void UnknownVariantHasPetBase()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            Assert.AreEqual("Pet", unknownModel!.Type.BaseType!.Name);
        }

        [Test]
        public void SerializationCtorForUnknownTakesDiscriminator()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseModel, _catModel, _dogModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var unknownModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "UnknownPet");
            Assert.IsNotNull(unknownModel);
            var serializationCtor = unknownModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual("kind", serializationCtor!.Signature.Parameters[0].Name);
        }

        [Test]
        public void BaseDoesNotHaveDiscriminatorField()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var baseModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);
            Assert.IsFalse(baseModel!.Fields.Any(f => f.Name == "_kind"));
        }

        [Test]
        public void BaseKindPropertyIsNotVirtual()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var baseModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Pet");
            Assert.IsNotNull(baseModel);
            var kindProperty = baseModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNotNull(kindProperty);
            Assert.IsFalse(kindProperty!.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void DerivedHasNoKindProperty()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: [_baseEnumModel, _catEnumModel, _dogEnumModel]);
            var outputLibrary = CodeModelPlugin.Instance.OutputLibrary;
            var catModel = outputLibrary.TypeProviders.OfType<ModelProvider>().FirstOrDefault(t => t.Name == "Cat");
            Assert.IsNotNull(catModel);
            var kindProperty = catModel!.Properties.FirstOrDefault(p => p.Name == "Kind");
            Assert.IsNull(kindProperty);
        }
    }
}
