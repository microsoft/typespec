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
    public class ModelProviderTests
    {
        // Validates that the property body's setter is correctly set based on the property type
        [TestCaseSource(nameof(BuildProperties_ValidatePropertySettersTestCases))]
        public void BuildProperties_ValidatePropertySetters(InputModelProperty inputModelProperty, CSharpType type, bool hasSetter)
        {
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (inputType) => type);

            var props = new[]
            {
                inputModelProperty
            };

            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, props, null, [], null, null, new Dictionary<string, InputModelType>(), null, false);
            var modelTypeProvider = new ModelProvider(inputModel);
            var properties = modelTypeProvider.Properties;

            Assert.IsNotNull(properties);
            Assert.AreEqual(1, properties.Count);

            // validate the setter
            var prop1 = properties[0];
            Assert.IsNotNull(prop1);

            var autoPropertyBody = prop1.Body as AutoPropertyBody;
            Assert.IsNotNull(autoPropertyBody);
            Assert.AreEqual(hasSetter, autoPropertyBody?.HasSetter);
        }

        public static IEnumerable<TestCaseData> BuildProperties_ValidatePropertySettersTestCases
        {
            get
            {
                // list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputArrayType("mockProp", "TypeSpec.Array", new InputPrimitiveType(InputPrimitiveTypeKind.String)), false, false, false),
                    new CSharpType(typeof(IList<string>)),
                    false);
                // read only list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputArrayType("mockProp", "TypeSpec.Array", new InputPrimitiveType(InputPrimitiveTypeKind.String)), false, true, false),
                    new CSharpType(typeof(IReadOnlyList<string>)),
                    false);
                // nullable list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputArrayType("mockProp", "TypeSpec.Array", new InputPrimitiveType(InputPrimitiveTypeKind.String)), false, false, false),
                    new CSharpType(typeof(IList<string>), true),
                    true);
                // dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.String)), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>)),
                    false);
                // nullable dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.String)), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>), true),
                    true);
                // primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputPrimitiveTypeKind.String), false, false, false),
                    new CSharpType(typeof(string)),
                    true);
                // read only primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputPrimitiveTypeKind.String), false, true, false),
                    new CSharpType(typeof(string)),
                    false);
                // readonlymemory property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputArrayType("mockProp", "TypeSpec.Array", new InputPrimitiveType(InputPrimitiveTypeKind.String)), false, false, false),
                    new CSharpType(typeof(ReadOnlyMemory<>)),
                    true);
            }
        }

        private CSharpType GetCSharpType(InputType type) => type switch
        {
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.String => typeof(string),
                InputPrimitiveTypeKind.Int32 => typeof(int),
                InputPrimitiveTypeKind.Any => typeof(BinaryData),
                _ => throw new ArgumentException("Unsupported input type.")
            },
            InputArrayType => typeof(IList<string>),
            InputDictionaryType => typeof(IDictionary<string, string>),
            _ => throw new ArgumentException("Unsupported input type.")
        };

        [Test]
        public void BuildConstructor_ValidateConstructors()
        {
            var properties = new List<InputModelProperty>{
                    new InputModelProperty("requiredString", "requiredString", "", InputPrimitiveType.String, true, false, false),
                    new InputModelProperty("OptionalInt", "optionalInt", "", InputPrimitiveType.Int32, false, false, false),
                    new InputModelProperty("requiredCollection", "requiredCollection", "", new InputArrayType("List", "TypeSpec.Array", new InputPrimitiveType(InputPrimitiveTypeKind.String)), true, false, false),
                    new InputModelProperty("requiredDictionary", "requiredDictionary", "", new InputDictionaryType("Dictionary", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.String)), true, false, false),
                    new InputModelProperty("optionalUnknown", "optional unknown", "", InputPrimitiveType.Any, false, false, false),
             };

            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (InputType inputType) =>
            {
                // Lookup the inputType in the list and return the corresponding CSharpType
                var inputModelProperty = properties.Where(prop => prop.Type.Name == inputType.Name).FirstOrDefault();
                if (inputModelProperty != null)
                {
                    return GetCSharpType(inputModelProperty.Type);
                }
                else
                {
                    throw new ArgumentException("Unsupported input type.");
                }
            });

            var inputModel = new InputModelType("TestModel", "TestModel", "public", null, "Test model.", InputModelTypeUsage.RoundTrip, properties, null, Array.Empty<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);

            var modelTypeProvider = new ModelProvider(inputModel);
            var ctors = modelTypeProvider.Constructors;
            Assert.IsNotNull(ctors);

            Assert.AreEqual(1, ctors.Count);

            var initializationCtor = ctors[0];
            Assert.AreEqual(MethodSignatureModifiers.Public, initializationCtor.Signature.Modifiers);
            Assert.AreEqual(3, initializationCtor.Signature.Parameters.Count);
        }

        [Test]
        public void BuildConstructor_ValidateConstructorsInDerivedModel()
        {
            var baseProperties = new List<InputModelProperty>
            {
                new InputModelProperty("prop1", "prop1", string.Empty, InputPrimitiveType.String, true, false, false),
                new InputModelProperty("prop2", "prop2", string.Empty, InputPrimitiveType.String, false, false, false),
            };
            var derivedProperties = new List<InputModelProperty>
            {
                new InputModelProperty("prop3", "prop3", string.Empty, InputPrimitiveType.String, true, false, false),
                new InputModelProperty("prop4", "prop4", string.Empty, InputPrimitiveType.String, false, false, false),
            };
            var inputBase = new InputModelType("baseModel", "baseModel", null, null, null, InputModelTypeUsage.Input, baseProperties, null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var inputDerived = new InputModelType("derivedModel", "derivedModel", null, null, null, InputModelTypeUsage.Input, derivedProperties, inputBase, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);

            MockHelpers.LoadMockPlugin();

            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputDerived);

            var baseCtors = baseModel.Constructors;
            Assert.AreEqual(1, baseCtors.Count);
            var derivedCtors = derivedModel.Constructors;
            Assert.AreEqual(1, derivedCtors.Count);

            var baseCtor = baseCtors[0];
            var derivedCtor = derivedCtors[0];
            var baseParameters = baseCtor.Signature.Parameters;
            var derivedParameters = derivedCtor.Signature.Parameters;
            Assert.AreEqual(1, baseParameters.Count);
            Assert.AreEqual("prop1", baseParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), baseParameters[0].Type);
            Assert.AreEqual(2, derivedParameters.Count);
            Assert.AreEqual("prop1", derivedParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[0].Type);
            Assert.AreEqual("prop3", derivedParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[1].Type);
        }

        [Test]
        public void BuildBaseType()
        {
            var inputBase = new InputModelType("baseModel", "baseModel", null, null, null, InputModelTypeUsage.Input, [], null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            var inputDerived = new InputModelType("derivedModel", "derivedModel", null, null, null, InputModelTypeUsage.Input, [], inputBase, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);

            MockHelpers.LoadMockPlugin();

            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputDerived);

            Assert.AreEqual(baseModel.Type, derivedModel.Type.BaseType);
        }

        [Test]
        public void BuildModelAsStruct()
        {
            var properties = new List<InputModelProperty>
            {
                new InputModelProperty("requiredString", "requiredString", "", InputPrimitiveType.String, true, false, false),
                new InputModelProperty("OptionalInt", "optionalInt", "", InputPrimitiveType.Int32, false, false, false),
            };

            MockHelpers.LoadMockPlugin(createCSharpTypeCore: (InputType inputType) =>
            {
                // Lookup the inputType in the list and return the corresponding CSharpType
                var inputModelProperty = properties.Where(prop => prop.Type.Name == inputType.Name).FirstOrDefault();
                if (inputModelProperty != null)
                {
                    return GetCSharpType(inputModelProperty.Type);
                }
                else
                {
                    throw new ArgumentException("Unsupported input type.");
                }
            });

            var inputModel = new InputModelType("TestModel", "TestModel", "public", null, "Test model.", InputModelTypeUsage.RoundTrip, properties, null, Array.Empty<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, modelAsStruct: true);

            var modelTypeProvider = new ModelProvider(inputModel);
            Assert.AreEqual(TypeSignatureModifiers.Public | TypeSignatureModifiers.Struct | TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly, modelTypeProvider.DeclarationModifiers);
        }
    }
}
