// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelFactories
{
    public class ModelFactoryProviderTests
    {
        private static readonly InputModelType[] ModelList = GetTestModels();
        private CodeModelGenerator _instance;

        public ModelFactoryProviderTests()
        {
            _instance = MockHelpers.LoadMockGenerator(inputModelTypes: ModelList).Object;
        }

        [Test]
        public void SkipInternalModels()
        {
            var modelFactory = _instance.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count(), modelFactory.Methods.Count);
        }

        [Test]
        public void ListParamShape()
        {
            var modelFactory = _instance.OutputLibrary.ModelFactory.Value;
            var models = ModelList.Select(CodeModelGenerator.Instance.TypeFactory.CreateModel);
            foreach (var model in models)
            {
                if (!model!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    continue; //skip internal models

                Assert.IsNotNull(model, "Null ModelProvider found");
                var method = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == model!.Name);
                Assert.IsNotNull(method);
                foreach (var property in model!.Properties.Where(p => p.Type.IsList))
                {
                    var parameter = method!.Signature.Parameters.FirstOrDefault(p => p.Name == property.Name.ToVariableName());
                    Assert.IsNotNull(parameter);
                    Assert.IsTrue(parameter!.Type.IsFrameworkType);
                    Assert.AreEqual(typeof(IEnumerable<>), parameter!.Type.FrameworkType);
                }
            }
        }

        [Test]
        public void DictionaryParamShape()
        {
            var modelFactory = _instance.OutputLibrary.ModelFactory.Value;
            var models = ModelList.Select(CodeModelGenerator.Instance.TypeFactory.CreateModel);
            foreach (var model in models)
            {
                if (!model!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    continue; //skip internal models

                Assert.IsNotNull(model, "Null ModelProvider found");
                var method = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == model!.Name);
                Assert.IsNotNull(method);
                foreach (var property in model!.Properties.Where(p => p.Type.IsDictionary && !p.Name.StartsWith("Additional")))
                {
                    var parameter = method!.Signature.Parameters.FirstOrDefault(p => p.Name == property.Name.ToVariableName());
                    Assert.IsNotNull(parameter);
                    Assert.IsTrue(parameter!.Type.IsFrameworkType);
                    Assert.AreEqual(typeof(IDictionary<,>), parameter!.Type.FrameworkType);
                }
            }
        }

        [Test]
        public void DiscriminatorEnumParamShape()
        {
            var modelFactory = _instance.OutputLibrary.ModelFactory.Value;
            var models = ModelList.Select(CodeModelGenerator.Instance.TypeFactory.CreateModel);
            foreach (var model in models)
            {
                if (!model!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    continue; //skip internal models

                Assert.IsNotNull(model, "Null ModelProvider found");
                var method = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == model!.Name);
                Assert.IsNotNull(method);
                foreach (var property in model!.Properties.Where(p => p.Type.IsEnum))
                {
                    // enum discriminator properties are not included in the factory method
                    var parameter = method!.Signature.Parameters.FirstOrDefault(p => p.Name == property.Name.ToVariableName());
                    Assert.IsNull(parameter);
                }
            }
        }

        [Test]
        public void AdditionalPropertiesParamShape()
        {
            var modelFactory = _instance.OutputLibrary.ModelFactory.Value;
            var models = ModelList.Select(CodeModelGenerator.Instance.TypeFactory.CreateModel);
            foreach (var model in models)
            {
                if (!model!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    continue; //skip internal models

                Assert.IsNotNull(model, "Null ModelProvider found");
                var method = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == model!.Name);
                Assert.IsNotNull(method);
                foreach (var _ in model!.Properties.Where(p => p.Type.IsDictionary && p.Name.StartsWith("Additional")))
                {
                    var parameter = method!.Signature.Parameters.FirstOrDefault(p => p.Name == "additionalProperties");
                    Assert.IsNotNull(parameter);
                    Assert.IsTrue(parameter!.Type.IsFrameworkType);
                    Assert.AreEqual(typeof(IDictionary<,>), parameter!.Type.FrameworkType);
                    Assert.IsTrue(parameter.Type.ContainsBinaryData);
                }
            }
        }

        [Test]
        public void ModelFactoryName()
        {
            var modelFactory = _instance.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual("SampleNamespaceModelFactory", modelFactory.Name);
        }

        private static InputModelType[] GetTestModels()
        {
            InputType additionalPropertiesUnknown = InputPrimitiveType.Any;
            InputModelProperty[] properties =
            [
                InputFactory.Property("StringProp", InputPrimitiveType.String),
                InputFactory.Property("ListProp", InputFactory.Array(InputPrimitiveType.String)),
                InputFactory.Property("DictProp", InputFactory.Dictionary(InputPrimitiveType.String, InputPrimitiveType.String)),
            ];
            InputModelProperty[] inheritanceProperties = properties.Concat(new[]
            {
                InputFactory.Property("EnumProp",
                    InputFactory.Enum("inputEnum", InputPrimitiveType.Int32, isExtensible: true,
                        values: [InputFactory.EnumMember.String("foo", "bar")]), isDiscriminator: true)
            }).ToArray();

            var derivedModel = InputFactory.Model("DerivedModel", properties: inheritanceProperties, discriminatedKind: "foo");
            return
            [
                InputFactory.Model("InternalModel", access: "internal", properties: properties),
                InputFactory.Model("PublicModel1", properties: properties),
                InputFactory.Model("PublicModel2", properties: properties),
                derivedModel,
                InputFactory.Model("BaseModel", properties: properties, derivedModels: [derivedModel]),
                InputFactory.Model("ModelWithUnknownAdditionalProperties", properties: properties, additionalProperties: additionalPropertiesUnknown),
            ];
        }
    }
}
