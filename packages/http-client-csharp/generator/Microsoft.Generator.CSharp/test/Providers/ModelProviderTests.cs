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

            var inputModel = InputFactory.Model("mockInputModel", properties: props);
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
                    InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String)),
                    new CSharpType(typeof(IList<string>)),
                    false);
                // read only list property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String), isReadOnly: true),
                    new CSharpType(typeof(IReadOnlyList<string>)),
                    false);
                // nullable list property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String)),
                    new CSharpType(typeof(IList<string>), true),
                    true);
                // dictionary property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputFactory.Dictionary(InputPrimitiveType.String)),
                    new CSharpType(typeof(IDictionary<string, string>)),
                    false);
                // nullable dictionary property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputFactory.Dictionary(InputPrimitiveType.String)),
                    new CSharpType(typeof(IDictionary<string, string>), true),
                    true);
                // primitive type property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputPrimitiveType.String),
                    new CSharpType(typeof(string)),
                    true);
                // read only primitive type property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputPrimitiveType.String, isReadOnly: true),
                    new CSharpType(typeof(string)),
                    false);
                // readonlymemory property
                yield return new TestCaseData(
                    InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String)),
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
        public void TestBuildConstructor_ValidateConstructors()
        {
            var properties = new List<InputModelProperty>
            {
                InputFactory.Property("requiredString", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("OptionalInt", InputPrimitiveType.Int32),
                InputFactory.Property("requiredCollection", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
                InputFactory.Property("requiredDictionary", InputFactory.Dictionary(InputPrimitiveType.String), isRequired: true),
                InputFactory.Property("optionalUnknown", InputPrimitiveType.Any)
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

            var inputModel = InputFactory.Model("TestModel", properties: properties);

            var modelTypeProvider = new ModelProvider(inputModel);
            var ctors = modelTypeProvider.Constructors;
            Assert.IsNotNull(ctors);

            Assert.AreEqual(2, ctors.Count);

            var initializationCtor = ctors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(initializationCtor);
            Assert.AreEqual(MethodSignatureModifiers.Public, initializationCtor!.Signature.Modifiers);
            Assert.AreEqual(3, initializationCtor.Signature.Parameters.Count);

            var secondaryCtor = ctors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(secondaryCtor);
            Assert.AreEqual(6, secondaryCtor!.Signature.Parameters.Count);
        }

        [Test]
        public void TestBuildConstructor_ValidateConstructorsInDerivedModel()
        {
            var baseProperties = new List<InputModelProperty>
            {
                InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("prop2", InputPrimitiveType.String)
            };
            var derivedProperties = new List<InputModelProperty>
            {
                InputFactory.Property("prop3", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("prop4", InputPrimitiveType.String)
            };
            var inputBase = InputFactory.Model("baseModel", usage: InputModelTypeUsage.Input, properties: baseProperties);
            var inputDerived = InputFactory.Model("derivedModel", usage: InputModelTypeUsage.Input, properties: derivedProperties, baseModel: inputBase);
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);

            MockHelpers.LoadMockPlugin();

            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputDerived);

            Assert.NotNull(baseModel);
            var baseCtors = baseModel!.Constructors;
            Assert.AreEqual(2, baseCtors.Count);
            Assert.NotNull(derivedModel);
            var derivedCtors = derivedModel!.Constructors;
            Assert.AreEqual(2, derivedCtors.Count);

            var baseCtor = baseCtors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            var derivedCtor = derivedCtors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.NotNull(baseCtor);
            Assert.NotNull(derivedCtor);

            var baseParameters = baseCtor!.Signature.Parameters;
            var derivedParameters = derivedCtor!.Signature.Parameters;
            Assert.AreEqual(1, baseParameters.Count);
            Assert.AreEqual("prop1", baseParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), baseParameters[0].Type);
            Assert.AreEqual(2, derivedParameters.Count);
            Assert.AreEqual("prop1", derivedParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[0].Type);
            Assert.AreEqual("prop3", derivedParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedParameters[1].Type);

            // validate the secondary constructor
            var secondaryCtor = baseCtors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            var derivedSecondaryCtor = derivedCtors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.NotNull(secondaryCtor);
            Assert.NotNull(derivedSecondaryCtor);

            var secondaryCtorParameters = secondaryCtor!.Signature.Parameters;
            var derivedSecondaryCtorParams = derivedSecondaryCtor!.Signature.Parameters;

            // validate secondary constructor
            Assert.AreEqual(3, secondaryCtorParameters.Count); // 2 properties + 1 additionalRawData
            Assert.AreEqual("prop1", secondaryCtorParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), secondaryCtorParameters[0].Type);
            Assert.AreEqual("prop2", secondaryCtorParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), secondaryCtorParameters[1].Type);
            Assert.AreEqual("serializedAdditionalRawData", secondaryCtorParameters[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), secondaryCtorParameters[2].Type);
            // validate derived secondary constructor
            Assert.AreEqual(5, derivedSecondaryCtorParams.Count); // all base props + 2 properties + 1 additionalRawData
            Assert.AreEqual("prop1", derivedSecondaryCtorParams[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedSecondaryCtorParams[0].Type);
            Assert.AreEqual("prop2", derivedSecondaryCtorParams[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedSecondaryCtorParams[1].Type);
            Assert.AreEqual("serializedAdditionalRawData", derivedSecondaryCtorParams[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), derivedSecondaryCtorParams[2].Type);
            Assert.AreEqual("prop3", derivedSecondaryCtorParams[3].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedSecondaryCtorParams[3].Type);
            Assert.AreEqual("prop4", derivedSecondaryCtorParams[4].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedSecondaryCtorParams[4].Type);
        }

        [Test]
        public void TestBuildSecondaryConstructor()
        {
            var inputModel = InputFactory.Model("TestModel", properties: []);
            var modelTypeProvider = new ModelProvider(inputModel);
            var secondaryConstructor = modelTypeProvider.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));

            Assert.IsNotNull(secondaryConstructor);
            var constructorSignature = secondaryConstructor?.Signature;
            Assert.IsNotNull(constructorSignature);
            Assert.AreEqual(1, constructorSignature?.Parameters.Count);

            var param = constructorSignature?.Parameters[0];
            Assert.IsNotNull(param);
            Assert.AreEqual("serializedAdditionalRawData", param?.Name);
        }

        [Test]
        public void BuildBaseType()
        {
            MockHelpers.LoadMockPlugin();

            var inputBase = InputFactory.Model("baseModel", usage: InputModelTypeUsage.Input, properties: []);
            var inputDerived = InputFactory.Model("derivedModel", usage: InputModelTypeUsage.Input, properties: [], baseModel: inputBase);
            ((List<InputModelType>)inputBase.DerivedModels).Add(inputDerived);

            var baseModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelPlugin.Instance.TypeFactory.CreateModel(inputDerived);

            Assert.AreEqual(baseModel!.Type, derivedModel!.Type.BaseType);
        }

        [Test]
        public void BuildModelAsStruct()
        {
            var properties = new List<InputModelProperty>
            {
                InputFactory.Property("requiredString", InputPrimitiveType.String, isRequired: true),
                InputFactory.Property("OptionalInt", InputPrimitiveType.Int32)
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

            var inputModel = InputFactory.Model("TestModel", properties: properties, modelAsStruct: true);

            var modelTypeProvider = new ModelProvider(inputModel);
            Assert.AreEqual(TypeSignatureModifiers.Public | TypeSignatureModifiers.Struct | TypeSignatureModifiers.Partial | TypeSignatureModifiers.ReadOnly, modelTypeProvider.DeclarationModifiers);
        }

        [Test]
        public void TestBuildFields()
        {
            var inputModel = InputFactory.Model("TestModel", properties: []);
            var modelTypeProvider = new ModelProvider(inputModel);
            var fields = modelTypeProvider.Fields;

            // Assert
            Assert.IsNotNull(fields);
            Assert.AreEqual(1, fields.Count);
            Assert.AreEqual("_serializedAdditionalRawData", fields[0].Name);

            var type = fields[0].Type;
            Assert.IsTrue(type.IsCollection);
        }
    }
}
