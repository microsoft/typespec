// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Snippets
{
    public class ModelProviderSnippetsTests
    {
        public ModelProviderSnippetsTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void GetPropertyExpression_SingleProperty()
        {
            var model = InputFactory.Model("TestModel", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [model]);
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model);
            var modelVariable = new VariableExpression(modelProvider!.Type, "testModel");

            var result = modelProvider.GetPropertyExpression(modelVariable, ["name"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Name", writer.ToString(false));
        }

        [Test]
        public void GetPropertyExpression_NestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: true, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");

            var result = outerModelProvider.GetPropertyExpression(modelVariable, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value", writer.ToString(false));
        }

        [Test]
        public void GetPropertyExpression_NullableNestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: false, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");

            var result = outerModelProvider.GetPropertyExpression(modelVariable, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value", writer.ToString(false));
        }

        [Test]
        public void GetPropertyExpression_MultipleNestedPropertiesWithNullable()
        {
            var deepModel = InputFactory.Model("DeepModel", properties:
            [
                InputFactory.Property("data", InputPrimitiveType.String, isRequired: true, wireName: "data")
            ]);

            var middleModel = InputFactory.Model("MiddleModel", properties:
            [
                InputFactory.Property("deep", deepModel, isRequired: false, wireName: "deep")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("middle", middleModel, isRequired: true, wireName: "middle")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [deepModel, middleModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");

            var result = outerModelProvider.GetPropertyExpression(modelVariable, ["middle", "deep", "data"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Middle?.Deep?.Data", writer.ToString(false));
        }

        [Test]
        public void SetPropertyExpression_SingleProperty()
        {
            var model = InputFactory.Model("TestModel", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true, wireName: "name")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [model]);
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(model);
            var modelVariable = new VariableExpression(modelProvider!.Type, "testModel");
            var value = Snippet.Literal("newValue");

            var result = modelProvider.SetPropertyExpression(modelVariable, value, ["name"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Name = \"newValue\"", writer.ToString(false));
        }

        [Test]
        public void SetPropertyExpression_NestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: true, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");
            var value = Snippet.Literal("newValue");

            var result = outerModelProvider.SetPropertyExpression(modelVariable, value, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value = \"newValue\"", writer.ToString(false));
        }

        [Test]
        public void SetPropertyExpression_NullableNestedProperties()
        {
            var innerModel = InputFactory.Model("InnerModel", properties:
            [
                InputFactory.Property("value", InputPrimitiveType.String, isRequired: true, wireName: "value")
            ]);

            var outerModel = InputFactory.Model("OuterModel", properties:
            [
                InputFactory.Property("inner", innerModel, isRequired: false, wireName: "inner")
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [innerModel, outerModel]);
            var outerModelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(outerModel);
            var modelVariable = new VariableExpression(outerModelProvider!.Type, "testModel");
            var value = Snippet.Literal("newValue");

            var result = outerModelProvider.SetPropertyExpression(modelVariable, value, ["inner", "value"]);

            using CodeWriter writer = new CodeWriter();
            result.Write(writer);
            Assert.AreEqual("testModel.Inner?.Value = \"newValue\"", writer.ToString(false));
        }
    }
}
