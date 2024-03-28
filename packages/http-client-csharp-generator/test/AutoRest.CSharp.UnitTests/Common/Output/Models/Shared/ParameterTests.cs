using System;
using System.Collections.Generic;
using System.Globalization;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Moq;
using NUnit.Framework;

namespace AutoRest.CSharp.Tests.Common.Output.Models.Shared
{
    public class ParameterTests
    {
        private TypeFactory typeFactory;
        private Mock<OutputLibrary> library;
        private Mock<TypeProvider> typeProvider;

        [SetUp]
        public void TestSetup()
        {
            library = new Mock<OutputLibrary>();
            typeFactory = new TypeFactory(library.Object);
            typeProvider = new Mock<TypeProvider>("test", null);
        }

        // Validates that the parameter description is constructed correctly using the default description.
        [Test]
        public void TestCreateDescription_DefaultDescription()
        {
            IReadOnlyList<InputModelProperty> modelProps = new List<InputModelProperty>();
            var derivedModels = new List<InputModelType>();
            InputModelType inputModel = new InputModelType(
                Name: "testInputModel",
                Namespace: "ns",
                Accessibility: "accessibility",
                Deprecated: "test",
                Description: "sample",
                DiscriminatorValue: null,
                DiscriminatorPropertyName: null,
                Usage: new InputModelTypeUsage(),
                Properties: modelProps,
                BaseModel: null,
                DerivedModels: derivedModels,
                InheritedDictionaryType: null,
                IsNullable: true);
            InputParameter opParam = new InputParameter(
                Name: "testParam",
                NameInRequest: "testParam",
                Description: "default",
                Type: inputModel,
                Location: new RequestLocation(),
                DefaultValue: null,
                VirtualParameter: null,
                GroupedBy: null,
                Kind: InputOperationParameterKind.Method,
                IsRequired: false,
                IsApiVersion: false,
                IsResourceParameter: false,
                IsContentType: false,
                IsEndpoint: false,
                SkipUrlEncoding: false,
                Explode: false,
                ArraySerializationDelimiter: null,
                HeaderCollectionPrefix: null);

            // mock ResolveModel
            library.Setup(l => l.ResolveModel(inputModel)).Returns(new CSharpType(typeProvider.Object, inputModel.Namespace, inputModel.Name));

            CSharpType cSharpType = typeFactory.CreateType(inputModel);

            FormattableString result = Parameter.CreateDescription(opParam, cSharpType, null, null);
            FormattableString expectedResult = $"default";

            Assert.AreEqual(expectedResult.ToString(), result.ToString());
        }

        // Validates that the parameter description is constructed correctly for a given input model type
        [Test]
        public void TestCreateDescription_InputModelType()
        {
            IReadOnlyList<InputModelProperty> modelProps = new List<InputModelProperty>();
            var derivedModels = new List<InputModelType>();
            InputModelType inputModel = new InputModelType(
                Name: "testInputModel",
                Namespace: "ns",
                Accessibility: "accessibility",
                Deprecated: "test",
                Description: "sample",
                DiscriminatorValue: null,
                DiscriminatorPropertyName: null,
                Usage: new InputModelTypeUsage(),
                Properties: modelProps,
                BaseModel: null,
                DerivedModels: derivedModels,
                InheritedDictionaryType: null,
                IsNullable: true);
            InputParameter opParam = new InputParameter(
                Name: "testParam",
                NameInRequest: "testParam",
                Description: string.Empty,
                Type: inputModel,
                Location: new RequestLocation(),
                DefaultValue: null,
                VirtualParameter: null,
                GroupedBy: null,
                Kind: InputOperationParameterKind.Method,
                IsRequired: false,
                IsApiVersion: false,
                IsResourceParameter: false,
                IsContentType: false,
                IsEndpoint: false,
                SkipUrlEncoding: false,
                Explode: false,
                ArraySerializationDelimiter: null,
                HeaderCollectionPrefix: null);

            // mock ResolveModel
            library.Setup(l => l.ResolveModel(inputModel)).Returns(new CSharpType(typeProvider.Object, inputModel.Namespace, inputModel.Name));

            CSharpType cSharpType = typeFactory.CreateType(inputModel);

            FormattableString result = Parameter.CreateDescription(opParam, cSharpType, null, null);
            FormattableString expectedResult = $"The global::ns.{inputModel.Name} to use.";

            bool areStringsEqual = string.Compare(result.ToString(), expectedResult.ToString(), CultureInfo.CurrentCulture,
              CompareOptions.IgnoreSymbols) == 0;

            Assert.True(areStringsEqual);
        }

