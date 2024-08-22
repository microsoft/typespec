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

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class ModelFactoryProviderTests
    {
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
            InputModelProperty[] properties =
            [
                InputFactory.Property("StringProp", InputPrimitiveType.String),
                InputFactory.Property("ListProp", InputFactory.Array(InputPrimitiveType.String)),
                InputFactory.Property("DictProp", InputFactory.Dictionary(InputPrimitiveType.String, InputPrimitiveType.String))
            ];
            return
            [
                InputFactory.Model("InternalModel", "internal", properties: properties),
                InputFactory.Model("PublicModel1", properties: properties),
                InputFactory.Model("PublicModel2", properties: properties)
            ];
        }
    }
}
