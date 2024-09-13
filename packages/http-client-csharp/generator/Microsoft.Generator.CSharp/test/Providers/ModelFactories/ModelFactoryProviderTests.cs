// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelFactories
{
    public class ModelFactoryProviderTests
    {
        private static readonly InputModelType[] ModelList = GetTestModels();

        public ModelFactoryProviderTests()
        {
            MockHelpers.LoadMockPlugin(inputModelTypes: ModelList);
        }

        [Test]
        public void SkipInternalModels()
        {
            var modelFactory = ModelFactoryProvider.FromInputLibrary();
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count(), modelFactory.Methods.Count);
        }

        [Test]
        public void ListParamShape()
        {
            var modelFactory = ModelFactoryProvider.FromInputLibrary();
            var models = ModelList.Select(CodeModelPlugin.Instance.TypeFactory.CreateModel);
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
            var modelFactory = ModelFactoryProvider.FromInputLibrary();
            var models = ModelList.Select(CodeModelPlugin.Instance.TypeFactory.CreateModel);
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
            var modelFactory = ModelFactoryProvider.FromInputLibrary();
            var models = ModelList.Select(CodeModelPlugin.Instance.TypeFactory.CreateModel);
            foreach (var model in models)
            {
                if (!model!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    continue; //skip internal models

                Assert.IsNotNull(model, "Null ModelProvider found");
                var method = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == model!.Name);
                Assert.IsNotNull(method);
                foreach (var property in model!.Properties.Where(p => p.Type.IsEnum))
                {
                    var parameter = method!.Signature.Parameters.FirstOrDefault(p => p.Name == property.Name.ToVariableName());
                    Assert.IsNotNull(parameter);
                    Assert.IsTrue(parameter!.Type.IsFrameworkType);
                    Assert.AreEqual(typeof(int), parameter!.Type.FrameworkType);
                }
            }
        }

        [Test]
        public void AdditionalPropertiesParamShape()
        {
            var modelFactory = ModelFactoryProvider.FromInputLibrary();
            var models = ModelList.Select(CodeModelPlugin.Instance.TypeFactory.CreateModel);
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
            var modelFactory = ModelFactoryProvider.FromInputLibrary();
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

            var derivedModel = InputFactory.Model("DerivedModel", properties: inheritanceProperties, discriminatedKind: "unknown");
            return
            [
                InputFactory.Model("InternalModel", "internal", properties: properties),
                InputFactory.Model("PublicModel1", properties: properties),
                InputFactory.Model("PublicModel2", properties: properties),
                derivedModel,
                InputFactory.Model("BaseModel", properties: properties, derivedModels: [derivedModel]),
                InputFactory.Model("ModelWithUnknownAdditionalProperties", properties: properties, additionalProperties: additionalPropertiesUnknown),
            ];
        }
    }
}
