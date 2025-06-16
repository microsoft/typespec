// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelFactories
{
    public class ModelFactoryProviderTests
    {
        private static readonly InputModelType[] ModelList = GetTestModels();
        private CodeModelGenerator? _instance;

        [SetUp]
        public void Setup()
        {
            _instance = MockHelpers.LoadMockGenerator(inputModelTypes: ModelList).Object;
        }

        [Test]
        public void SkipInternalModels()
        {
            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count(), modelFactory.Methods.Count);
        }

        [Test]
        public void ListParamShape()
        {
            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
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
            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
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
            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
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
            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
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
            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual("SampleNamespaceModelFactory", modelFactory.Name);
        }

        [Test]
        public async Task BackCompatibility_NewModelPropertyAdded()
        {
            _instance = (await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: ModelList,
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync())).Object;

            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual("SampleNamespaceModelFactory", modelFactory.Name);

            var methods = modelFactory.Methods;
            // There should be an additional method for backward compatibility
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count() + 1, methods.Count);

            var currentOverloadMethod = methods
                .FirstOrDefault(m => m.Signature.Name == "PublicModel1" && m.Signature.Parameters.Any(p => p.Name == "dictProp"));
            var backwardCompatibilityMethod = methods
                .FirstOrDefault(m => m.Signature.Name == "PublicModel1" && m.Signature.Parameters.All(p => p.Name != "dictProp"));
            Assert.IsNotNull(currentOverloadMethod);
            Assert.IsNotNull(backwardCompatibilityMethod);

            // validate the signature of the backward compatibility method
            var attributes = backwardCompatibilityMethod!.Signature.Attributes;
            Assert.AreEqual(1, attributes.Count);
            var printedAttribute = attributes[0].ToDisplayString();
            Assert.AreEqual(
                "[global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Never)]\n",
                printedAttribute);

            var parameters = backwardCompatibilityMethod!.Signature.Parameters;
            Assert.AreEqual(3, parameters.Count);
            Assert.AreEqual("stringProp", parameters[0].Name);
            Assert.AreEqual("modelProp", parameters[1].Name);
            Assert.AreEqual("listProp", parameters[2].Name);

            var currentParameters = currentOverloadMethod!.Signature.Parameters;
            Assert.AreEqual(4, currentParameters.Count);
            Assert.AreEqual("stringProp", currentParameters[0].Name);
            Assert.AreEqual("modelProp", currentParameters[1].Name);
            Assert.AreEqual("listProp", currentParameters[2].Name);
            Assert.AreEqual("dictProp", currentParameters[3].Name);

            Assert.IsTrue(parameters[0].Type.AreNamesEqual(currentParameters[0].Type));
            Assert.IsTrue(parameters[1].Type.AreNamesEqual(currentParameters[1].Type));
            Assert.IsTrue(parameters[2].Type.AreNamesEqual(currentParameters[2].Type));

            // validate the previous method body
            var body = backwardCompatibilityMethod!.BodyStatements;
            Assert.IsNotNull(body);
            var result = body!.ToDisplayString();
            Assert.AreEqual(
                "return PublicModel1(stringProp, modelProp, listProp, dictProp: default);\n",
                result);
        }

        // This test validates that only the previous model factory methods are generated when only the parameter ordering is changed
        // in the current library version.
        [Test]
        public async Task BackCompatibility_OnlyParamOrderingChanged()
        {
            _instance = (await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: ModelList,
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync())).Object;

            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual("SampleNamespaceModelFactory", modelFactory.Name);

            var methods = modelFactory.Methods;
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count(), methods.Count);

            var factoryMethods = methods.Where(m => m.Signature.Name == "PublicModel1" || m.Signature.Name == "PublicModel2");
            Assert.AreEqual(2, factoryMethods.Count());

            var model1BackCompatMethod = factoryMethods
                .First(m => m.Signature.Name == "PublicModel1");
            Assert.IsNotNull(model1BackCompatMethod);

            var attributes = model1BackCompatMethod!.Signature.Attributes;
            Assert.AreEqual(0, attributes.Count);

            var parameters = model1BackCompatMethod!.Signature.Parameters;
            Assert.AreEqual(4, parameters.Count);
            Assert.AreEqual("modelProp", parameters[0].Name);
            Assert.AreEqual("stringProp", parameters[1].Name);
            Assert.AreEqual("listProp", parameters[2].Name);
            Assert.AreEqual("dictProp", parameters[3].Name);

            var model2BackCompatMethod = factoryMethods
               .First(m => m.Signature.Name == "PublicModel2");
            Assert.IsNotNull(model2BackCompatMethod);

            attributes = model2BackCompatMethod!.Signature.Attributes;
            Assert.AreEqual(0, attributes.Count);

            parameters = model2BackCompatMethod!.Signature.Parameters;
            Assert.AreEqual(4, parameters.Count);
            Assert.AreEqual("listProp", parameters[0].Name);
            Assert.AreEqual("modelProp", parameters[1].Name);
            Assert.AreEqual("stringProp", parameters[2].Name);
            Assert.AreEqual("dictProp", parameters[3].Name);


            // validate the previous method bodies
            var body = model1BackCompatMethod!.BodyStatements;
            Assert.IsNotNull(body);
            var result = body!.ToDisplayString();
            Assert.AreEqual(
                "listProp ??= new global::Sample.ChangeTrackingList<string>();\n" +
                "dictProp ??= new global::Sample.ChangeTrackingDictionary<string, string>();\n\n" +
                "return new global::Sample.Models.PublicModel1(stringProp, modelProp, listProp?.ToList(), dictProp, additionalBinaryDataProperties: null);\n",
                result);

            body = model2BackCompatMethod!.BodyStatements;
            Assert.IsNotNull(body);
            result = body!.ToDisplayString();
            Assert.AreEqual(
                "listProp ??= new global::Sample.ChangeTrackingList<string>();\n" +
                "dictProp ??= new global::Sample.ChangeTrackingDictionary<string, string>();\n\n" +
                "return new global::Sample.Models.PublicModel2(stringProp, modelProp, listProp?.ToList(), dictProp, additionalBinaryDataProperties: null);\n",
                result);
        }

        [Test]
        public async Task BackCompatibility_NoCurrentOverloadFound()
        {
            _instance = (await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: ModelList,
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync())).Object;

            var modelFactory = _instance!.OutputLibrary.ModelFactory.Value;
            Assert.AreEqual("SampleNamespaceModelFactory", modelFactory.Name);

            var methods = modelFactory.Methods;
            // There should be an additional method for backward compatibility
            Assert.AreEqual(ModelList.Length - ModelList.Where(m => m.Access == "internal").Count() + 1, methods.Count);

            var currentOverloadMethod = methods
                .FirstOrDefault(m => m.Signature.Name == "PublicModel1" && m.Signature.Parameters.Any(p => p.Name == "dictProp"));
            var backwardCompatibilityMethod = methods
                .FirstOrDefault(m => m.Signature.Name == "PublicModel1OldName" && m.Signature.Parameters.All(p => p.Name != "dictProp"));
            Assert.IsNotNull(currentOverloadMethod);
            Assert.IsNotNull(backwardCompatibilityMethod);

            // validate the signature of the backward compatibility method
            var parameters = backwardCompatibilityMethod!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);
            Assert.AreEqual("stringProp", parameters[0].Name);

            var currentParameters = currentOverloadMethod!.Signature.Parameters;
            Assert.AreEqual(4, currentParameters.Count);
            Assert.AreEqual("stringProp", currentParameters[0].Name);
            Assert.AreEqual("modelProp", currentParameters[1].Name);
            Assert.AreEqual("listProp", currentParameters[2].Name);
            Assert.AreEqual("dictProp", currentParameters[3].Name);

            Assert.IsTrue(parameters[0].Type.AreNamesEqual(currentParameters[0].Type));

            // validate the previous method body
            var body = backwardCompatibilityMethod!.BodyStatements;
            Assert.IsNotNull(body);
            var result = body!.ToDisplayString();
            Assert.AreEqual(
                "return new global::Sample.Models.PublicModel1(stringProp, default, default, default, additionalBinaryDataProperties: null);\n",
                result);
        }

        private static InputModelType[] GetTestModels()
        {
            InputType additionalPropertiesUnknown = InputPrimitiveType.Any;
            InputModelProperty[] properties =
            [
                InputFactory.Property("StringProp", InputPrimitiveType.String),
                InputFactory.Property("ModelProp", InputFactory.Model("Thing")),
                InputFactory.Property("ListProp", InputFactory.Array(InputPrimitiveType.String)),
                InputFactory.Property("DictProp", InputFactory.Dictionary(InputPrimitiveType.String, InputPrimitiveType.String)),
            ];
            InputModelProperty[] inheritanceProperties = properties.Concat(new[]
            {
                InputFactory.Property("EnumProp",
                    InputFactory.StringEnum("inputEnum", [("foo", "bar")], isExtensible: true), isDiscriminator: true)
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