        // Validates that the input parameter description is constructed correctly for a given type that is not a model
        [Test]
        public void TestCreateDescription_NonInputModelType()
        {
            InputType literalValueType = new InputPrimitiveType(InputTypeKind.Int32, false);
            InputLiteralType literalType = new InputLiteralType("sampleLiteral", literalValueType, 21, false);
            InputParameter opParam = new InputParameter(
                Name: "testParam",
                NameInRequest: "testParam",
                Description: string.Empty,
                Type: literalType,
                Location: new RequestLocation(),
                DefaultValue: null,
                VirtualParameter: null,
                GroupedBy: null,
                Kind: InputOperationParameterKind.Method,
                IsRequired: false,
                IsApiVersion: false,
                IsResourceParameter: false,
                IsContentType: false,
                IsEndpoint: false,
                SkipUrlEncoding: false,
                Explode: false,
                ArraySerializationDelimiter: null,
                HeaderCollectionPrefix: null);

            CSharpType cSharpType = typeFactory.CreateType(literalType);

            FormattableString result = Parameter.CreateDescription(opParam, cSharpType, null, null);
            FormattableString expectedResult = $"The int to use.";

            bool areStringsEqual = string.Compare(result.ToString(), expectedResult.ToString(), CultureInfo.CurrentCulture,
               CompareOptions.IgnoreSymbols) == 0;

            Assert.True(areStringsEqual);
        }

        // Validates that the parameter object is constructed correctly for a given input model type
        [Test]
        public void TestFromInputParameter_InputModelType()
        {
            IReadOnlyList<InputModelProperty> modelProps = new List<InputModelProperty>();
            var derivedModels = new List<InputModelType>();
            InputModelType inputModel = new InputModelType(
                Name: "testInputModel",
                Namespace: "ns",
                Accessibility: "accessibility",
                Deprecated: "test",
                Description: "sample",
                DiscriminatorValue: null,
                DiscriminatorPropertyName: null,
                Usage: new InputModelTypeUsage(),
                Properties: modelProps,
                BaseModel: null,
                DerivedModels: derivedModels,
                InheritedDictionaryType: null,
                IsNullable: true);
            InputParameter inputParam = new InputParameter(
                Name: "testParam",
                NameInRequest: "testParam",
                Description: "sampleDescription",
                Type: inputModel,
                Location: new RequestLocation(),
                DefaultValue: null,
                VirtualParameter: null,
                GroupedBy: null,
                Kind: InputOperationParameterKind.Method,
                IsRequired: false,
                IsApiVersion: false,
                IsResourceParameter: false,
                IsContentType: false,
                IsEndpoint: false,
                SkipUrlEncoding: false,
                Explode: false,
                ArraySerializationDelimiter: null,
                HeaderCollectionPrefix: null);

            // mock ResolveModel
            library.Setup(l => l.ResolveModel(inputModel)).Returns(new CSharpType(typeProvider.Object, inputModel.Namespace, inputModel.Name));

            CSharpType cSharpType = typeFactory.CreateType(inputModel);

            var parameter = Parameter.FromInputParameter(inputParam, cSharpType, typeFactory);
            Assert.IsNotNull(parameter);

            var result = parameter.Name;
            string expectedResult = inputParam.Name.ToVariableName();

            Assert.AreEqual(expectedResult, result);
        }

        // Validates that the parameter object is constructed correctly for a given type that is not a model
        [Test]
        public void TestFromInputParameter_NonInputModelType()
        {
            InputType literalValueType = new InputPrimitiveType(InputTypeKind.Int32, false);
            InputLiteralType literalType = new InputLiteralType("sampleLiteral", literalValueType, 21, false);
            InputParameter inputParam = new InputParameter(
                Name: "testParam",
                NameInRequest: "testParam",
                Description: "sampleDescription",
                Type: literalType,
                Location: new RequestLocation(),
                DefaultValue: null,
                VirtualParameter: null,
                GroupedBy: null,
                Kind: InputOperationParameterKind.Method,
                IsRequired: false,
                IsApiVersion: false,
                IsResourceParameter: false,
                IsContentType: false,
                IsEndpoint: false,
                SkipUrlEncoding: false,
                Explode: false,
                ArraySerializationDelimiter: null,
                HeaderCollectionPrefix: null);

            CSharpType cSharpType = typeFactory.CreateType(literalType);

            var parameter = Parameter.FromInputParameter(inputParam, cSharpType, typeFactory);
            Assert.IsNotNull(parameter);

            var result = parameter.Name;
            string expectedResult = inputParam.Name.ToVariableName();

            Assert.AreEqual(expectedResult, result);
        }
    }
}
