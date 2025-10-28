// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelProviders
{
    public class ModelProviderTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestBuildProperties_ValidateInheritHierarchyWithOverride()
        {
            var baseProp1 = InputFactory.Property("prop1", InputPrimitiveType.String);
            var baseModel = InputFactory.Model("baseModel", properties: [baseProp1]);
            var derivedModel1 = InputFactory.Model("derivedModel1", baseModel: baseModel);
            var derivedProp1 = InputFactory.Property("prop1", new InputPrimitiveType(InputPrimitiveTypeKind.String, "string", "TypeSpec.string"));
            var derivedModel2 = InputFactory.Model("derivedModel2", properties: [derivedProp1], baseModel: derivedModel1);
            MockHelpers.LoadMockGenerator(inputModelTypes: [baseModel, derivedModel1, derivedModel2]);
            var derivedModel2Provider = new ModelProvider(derivedModel2);
            Assert.AreEqual(1, derivedModel2Provider.Properties.Count);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Override, derivedModel2Provider.Properties[0].Modifiers);
        }

        [Test]
        public void TestBuildProperties_ValidateInheritHierarchyWithNew()
        {
            var stringProp1 = InputFactory.Property("prop1", InputPrimitiveType.String);
            var baseModel = InputFactory.Model("baseModel", properties: [stringProp1]);
            var derivedModel1 = InputFactory.Model("derivedModel1", baseModel: baseModel);
            var intProp1 = InputFactory.Property("prop1", InputPrimitiveType.Int32);
            var derivedModel2 = InputFactory.Model("derivedModel2", properties: [intProp1], baseModel: derivedModel1);
            MockHelpers.LoadMockGenerator(inputModelTypes: [baseModel, derivedModel1, derivedModel2]);

            var derivedModel2Provider = new ModelProvider(derivedModel2);
            Assert.AreEqual(1, derivedModel2Provider.Properties.Count);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.New, derivedModel2Provider.Properties[0].Modifiers);
            var baseModelProvider = new ModelProvider(baseModel);
            var prop1Field = baseModelProvider.Fields.FirstOrDefault(f => f.Name == "_prop1");
            Assert.NotNull(prop1Field);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Protected, prop1Field!.Modifiers);
        }

        // Validates that the property body's setter is correctly set based on the property type
        [TestCaseSource(nameof(BuildProperties_ValidatePropertySettersTestCases))]
        public void TestBuildProperties_ValidatePropertySetters(InputModelProperty inputModelProperty, CSharpType type, bool hasSetter)
        {
            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (inputType) => type);

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

        [Test]
        public void TestBuildProperties_WithAdditionalProperties()
        {
            var additionalProperties = InputPrimitiveType.String;
            var baseProperties = new List<InputModelProperty>
            {
                InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true),
            };
            var derivedProperties = new List<InputModelProperty>
            {
                InputFactory.Property("prop2", InputPrimitiveType.String, isRequired: true),
            };
            var inputDerived = InputFactory.Model("derivedModel", usage: InputModelTypeUsage.Input, properties: derivedProperties);
            var inputBase = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Input,
                properties: baseProperties,
                additionalProperties: additionalProperties);

            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputDerived);

            Assert.NotNull(baseModel);
            Assert.NotNull(derivedModel);

            var baseModelProperties = baseModel!.Properties;

            Assert.IsNotNull(baseModelProperties);
            Assert.AreEqual(2, baseModelProperties.Count);

            var baseAdditionalPropertiesProp = baseModelProperties.FirstOrDefault(p => p.Name == "AdditionalProperties");
            Assert.IsNotNull(baseAdditionalPropertiesProp);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, string>)), baseAdditionalPropertiesProp!.Type);

            var derivedModelProperties = derivedModel!.Properties;
            Assert.AreEqual(1, derivedModelProperties.Count);
        }

        [Test]
        public void TestBuildProperties_WithReadOnlyAdditionalProperties()
        {
            var additionalProperties = InputPrimitiveType.Any;

            var inputBase = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Output,
                properties: [],
                additionalProperties: additionalProperties);

            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase);

            Assert.NotNull(baseModel);

            var baseModelProperties = baseModel!.Properties;

            Assert.IsNotNull(baseModelProperties);
            Assert.AreEqual(1, baseModelProperties.Count);

            var baseAdditionalPropertiesProp = baseModelProperties.FirstOrDefault(p => p.Name == "AdditionalProperties");
            Assert.IsNotNull(baseAdditionalPropertiesProp);
            Assert.AreEqual(new CSharpType(typeof(IReadOnlyDictionary<string, BinaryData>)), baseAdditionalPropertiesProp!.Type);

            // validate the serialization ctor
            var serializationCtor = baseModel.FullConstructor;
            Assert.IsNotNull(serializationCtor);

            var parameters = serializationCtor.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);
            var parameter = parameters.First();
            Assert.AreEqual("additionalProperties", parameter.Name);
            Assert.IsTrue(parameter.Type.IsReadOnlyDictionary);

            var body = serializationCtor.BodyStatements!.ToDisplayString();
            Assert.IsTrue(body.Contains("_additionalBinaryDataProperties = new global::Sample.ChangeTrackingDictionary<string, global::System.BinaryData>(additionalProperties);"));
        }

        [Test]
        public void ValidateListParameterHandlingInConstructor()
        {
            var properties = new List<InputModelProperty>
            {
                InputFactory.Property("prop1", InputFactory.Array(InputPrimitiveType.String), isRequired: true),
            };

            var inputModel = InputFactory.Model(
                "model",
                usage: InputModelTypeUsage.Input,
                properties: properties);

            var model = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);

            Assert.NotNull(model);
            Assert.IsNotNull(model);
            Assert.AreEqual(1, model!.Properties.Count);

            var fullCtor = model.Constructors.Last();
            Assert.IsTrue(fullCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            // the internal full ctor should use IList
            Assert.IsTrue(fullCtor.Signature.Parameters.First().Type.Equals(typeof(IList<string>)));

            var publicCtor = model.Constructors.First();
            Assert.IsTrue(publicCtor.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            // the public ctor should use IEnumerable
            Assert.IsTrue(publicCtor.Signature.Parameters.First().Type.Equals(typeof(IEnumerable<string>)));
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
                InputPrimitiveTypeKind.Unknown => typeof(BinaryData),
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

            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (InputType inputType) =>
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
            var additionalProperties = InputPrimitiveType.String;
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
            var inputDerived = InputFactory.Model("derivedModel", usage: InputModelTypeUsage.Input, properties: derivedProperties);
            var inputBase = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Input,
                properties: baseProperties,
                derivedModels: [inputDerived],
                additionalProperties: additionalProperties);

            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputDerived);

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
            Assert.AreEqual(4, secondaryCtorParameters.Count); // 2 properties + 1 additionalRawData + additional props
            Assert.AreEqual("prop1", secondaryCtorParameters[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), secondaryCtorParameters[0].Type);
            Assert.AreEqual("prop2", secondaryCtorParameters[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), secondaryCtorParameters[1].Type);
            Assert.AreEqual("additionalProperties", secondaryCtorParameters[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, string>)), secondaryCtorParameters[2].Type);
            Assert.AreEqual("additionalBinaryDataProperties", secondaryCtorParameters[3].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), secondaryCtorParameters[3].Type);
            // validate derived secondary constructor
            Assert.AreEqual(6, derivedSecondaryCtorParams.Count); // all base props + 2 properties + 1 additionalRawData + additional props
            Assert.AreEqual("prop1", derivedSecondaryCtorParams[0].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedSecondaryCtorParams[0].Type);
            Assert.AreEqual("prop2", derivedSecondaryCtorParams[1].Name);
            Assert.AreEqual(new CSharpType(typeof(string), true), derivedSecondaryCtorParams[1].Type);
            Assert.AreEqual("additionalProperties", derivedSecondaryCtorParams[2].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, string>)), derivedSecondaryCtorParams[2].Type);
            Assert.AreEqual("additionalBinaryDataProperties", derivedSecondaryCtorParams[3].Name);
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), derivedSecondaryCtorParams[3].Type);
            Assert.AreEqual("prop3", derivedSecondaryCtorParams[4].Name);
            Assert.AreEqual(new CSharpType(typeof(string)), derivedSecondaryCtorParams[4].Type);
            Assert.AreEqual("prop4", derivedSecondaryCtorParams[5].Name);
            Assert.AreEqual(new CSharpType(typeof(string), isNullable: true), derivedSecondaryCtorParams[5].Type);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void TestBuildSecondaryConstructor(bool containsAdditionalProperties)
        {
            InputType? additionalProperties = containsAdditionalProperties ? InputPrimitiveType.Int64 : null;
            var inputModel = InputFactory.Model("TestModel", properties: [], additionalProperties: additionalProperties);
            var modelTypeProvider = new ModelProvider(inputModel);
            var secondaryConstructor = modelTypeProvider.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));

            Assert.IsNotNull(secondaryConstructor);
            var constructorSignature = secondaryConstructor?.Signature;
            Assert.IsNotNull(constructorSignature);

            if (containsAdditionalProperties)
            {
                Assert.AreEqual(2, constructorSignature?.Parameters.Count);
                var additionalPropertiesParam = constructorSignature?.Parameters[0];
                Assert.IsNotNull(additionalPropertiesParam);
                Assert.AreEqual("additionalProperties", additionalPropertiesParam?.Name);
                Assert.AreEqual(new CSharpType(typeof(IDictionary<string, long>)), additionalPropertiesParam?.Type);
                var rawDataParam = constructorSignature?.Parameters[1];
                Assert.IsNotNull(rawDataParam);
                Assert.AreEqual("additionalBinaryDataProperties", rawDataParam?.Name);
            }
            else
            {
                Assert.AreEqual(1, constructorSignature?.Parameters.Count);
                var param = constructorSignature?.Parameters[0];
                Assert.IsNotNull(param);
                Assert.AreEqual("additionalBinaryDataProperties", param?.Name);
            }
        }

        [Test]
        public void BuildBaseType()
        {
            var inputDerived = InputFactory.Model("derivedModel", usage: InputModelTypeUsage.Input, properties: []);
            var inputBase = InputFactory.Model("baseModel", usage: InputModelTypeUsage.Input, properties: [], derivedModels: [inputDerived]);

            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputBase);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputDerived);

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

            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (InputType inputType) =>
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

        [TestCase(true, true)]
        [TestCase(true, false)]
        [TestCase(false, true)]
        [TestCase(false, false)]
        public void TestBuildFields(bool containsMixedAdditionalProperties, bool modelAsStruct)
        {
            InputType? additionalProperties = containsMixedAdditionalProperties
                ? InputFactory.Union([InputPrimitiveType.Float64, InputPrimitiveType.Int64, InputPrimitiveType.String])
                : null;
            var inputModel = InputFactory.Model("TestModel", properties: [], additionalProperties: additionalProperties, modelAsStruct: modelAsStruct);
            var modelTypeProvider = new ModelProvider(inputModel);
            var fields = modelTypeProvider.Fields;

            Assert.IsNotNull(fields);

            if (containsMixedAdditionalProperties)
            {
                Assert.AreEqual(4, fields.Count);
                ValidateAdditionalPropertiesField(fields[0], modelAsStruct);
                Assert.AreEqual("_additionalDoubleProperties", fields[1].Name);
                Assert.AreEqual(new CSharpType(typeof(IDictionary<string, double>)), fields[1].Type);
                Assert.AreEqual("_additionalInt64Properties", fields[2].Name);
                Assert.AreEqual(new CSharpType(typeof(IDictionary<string, long>)), fields[2].Type);
                Assert.AreEqual("_additionalStringProperties", fields[3].Name);
                Assert.AreEqual(new CSharpType(typeof(IDictionary<string, string>)), fields[3].Type);
            }
            else
            {
                ValidateAdditionalPropertiesField(fields[0], modelAsStruct);
            }
        }

        private static void ValidateAdditionalPropertiesField(FieldProvider field, bool isStruct)
        {
            Assert.AreEqual("_additionalBinaryDataProperties", field.Name);
            Assert.IsTrue(field.Modifiers.HasFlag(FieldModifiers.Private));
            Assert.AreEqual(!isStruct, field.Modifiers.HasFlag(FieldModifiers.Protected));
            Assert.IsTrue(field.Modifiers.HasFlag(FieldModifiers.ReadOnly));
            Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), field.Type);
        }

        [TestCaseSource(nameof(BuildAdditionalPropertiesTestCases))]
        public void TestBuildAdditionalProperties(
            InputModelType inputModel,
            bool isUnverifiableType,
            int expectedPropertyCount)
        {
            var modelTypeProvider = new ModelProvider(inputModel);

            var additionalPropertiesProps = modelTypeProvider.Properties.Where(f => f.Name.StartsWith("Additional")).ToList();
            Assert.AreEqual(expectedPropertyCount, additionalPropertiesProps.Count);

            foreach (var additionalPropertiesProp in additionalPropertiesProps)
            {
                var additionalPropertiesType = additionalPropertiesProp!.Type;
                Assert.IsTrue(additionalPropertiesType.IsDictionary);

                if (isUnverifiableType)
                {
                    Assert.AreEqual(new CSharpType(typeof(IDictionary<string, BinaryData>)), additionalPropertiesType);
                }
                if (!inputModel.Usage.HasFlag(InputModelTypeUsage.Input))
                {
                    Assert.IsTrue(additionalPropertiesType.IsReadOnlyDictionary);
                    // validate the assignment
                    var body = additionalPropertiesProp.Body as ExpressionPropertyBody;
                    Assert.NotNull(body);
                    Assert.IsTrue(body!.Getter.ToDisplayString().StartsWith(
                        "new global::System.Collections.ObjectModel.ReadOnlyDictionary<string,"));
                }
            }
        }

        [Test]
        public void TestAdditionalPropertiesPropertyNamesAndAccessors()
        {
            // model with multiple additional properties
            var inputModelWithMultipleAp = InputFactory.Model(
                "TestModel",
                properties: [],
                additionalProperties: InputFactory.Union([InputPrimitiveType.String, InputPrimitiveType.Int32]));
            var modelWithMultipleAp = new ModelProvider(inputModelWithMultipleAp);
            var additionalProperties1 = modelWithMultipleAp.Properties.Where(f => f.Name.StartsWith("Additional")).ToList();

            Assert.AreEqual(2, additionalProperties1.Count);
            // validate modifiers
            Assert.IsTrue(additionalProperties1[0]!.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(additionalProperties1[1]!.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            // validate names
            Assert.AreEqual("AdditionalProperties", additionalProperties1[0].Name);
            Assert.AreEqual("AdditionalInt32Properties", additionalProperties1[1].Name);
            // validate getters
            var stringAdditionalPropertyGetter = additionalProperties1[0]!.Body as ExpressionPropertyBody;
            Assert.NotNull(stringAdditionalPropertyGetter);
            Assert.IsTrue(stringAdditionalPropertyGetter!.Getter.ToDisplayString().Equals("_additionalStringProperties"));
            var int32AdditionalPropertyGetter = additionalProperties1[1]!.Body as ExpressionPropertyBody;
            Assert.NotNull(int32AdditionalPropertyGetter);
            Assert.IsTrue(int32AdditionalPropertyGetter!.Getter.ToDisplayString().Equals("_additionalInt32Properties"));

            // model with single additional property
            var inputModelWithSingleAp = InputFactory.Model(
                "TestModel",
                properties: [],
                additionalProperties: InputPrimitiveType.String);
            var modelWithSingleAp = new ModelProvider(inputModelWithSingleAp);
            var additionalProperties2 = modelWithSingleAp.Properties.Where(f => f.Name.StartsWith("Additional")).ToList();

            Assert.AreEqual(1, additionalProperties2.Count);
            // validate modifiers
            Assert.IsTrue(additionalProperties2[0]!.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            // validate names
            Assert.AreEqual("AdditionalProperties", additionalProperties2[0].Name);
            // validate getters
            var singleAdditionalPropertyGetter = additionalProperties2[0]!.Body as ExpressionPropertyBody;
            Assert.NotNull(singleAdditionalPropertyGetter);
            Assert.IsTrue(singleAdditionalPropertyGetter!.Getter.ToDisplayString().Equals("_additionalStringProperties"));

            // model with no additional properties
            var inputModelWithNoAp = InputFactory.Model("TestModel", properties: []);
            var modelWithNoAp = new ModelProvider(inputModelWithNoAp);
            var additionalProperties3 = modelWithNoAp.Properties.Where(f => f.Name.StartsWith("Additional")).ToList();
            Assert.AreEqual(0, additionalProperties3.Count);

        }

        public static IEnumerable<TestCaseData> BuildAdditionalPropertiesTestCases
        {
            get
            {
                // verifiable type
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputPrimitiveType.String), false, 1);
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputFactory.Array(InputPrimitiveType.String)), false, 1);
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputFactory.Dictionary(InputPrimitiveType.String)), false, 1);
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputFactory.Union([InputPrimitiveType.String, InputPrimitiveType.Int32])), false, 2);
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputFactory.Union([InputPrimitiveType.String, InputPrimitiveType.Int32, InputFactory.Model("foo")])), false, 3);
                // output model
                yield return new TestCaseData(InputFactory.Model("TestModel", usage: InputModelTypeUsage.Output, properties: [], additionalProperties: InputPrimitiveType.String), false, 1);

                // non-verifiable type
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputPrimitiveType.Any), true, 1);
                yield return new TestCaseData(InputFactory.Model("TestModel", properties: [], additionalProperties: InputFactory.Model("foo")), true, 1);
            }
        }

        [Test]
        public void DuplicatePropertyHasVirtualAndOverrideKeyword()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedProp = derivedModel!.Properties[0];
            var baseProp = baseModel!.Properties[0];

            Assert.AreEqual(baseProp.Name, derivedProp.Name);
            Assert.AreEqual(baseProp.Type, derivedProp.Type);
            Assert.IsNotNull(baseProp.WireInfo);
            Assert.IsNotNull(derivedProp.WireInfo);
            Assert.AreEqual(baseProp.WireInfo!.IsRequired, derivedProp.WireInfo!.IsRequired);
            Assert.IsTrue(baseProp.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
            Assert.IsTrue(derivedProp.Modifiers.HasFlag(MethodSignatureModifiers.Override));
            Assert.IsFalse(baseProp.Modifiers.HasFlag(MethodSignatureModifiers.Override));
            Assert.IsFalse(derivedProp.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
        }

        [Test]
        public void OptionalityChangeNarrowPropertyHasNewKeyword()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedProp = derivedModel!.Properties[0];
            var baseProp = baseModel!.Properties[0];
            Assert.AreEqual(baseProp.Name, derivedProp.Name);
            Assert.IsTrue(baseProp.Type.Equals(derivedProp.Type, ignoreNullable: true));
            Assert.IsNotNull(baseProp.WireInfo);
            Assert.IsNotNull(derivedProp.WireInfo);
            Assert.IsFalse(baseProp.WireInfo!.IsRequired);
            Assert.IsTrue(derivedProp.WireInfo!.IsRequired);
            Assert.IsTrue(derivedProp.Modifiers.HasFlag(MethodSignatureModifiers.New));
            Assert.IsFalse(baseProp.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
            Assert.IsFalse(baseProp.Modifiers.HasFlag(MethodSignatureModifiers.New));
            Assert.IsFalse(derivedProp.Modifiers.HasFlag(MethodSignatureModifiers.Override));
        }

        [Test]
        public void TypeChangeNarrowPropertyHasNewKeyWord()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int32)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int64)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedProp = derivedModel!.Properties[0];
            var baseProp = baseModel!.Properties[0];
            Assert.AreEqual(baseProp.Name, derivedProp.Name);
            Assert.IsFalse(baseProp.Type.Equals(derivedProp.Type, ignoreNullable: true));
            Assert.IsNotNull(baseProp.WireInfo);
            Assert.IsNotNull(derivedProp.WireInfo);
            Assert.AreEqual(baseProp.WireInfo!.IsRequired, derivedProp.WireInfo!.IsRequired);
            Assert.IsTrue(derivedProp.Modifiers.HasFlag(MethodSignatureModifiers.New));
            Assert.IsFalse(baseProp.Modifiers.HasFlag(MethodSignatureModifiers.Virtual));
            Assert.IsFalse(baseProp.Modifiers.HasFlag(MethodSignatureModifiers.New));
            Assert.IsFalse(derivedProp.Modifiers.HasFlag(MethodSignatureModifiers.Override));
        }

        [Test]
        public void BaseHasFieldWhenPropertyIsNarrowed()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int32)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int64)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var baseField = baseModel!.Fields.FirstOrDefault(f => f.Name == "_prop1");
            Assert.IsNotNull(baseField);
            Assert.AreEqual(new CSharpType(typeof(long)), baseField!.Type);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Protected, baseField.Modifiers);
        }

        [Test]
        public void DerivedUsesExpressionBodyPropertyWhenNarrowed()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int32)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int64)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedProp = derivedModel!.Properties[0];
            Assert.IsNotNull(derivedProp);
            var expressionBody = derivedProp.Body as ExpressionPropertyBody;
            Assert.IsNotNull(expressionBody);
            Assert.IsTrue(expressionBody!.Getter.ToDisplayString().Contains("_prop1 ?? default"));
            Assert.IsTrue(expressionBody.HasSetter);
            Assert.IsTrue(expressionBody.Setter!.ToDisplayString().Contains("_prop1 = value"));
        }

        [Test]
        public void DerivedExpressionBodyDoesNotHaveSetterWhenNarrowed()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("prop1", InputPrimitiveType.Int32, isReadOnly: true)]);
            var baseInputModel = InputFactory.Model("baseModel", usage: InputModelTypeUsage.Output, properties: [InputFactory.Property("prop1", InputPrimitiveType.Int64, isReadOnly: true)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedProp = derivedModel!.Properties[0];
            Assert.IsNotNull(derivedProp);
            var expressionBody = derivedProp.Body as ExpressionPropertyBody;
            Assert.IsNotNull(expressionBody);
            Assert.IsTrue(expressionBody!.Getter.ToDisplayString().Contains("_prop1 ?? default"));
            Assert.IsFalse(expressionBody.HasSetter);
            Assert.IsNull(expressionBody.Setter);
        }

        [Test]
        public void InitCtorShouldAssignBaseFieldDerivedRequired()
        {
            MockHelpers.LoadMockGenerator();
            var enumType = InputFactory.StringEnum("enumType", [("value1", "value1")]);
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", enumType, isRequired: true)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(derivedCtor);
            var baseField = baseModel!.Fields.FirstOrDefault(f => f.Name == "_prop1");
            Assert.IsNotNull(baseField);
            Assert.AreEqual(new CSharpType(typeof(string)), baseField!.Type);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Protected, baseField.Modifiers);
            var statements = derivedCtor!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsTrue(statements!.Statements.Any(s => s.ToDisplayString().Contains("_prop1 =")));
            var initializer = derivedCtor.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsTrue(initializer!.IsBase);
            foreach (var arg in initializer.Arguments)
            {
                Assert.IsFalse(arg.ToDisplayString().Contains("prop1"));
            }
        }

        [Test]
        public void SerializationCtorShouldNotAssignBaseFieldDerivedRequired()
        {
            MockHelpers.LoadMockGenerator();
            var enumType = InputFactory.StringEnum("enumType", [("value1", "value1")]);
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", enumType, isRequired: true)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var serializationCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            var baseField = baseModel!.Fields.FirstOrDefault(f => f.Name == "_prop1");
            Assert.IsNotNull(baseField);
            Assert.AreEqual(new CSharpType(typeof(string)), baseField!.Type);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Protected, baseField.Modifiers);
            var statements = serializationCtor!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsFalse(statements!.Statements.Any(s => s.ToDisplayString().Contains("_prop1 =")));
            var initializer = serializationCtor.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsTrue(initializer!.IsBase);
            Assert.AreEqual("prop1.ToSerialString()", initializer.Arguments[0].ToDisplayString());
        }

        [Test]
        public void InitCtorShouldNotAssignBaseFieldBothRequired()
        {
            MockHelpers.LoadMockGenerator();
            var enumType = InputFactory.StringEnum("enumType", [("value1", "value1")]);
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", enumType, isRequired: true)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String, isRequired: true)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(derivedCtor);
            var baseField = baseModel!.Fields.FirstOrDefault(f => f.Name == "_prop1");
            Assert.IsNotNull(baseField);
            Assert.AreEqual(new CSharpType(typeof(string)), baseField!.Type);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Protected, baseField.Modifiers);
            var statements = derivedCtor!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsFalse(statements!.Statements.Any(s => s.ToDisplayString().Contains("_prop1 =")));
        }

        [Test]
        public void SerializationCtorShouldNotAssignBaseField()
        {
            MockHelpers.LoadMockGenerator();
            var enumType = InputFactory.StringEnum("enumType", [("value1", "value1")]);
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", enumType)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(derivedCtor);
            var baseField = baseModel!.Fields.FirstOrDefault(f => f.Name == "_prop1");
            Assert.IsNotNull(baseField);
            Assert.AreEqual(new CSharpType(typeof(string)), baseField!.Type);
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.Protected, baseField.Modifiers);
            var statements = derivedCtor!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsFalse(statements!.Statements.Any(s => s.ToDisplayString().Contains("_prop1 =")));
        }

        [Test]
        public void SerializationCtorShouldNotDuplicateBaseProperties()
        {
            MockHelpers.LoadMockGenerator();

            // Updated to use StringEnum with collection expression for values
            var enumType = InputFactory.StringEnum(
                "enumType",
                [("value1", "value1")]
            );
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", enumType)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var serializationCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            Assert.AreEqual(2, serializationCtor!.Signature.Parameters.Count);
        }

        [Test]
        public void SerializationCtorInitializerHasToStringForEnumParam()
        {
            MockHelpers.LoadMockGenerator();

            // Updated to use StringEnum with collection expression for values
            var enumType = InputFactory.StringEnum(
                "enumType",
                [("value1", "value1")],
                isExtensible: true
            );
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", enumType)]);
            var baseInputModel = InputFactory.Model("baseModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.String)], derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var serializationCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(serializationCtor);
            var initializer = serializationCtor!.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsTrue(initializer!.IsBase);
            Assert.AreEqual("prop1?.ToString()", initializer.Arguments[0].ToDisplayString());
        }

        [Test]
        public void InitCtorInitializerShouldHaveCorrectParamName()
        {
            MockHelpers.LoadMockGenerator();
            var derivedInputModel = InputFactory.Model("derivedModel", properties: [InputFactory.Property("prop1", InputPrimitiveType.Int32, isRequired: true)]);
            var baseInputModel = InputFactory.Model(
                "baseModel",
                properties:
                [
                    InputFactory.Property("baseOnlyProp", InputPrimitiveType.Any, isRequired: true),
                    InputFactory.Property("prop1", InputPrimitiveType.Int64)
                ],
                derivedModels: [derivedInputModel]);
            var derivedModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(derivedInputModel);
            var baseModel = CodeModelGenerator.Instance.TypeFactory.CreateModel(baseInputModel);

            Assert.IsNotNull(derivedModel);
            Assert.IsNotNull(baseModel);

            var derivedCtor = derivedModel!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(derivedCtor);
            Assert.AreEqual(2, derivedCtor!.Signature.Parameters.Count);
            var initializer = derivedCtor.Signature.Initializer;
            Assert.IsNotNull(initializer);
            Assert.IsTrue(initializer!.IsBase);
            Assert.AreEqual("baseOnlyProp", initializer.Arguments[0].ToDisplayString());
        }

        [Test]
        public void TestBuildModelWithNonBodyPropertyKinds()
        {
            MockHelpers.LoadMockGenerator();
            var inputModel = InputFactory.Model(
               "ModelWithNonBodyPropertyKinds",
               properties:
               [
                    InputFactory.Property("foo", InputPrimitiveType.String, isRequired: true, isHttpMetadata: true),
                    InputFactory.Property("cat", InputPrimitiveType.String, serializedName: "x-cat", isRequired: true, isHttpMetadata: true),
                    InputFactory.Property("bird", InputPrimitiveType.String, isRequired : true, isHttpMetadata : true),
                    InputFactory.Property("snake", InputFactory.StringEnum("snake", [("value", "value")], isExtensible: true), isRequired: true, isReadOnly: true, isHttpMetadata: true),
                    InputFactory.Property("bar", InputPrimitiveType.Int32, isRequired: true)
               ]);
            var modelProvider = CodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);

            Assert.IsNotNull(modelProvider);

            var primaryCtor = modelProvider!.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsNotNull(primaryCtor);
            Assert.AreEqual(4, primaryCtor!.Signature.Parameters.Count);

            var properties = modelProvider.Properties;
            Assert.IsNotNull(properties);
            Assert.AreEqual(5, properties.Count);

            // validate snake
            var snake = properties.FirstOrDefault(p => p.Name.Equals("Snake"));
            Assert.IsNotNull(snake);
            var snakeBody = snake!.Body;
            Assert.IsNotNull(snakeBody);
            Assert.IsFalse(snakeBody!.HasSetter);
        }

        [Test]
        public void XmlDocsAreWritten()
        {
            MockHelpers.LoadMockGenerator(includeXmlDocs: true);
            var inputModel = InputFactory.Model(
                "TestModel",
                properties: [InputFactory.Property("prop1", InputPrimitiveType.String, doc: "This is prop1")]);
            var modelTypeProvider = new ModelProvider(inputModel);
            var writer = new TypeProviderWriter(modelTypeProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task BackCompat_ReadOnlyCollectionPropertiesAreRetained()
        {
            var inputModel = InputFactory.Model(
                "MockInputModel",
                properties:
                [
                    InputFactory.Property("items", InputFactory.Array(InputPrimitiveType.String)),
                    InputFactory.Property("moreItems", InputFactory.Dictionary(InputPrimitiveType.String))
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var itemsProperty = modelProvider!.Properties.FirstOrDefault(p => p.Name == "Items");
            Assert.IsNotNull(itemsProperty);
            Assert.IsTrue(itemsProperty!.Type.Equals(typeof(IReadOnlyList<string>)));

            var moreItemsProperty = modelProvider.Properties.FirstOrDefault(p => p.Name == "MoreItems");
            Assert.IsNotNull(moreItemsProperty);
            Assert.IsTrue(moreItemsProperty!.Type.Equals(typeof(IReadOnlyDictionary<string, string>)));
        }

        [TestCase(true)]
        [TestCase(false)]
        public async Task BackCompat_ReadOnlyCollectionModelPropertiesAreRetained(bool useStruct)
        {
            var elementModel = InputFactory.Model(
                "ElementModel",
                modelAsStruct: useStruct,
                properties:
                [
                    InputFactory.Property("name", InputPrimitiveType.String)
                ]);
            var inputModel = InputFactory.Model(
                "MockInputModel",
                properties:
                [
                    InputFactory.Property("items", InputFactory.Array(elementModel)),
                    InputFactory.Property("moreItems", InputFactory.Dictionary(elementModel))
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel, elementModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync(useStruct.ToString()));

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var elementModelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "ElementModel") as ModelProvider;

            var itemsProperty = modelProvider!.Properties.FirstOrDefault(p => p.Name == "Items");
            Assert.IsNotNull(itemsProperty);
            Assert.IsTrue(itemsProperty!.Type.Equals(new CSharpType(typeof(IReadOnlyList<>), elementModelProvider!.Type)));

            var moreItemsProperty = modelProvider.Properties.FirstOrDefault(p => p.Name == "MoreItems");
            Assert.IsNotNull(moreItemsProperty);
            Assert.IsTrue(moreItemsProperty!.Type.Equals(new CSharpType(typeof(IReadOnlyDictionary<,>), typeof(string), elementModelProvider.Type)));
        }

        [Test]
        public async Task BackCompat_ReadOnlyCollectionEnumPropertiesAreRetained()
        {
            var elementEnum = InputFactory.StringEnum(
                "ElementEnum",
                [("value1", "value1"), ("value2", "value2")],
                isExtensible: true);
            var inputModel = InputFactory.Model(
                "MockInputModel",
                properties:
                [
                    InputFactory.Property("items", InputFactory.Array(elementEnum)),
                    InputFactory.Property("moreItems", InputFactory.Dictionary(elementEnum))
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                inputEnumTypes: [elementEnum],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var elementEnumProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "ElementEnum") as EnumProvider;

            var itemsProperty = modelProvider!.Properties.FirstOrDefault(p => p.Name == "Items");
            Assert.IsNotNull(itemsProperty);
            Assert.IsTrue(itemsProperty!.Type.Equals(new CSharpType(typeof(IReadOnlyList<>), elementEnumProvider!.Type)));

            var moreItemsProperty = modelProvider.Properties.FirstOrDefault(p => p.Name == "MoreItems");
            Assert.IsNotNull(moreItemsProperty);
            Assert.IsTrue(moreItemsProperty!.Type.Equals(new CSharpType(typeof(IReadOnlyDictionary<,>), typeof(string), elementEnumProvider.Type)));
        }

        [Test]
        public async Task BackCompat_InternalTypesAreIgnored()
        {
            var inputModel = InputFactory.Model(
                "MockInputModel",
                properties:
                [
                    InputFactory.Property("items", InputFactory.Array(InputPrimitiveType.String)),
                    InputFactory.Property("moreItems", InputFactory.Dictionary(InputPrimitiveType.String))
                ]);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModelTypes: [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var itemsProperty = modelProvider!.Properties.FirstOrDefault(p => p.Name == "Items");
            Assert.IsNotNull(itemsProperty);
            Assert.IsTrue(itemsProperty!.Type.Equals(typeof(IList<string>)));

            var moreItemsProperty = modelProvider.Properties.FirstOrDefault(p => p.Name == "MoreItems");
            Assert.IsNotNull(moreItemsProperty);
            Assert.IsTrue(moreItemsProperty!.Type.Equals(typeof(IDictionary<string, string>)));
        }

        [Test]
        public void PublicModelsAreIncludedInAdditionalRootTypes()
        {
            var inputModel = InputFactory.Model(
                "MockInputModel",
                access: "public");

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [inputModel]);

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var rootTypes = CodeModelGenerator.Instance.AdditionalRootTypes;
            Assert.IsTrue(rootTypes.Contains("Sample.Models.MockInputModel"));
        }

        [Test]
        public void InternalModelsAreNotIncludedInAdditionalRootTypes()
        {
            var inputModel = InputFactory.Model(
                "MockInputModel",
                access: "internal");

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [inputModel]);

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var rootTypes = CodeModelGenerator.Instance.AdditionalRootTypes;
            Assert.IsFalse(rootTypes.Contains("Sample.Models.MockInputModel"));
        }

        [TestCase(true, true, InputModelTypeUsage.Output, true, false)]
        [TestCase(true, false, InputModelTypeUsage.Output, true, false)]
        [TestCase(false, true, InputModelTypeUsage.Output, true, false)]
        [TestCase(false, false,InputModelTypeUsage.Output, true, false)]
        [TestCase(true, true, InputModelTypeUsage.Input, true, false)]
        [TestCase(true, true, InputModelTypeUsage.Input | InputModelTypeUsage.Output, true, true)]
        [TestCase(true, false, InputModelTypeUsage.Input, false, false)]
        [TestCase(false, true, InputModelTypeUsage.Input, true, true)]
        [TestCase(false, false, InputModelTypeUsage.Input, true, true)]
        public void ConstantPropertiesAccessibility(
            bool isRequired,
            bool isNullable,
            InputModelTypeUsage usage,
            bool shouldBePublic,
            bool shouldHaveSetter)
        {
            var inputType = InputFactory.Literal.String("constant", "prop1");
            var inputModel = InputFactory.Model(
                "MockInputModel",
                usage: usage,
                properties:
                [
                    InputFactory.Property("prop1", isNullable? new InputNullableType(inputType) : inputType, isRequired: isRequired),
                ]);

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [inputModel]);

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "MockInputModel") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var prop = modelProvider!.Properties.FirstOrDefault(p => p.Name == "Prop1");
            Assert.IsNotNull(prop);
            Assert.AreEqual(shouldBePublic, prop!.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.AreEqual(shouldHaveSetter, prop.Body.HasSetter);
        }

        [Test]
        public void ExternalTypeModelUsedAsProperty()
        {
            // Test a model decorated with alternateType that references System.Uri
            var externalType = InputFactory.External("System.Uri");
            var modelWithExternal = InputFactory.Model("ExternalModel");

            // Create a model that uses the external type as a property
            var containerModel = InputFactory.Model(
                "ContainerModel",
                properties:
                [
                    InputFactory.Property("externalProp", externalType),
                    InputFactory.Property("normalProp", InputPrimitiveType.String)
                ]);

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [modelWithExternal, containerModel]);

            var containerProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .SingleOrDefault(t => t.Name == "ContainerModel") as ModelProvider;
            Assert.IsNotNull(containerProvider);

            // The property with external type should be resolved to System.Uri
            var externalProp = containerProvider!.Properties.FirstOrDefault(p => p.Name == "ExternalProp");
            Assert.IsNotNull(externalProp);
            Assert.AreEqual(typeof(Uri), externalProp!.Type.FrameworkType);

            // Normal property should still work
            var normalProp = containerProvider.Properties.FirstOrDefault(p => p.Name == "NormalProp");
            Assert.IsNotNull(normalProp);
            Assert.AreEqual(typeof(string), normalProp!.Type.FrameworkType);
        }

        [Test]
        public void ExternalTypePropertyIsResolved()
        {
            // Test a property decorated with alternateType
            var externalType = InputFactory.External("System.Net.IPAddress", "System.Net.Primitives", "4.3.0");

            var model = InputFactory.Model(
                "ModelWithExternalProperty",
                properties:
                [
                    InputFactory.Property("ipAddress", externalType),
                    InputFactory.Property("name", InputPrimitiveType.String)
                ]);

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [model]);

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .SingleOrDefault(t => t.Name == "ModelWithExternalProperty") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            // The property with external type should be resolved
            var ipAddressProp = modelProvider!.Properties.FirstOrDefault(p => p.Name == "IpAddress");
            Assert.IsNotNull(ipAddressProp);
            Assert.IsNotNull(ipAddressProp!.Type.FrameworkType);

            // Verify it's the correct framework type
            var normalProp = modelProvider.Properties.FirstOrDefault(p => p.Name == "Name");
            Assert.IsNotNull(normalProp);
            Assert.AreEqual(typeof(string), normalProp!.Type.FrameworkType);
        }

        [Test]
        public void UnsupportedExternalTypeEmitsDiagnostic()
        {
            // Test an external type that cannot be resolved (non-framework type)
            var externalType = InputFactory.External("Azure.Core.Expressions.DataFactoryExpression");

            var model = InputFactory.Model(
                "ModelWithUnsupportedExternal",
                properties:
                [
                    InputFactory.Property("expression", externalType),
                    InputFactory.Property("value", InputPrimitiveType.String)
                ]);

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [model]);

            var modelProvider = CodeModelGenerator.Instance.OutputLibrary.TypeProviders
                .SingleOrDefault(t => t.Name == "ModelWithUnsupportedExternal") as ModelProvider;
            Assert.IsNotNull(modelProvider);

            // The unsupported external type property should be skipped (null type results in skipped property)
            // Only the normal property should remain
            var props = modelProvider!.Properties;

            // The value property should exist
            var valueProp = props.FirstOrDefault(p => p.Name == "Value");
            Assert.IsNotNull(valueProp);
        }

        [Test]
        public void ModelWithOptionalDiscriminatorProperty()
        {
            var discriminatorEnum = InputFactory.StringEnum("kindEnum", [("One", "one"), ("Two", "two")]);
            var derivedInputModel = InputFactory.Model(
                "DerivedModel",
                discriminatedKind: "one",
                properties:
                [
                    InputFactory.Property("kind", InputFactory.EnumMember.String("One", "one", discriminatorEnum), isRequired: true, isDiscriminator: true),
                    InputFactory.Property("derivedProp", InputPrimitiveType.Int32, isRequired: true)
                ]);
            var inputModel = InputFactory.Model(
                "BaseModel",
                properties:
                [
                    InputFactory.Property("kind", discriminatorEnum, isRequired: false, isDiscriminator: true),
                    InputFactory.Property("baseProp", InputPrimitiveType.String, isRequired: true)
                ],
                discriminatedModels: new Dictionary<string, InputModelType>() { { "one", derivedInputModel }});

            MockHelpers.LoadMockGenerator(
                inputModelTypes: [inputModel, derivedInputModel],
                inputEnumTypes: [discriminatorEnum]);

            var modelProvider =
                CodeModelGenerator.Instance.OutputLibrary.TypeProviders.SingleOrDefault(t => t.Name == "DerivedModel")
                    as ModelProvider;
            Assert.IsNotNull(modelProvider);

            var writer = new TypeProviderWriter(modelProvider!);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
