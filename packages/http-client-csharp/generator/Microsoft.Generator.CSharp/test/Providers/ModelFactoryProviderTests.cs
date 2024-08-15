// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ModelFactoryProviderTests
    {
        private static readonly InputType StringInputType = new InputPrimitiveType(InputPrimitiveTypeKind.String, "string", "string");
        private static readonly InputModelType[] ModelList = GetTestModels();

        public ModelFactoryProviderTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void SkipInternalModels()
        {
            var modelFactory = new ModelFactoryProvider(ModelList);
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count(), modelFactory.Methods.Count);
        }

        [Test]
        public void ListParamShape()
        {
            var modelFactory = new ModelFactoryProvider(ModelList);
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
            var modelFactory = new ModelFactoryProvider(ModelList);
            var models = ModelList.Select(CodeModelPlugin.Instance.TypeFactory.CreateModel);
            foreach (var model in models)
            {
                if (!model!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public))
                    continue; //skip internal models

                Assert.IsNotNull(model, "Null ModelProvider found");
                var method = modelFactory.Methods.FirstOrDefault(m => m.Signature.Name == model!.Name);
                Assert.IsNotNull(method);
                foreach (var property in model!.Properties.Where(p => p.Type.IsDictionary))
                {
                    var parameter = method!.Signature.Parameters.FirstOrDefault(p => p.Name == property.Name.ToVariableName());
                    Assert.IsNotNull(parameter);
                    Assert.IsTrue(parameter!.Type.IsFrameworkType);
                    Assert.AreEqual(typeof(IDictionary<,>), parameter!.Type.FrameworkType);
                }
            }
        }

        [Test]
        public void ModelFactoryName()
        {
            var modelFactory = new ModelFactoryProvider(ModelList);
            Assert.AreEqual("SampleNamespaceModelFactory", modelFactory.Name);
        }

        private static InputModelType[] GetTestModels()
        {
            var inputModel1 = new InputModelType(
                "InternalModel",
                "InternalModel",
                "internal",
                null,
                "InternalModel",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var properties1 = new[]
            {
                new InputModelProperty("StringProp", "stringProp", "StringProp", StringInputType, false, false,
                    false, inputModel1),
                new InputModelProperty("ListProp", "listProp", "ListProp",
                    new InputArrayType("list", "list", StringInputType), false, false, false, inputModel1),
                new InputModelProperty("DictProp", "DictProp", "DictProp",
                    new InputDictionaryType("dict", StringInputType, StringInputType), false, false, false, inputModel1)
            };
            inputModel1.Properties = properties1;

            var inputModel2 = new InputModelType(
                "PublicModel1",
                "PublicModel1",
                "public1",
                null,
                "PublicModel1",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var properties2 = new[]
            {
                new InputModelProperty("StringProp", "stringProp", "StringProp", StringInputType, false, false,
                    false, inputModel2),
                new InputModelProperty("ListProp", "listProp", "ListProp",
                    new InputArrayType("list", "list", StringInputType), false, false, false, inputModel2),
                new InputModelProperty("DictProp", "DictProp", "DictProp",
                    new InputDictionaryType("dict", StringInputType, StringInputType), false, false, false, inputModel2)
            };
            inputModel2.Properties = properties2;

            var inputModel3 = new InputModelType(
                "PublicModel2",
                "PublicModel2",
                "public2",
                null,
                "PublicModel2",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var properties3 = new[]
            {
                new InputModelProperty("StringProp", "stringProp", "StringProp", StringInputType, false, false,
                    false, inputModel3),
                new InputModelProperty("ListProp", "listProp", "ListProp",
                    new InputArrayType("list", "list", StringInputType), false, false, false, inputModel3),
                new InputModelProperty("DictProp", "DictProp", "DictProp",
                    new InputDictionaryType("dict", StringInputType, StringInputType), false, false, false,
                    inputModel3)
            };
            inputModel3.Properties = properties3;
            return new[] {inputModel1, inputModel2, inputModel3};
        }
    }
}
