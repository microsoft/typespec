// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using ClientModelProvider = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class FlatMappedBaseRegressionTests
    {
        [TestCase("value", true)]
        [TestCase("Value", true)]
        [TestCase("other", false)]
        public void CustomizedInputRetainsOneWireOwner(string originalName, bool customizesInheritedProperty)
        {
            var value = InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue");
            var child = InputFactory.Property("child", InputPrimitiveType.String, isRequired: true);
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [value, child, InputFactory.Property("other", InputPrimitiveType.Int32)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var customization = CreateCustomization(originalName);
            var generator = CreateGenerator(modelInput, customization: customization);
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            var generatedType = CompileModel(generator, model, customization);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            generatedType.GetProperty("RenamedValue")!.SetValue(instance, 42);
            if (instance is FlatMrwBase frameworkBase)
            {
                frameworkBase.Value = 99;
            }

            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = (BinaryData)persistable.GetMethod("Write")!.Invoke(instance, [options])!;
            TestContext.WriteLine(data.ToString());
            using var document = JsonDocument.Parse(data);
            Assert.Multiple(() =>
            {
                Assert.That(document.RootElement.EnumerateObject().Count(property => property.Name == "wireValue"), Is.EqualTo(1),
                    "A customization and the restored base must not both own the same wire property.");
                Assert.That(document.RootElement.GetProperty("wireValue").GetInt32(), Is.EqualTo(customizesInheritedProperty ? 42 : 99));
                Assert.That(document.RootElement.GetProperty("child").GetString(), Is.EqualTo("payload"));
                Assert.That(model.BaseType?.Name, Is.EqualTo(customizesInheritedProperty ? null : nameof(FlatMrwBase)),
                    "Only customizations claiming projected input properties should prevent restoration.");
                Assert.That(modelInput.BaseModel, Is.Null);
                Assert.That(value.EnclosingType, Is.SameAs(modelInput));
            });
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.That(generatedType.GetProperty("RenamedValue")!.GetValue(restored), Is.EqualTo(42));
        }

        [TestCase("value", true)]
        [TestCase("Value", true)]
        [TestCase("other", false)]
        public void CustomizedFieldPreventsOnlyClaimedProjection(string originalName, bool customizesInheritedProperty)
        {
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue"),
                    InputFactory.Property("other", InputPrimitiveType.Int32)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = CreateGenerator(modelInput, customization: CreateCustomization(originalName, field: true));
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(customizesInheritedProperty ? null : nameof(FlatMrwBase)));
            var customField = model.CanonicalView.Fields.Single(field => field.Name == "RenamedValue");
            Assert.That(customField.WireInfo?.SerializedName, Is.EqualTo(customizesInheritedProperty ? "wireValue" : "other"));
        }

        [TestCase(false, false, false)]
        [TestCase(false, false, true)]
        [TestCase(false, true, false)]
        [TestCase(false, true, true)]
        [TestCase(true, false, false)]
        [TestCase(true, false, true)]
        [TestCase(true, true, false)]
        [TestCase(true, true, true)]
        public void MultipartRetainsProjectedAndOwnParts(bool restoreBase, bool json, bool required)
        {
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue", isRequired: required),
                    InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.MultipartFormData |
                    (json ? InputModelTypeUsage.Json : 0));
            var generator = CreateGenerator(modelInput, restoreBase);
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(restoreBase ? nameof(FlatMrwBase) : null));
            var multipart = model.SerializationProviders.OfType<MultipartFormDataSerializationDefinition>().Single();
            var source = new TypeProviderWriter(multipart).Write().Content;
            TestContext.WriteLine(source);
            Assert.Multiple(() =>
            {
                Assert.That(source, Does.Contain("content.Add(\"wireValue\","),
                    "Restoration must not drop the inherited multipart part.");
                Assert.That(source, Does.Contain("content.Add(\"child\","));
                Assert.That(CSharpSyntaxTree.ParseText(source).GetRoot().DescendantNodes().OfType<InvocationExpressionSyntax>()
                    .Count(invocation => invocation.Expression.ToString() == "content.Add"), Is.EqualTo(2),
                    "Inherited and model-owned parts must each be emitted exactly once.");
            });
        }

        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public void SerializationCustomizationRetainsWireName(bool restoreBase, bool customizesProjectedProperty)
        {
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue"),
                    InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var propertyName = customizesProjectedProperty ? "Value" : "Child";
            var wireName = customizesProjectedProperty ? "customValue" : "customChild";
            var customization = CSharpSyntaxTree.ParseText(Helpers.GetExpectedFromFile()
                .Replace("__PROPERTY_NAME__", propertyName)
                .Replace("__WIRE_NAME__", wireName), path: "SerializationCustomization.cs");
            var generator = CreateGenerator(modelInput, restoreBase, customization);
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            var generatedType = CompileModel(generator, model, customization);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            generatedType.GetProperty("Value")!.SetValue(instance, 42);
            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = (BinaryData)persistable.GetMethod("Write")!.Invoke(instance, [options])!;
            TestContext.WriteLine(data.ToString());
            using var document = JsonDocument.Parse(data);
            var valueWireName = customizesProjectedProperty ? wireName : "wireValue";
            var childWireName = customizesProjectedProperty ? "child" : wireName;
            Assert.That(document.RootElement.EnumerateObject().Select(property => property.Name),
                Is.EquivalentTo(new[] { valueWireName, childWireName }),
                "Restoration must preserve serialization overrides and emit each wire property exactly once.");
            Assert.Multiple(() =>
            {
                Assert.That(document.RootElement.GetProperty(valueWireName).GetInt32(), Is.EqualTo(42));
                Assert.That(document.RootElement.GetProperty(childWireName).GetString(), Is.EqualTo("payload"));
                Assert.That(model.BaseType?.Name,
                    Is.EqualTo(restoreBase && !customizesProjectedProperty ? nameof(FlatMrwBase) : null),
                    "Only serialization customizations targeting projected properties should prevent restoration.");
            });
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.Multiple(() =>
            {
                Assert.That(generatedType.GetProperty("Value")!.GetValue(restored), Is.EqualTo(42));
                Assert.That(generatedType.GetProperty("Child")!.GetValue(restored), Is.EqualTo("payload"));
            });
        }

        [TestCase(false, false, false)]
        [TestCase(false, false, true)]
        [TestCase(false, true, false)]
        [TestCase(false, true, true)]
        [TestCase(true, false, false)]
        [TestCase(true, false, true)]
        [TestCase(true, true, false)]
        [TestCase(true, true, true)]
        public void SuppressionRetainsSourceDecision(bool restoreBase, bool cachePropertyFirst, bool suppressesProjectedProperty)
        {
            var value = InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue");
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [value, InputFactory.Property("child", InputPrimitiveType.String, isRequired: true),
                    InputFactory.Property("other", InputPrimitiveType.Int32)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var suppressedName = suppressesProjectedProperty ? "Value" : "Other";
            var customization = CSharpSyntaxTree.ParseText(Helpers.GetExpectedFromFile()
                .Replace("__SUPPRESSED_NAME__", suppressedName), path: "SuppressionCustomization.cs");
            var generator = CreateGenerator(modelInput, restoreBase, customization);
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<ModelProvider?>("CreateModelCore", ItExpr.IsAny<InputModelType>())
                .Returns((InputModelType input) =>
                {
                    var source = new ClientModelProvider(input);
                    if (cachePropertyFirst && ReferenceEquals(input, modelInput))
                    {
                        generator.Object.TypeFactory.CreateProperty(value, source);
                    }
                    return source;
                });
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            var generatedType = CompileModel(generator, model, customization);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            generatedType.GetProperty("Value")?.SetValue(instance, 42);
            generatedType.GetProperty("Other")?.SetValue(instance, 7);
            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = (BinaryData)persistable.GetMethod("Write")!.Invoke(instance, [options])!;
            TestContext.WriteLine(data.ToString());
            using var document = JsonDocument.Parse(data);
            var retainedName = suppressesProjectedProperty ? "other" : "wireValue";
            Assert.That(document.RootElement.EnumerateObject().Select(property => property.Name),
                Is.EquivalentTo(new[] { "child", retainedName }),
                "Restoration must not resurrect a source-owner-suppressed property in either cache order.");
            Assert.Multiple(() =>
            {
                Assert.That(generatedType.GetProperty(suppressedName), Is.Null);
                Assert.That(model.BaseType?.Name,
                    Is.EqualTo(restoreBase && !suppressesProjectedProperty ? nameof(FlatMrwBase) : null),
                    "Unrelated source-property suppressions must not prevent restoration.");
            });
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.Multiple(() =>
            {
                Assert.That(generatedType.GetProperty("Child")!.GetValue(restored), Is.EqualTo("payload"));
                Assert.That(generatedType.GetProperty(suppressesProjectedProperty ? "Other" : "Value")!.GetValue(restored),
                    Is.EqualTo(suppressesProjectedProperty ? 7 : 42));
            });
        }

        [TestCase(1, true, false)]
        [TestCase(1, true, true)]
        [TestCase(2, true, false)]
        [TestCase(2, true, true)]
        [TestCase(2, false, false)]
        [TestCase(2, false, true)]
        public void EquivalentCachedMappingsReachOptIn(int count, bool equivalent, bool allowMapping)
        {
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue"),
                    InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var mappedInputs = Enumerable.Range(0, count).Select(index => InputFactory.Model("MappedInput" + index,
                properties: [InputFactory.Property("value", index == 0 || equivalent ? InputPrimitiveType.Int32 : InputPrimitiveType.String,
                    serializedName: "wireValue")])).ToArray();
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => mappedInputs.Append(modelInput).ToArray(),
                createModelCore: input => mappedInputs.Contains(input)
                    ? new SystemObjectModelProvider(new CSharpType(typeof(FlatMrwBase)), input)
                    : new ClientModelProvider(input));
            var historical = CSharpCompilation.Create("HistoricalCachedMappedBase",
                [CSharpSyntaxTree.ParseText(Helpers.GetExpectedFromFile(method: "HistoricalFrameworkBase")
                    .Replace("__FRAMEWORK_BASE__", typeof(FlatMrwBase).FullName))],
                GetReferences(), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(null, historical));
            var hookCalled = false;
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns((CSharpType previous, InputModelType current) =>
                {
                    hookCalled = true;
                    return allowMapping ? new CSharpType(typeof(FlatMrwBase)) : null;
                });
            var cached = mappedInputs.Select(input => (SystemObjectModelProvider)generator.Object.TypeFactory.CreateModel(input)!).ToArray();
            if (count == 2)
            {
                Assert.That(ModelBaseTypeCompatibility.AreMappedContractsEquivalent(cached[0], cached[1]), Is.EqualTo(equivalent));
            }
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            var shouldRestore = equivalent && allowMapping;
            Assert.Multiple(() =>
            {
                Assert.That(model.BaseType?.Name, Is.EqualTo(shouldRestore ? nameof(FlatMrwBase) : null));
                Assert.That(hookCalled, Is.EqualTo(equivalent),
                    "Equivalent mappings must still reach the opt-in or veto; conflicting mappings remain ambiguous.");
                Assert.That(generator.Object.TypeFactory.CSharpTypeMap[cached.Last().Type], Is.SameAs(cached.Last()));
                if (shouldRestore && model.BaseModelProvider is SystemObjectModelProvider projection)
                {
                    Assert.That(cached, Does.Not.Contain(projection));
                    Assert.That(projection.InputModel, Is.SameAs(modelInput));
                    Assert.That(projection.MappedInputProperties, Is.EqualTo(new[] { modelInput.Properties[0] }));
                }
            });
        }

        [TestCase(false, false, false)]
        [TestCase(false, false, true)]
        [TestCase(false, true, false)]
        [TestCase(false, true, true)]
        [TestCase(true, false, false)]
        [TestCase(true, false, true)]
        [TestCase(true, true, false)]
        [TestCase(true, true, true)]
        public void KnownWireMetadataPreservesRoundTrip(bool restoreBase, bool changeWireName, bool projectClrName)
        {
            var wireName = changeWireName ? "newValue" : "oldValue";
            var modelInput = InputFactory.Model("DerivedModel", properties:
                [InputFactory.Property(projectClrName ? "renamedValue" : "value", InputPrimitiveType.Int32, serializedName: wireName),
                    InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = CreateGenerator(modelInput, restoreBase, frameworkType: typeof(KnownWirePathMrwBase));
            if (projectClrName)
            {
                Mock.Get(generator.Object.TypeFactory).Protected()
                    .Setup<bool>("IsLastContractModelBasePropertyCompatibleCore", ItExpr.IsAny<CSharpType>(),
                        ItExpr.IsAny<InputModelProperty>(), ItExpr.IsAny<PropertyProvider>())
                    .Returns((CSharpType mappedBase, InputModelProperty current, PropertyProvider previous) =>
                        current.Name == "renamedValue" && previous.Name == "Value" && previous.Type.Equals(new CSharpType(typeof(int))));
            }
            var model = generator.Object.TypeFactory.CreateModel(modelInput)!;
            var historicalValue = model.LastContractView!.BaseTypeProvider!.Properties.Single(property => property.Name == "Value");
            Assert.That(historicalValue.Attributes.Any(attribute => attribute.Type.Name == "WirePathAttribute" &&
                attribute.Arguments.FirstOrDefault() is Microsoft.TypeSpec.Generator.Expressions.LiteralExpression { Literal: "oldValue" }), Is.True,
                "The historical wire path must be visible to the core, not known only to downstream code.");
            var generatedType = CompileModel(generator, model);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            var valueProperty = generatedType.GetProperty("Value") ?? generatedType.GetProperty("RenamedValue")!;
            valueProperty.SetValue(instance, 42);
            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = (BinaryData)persistable.GetMethod("Write")!.Invoke(instance, [options])!;
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            TestContext.WriteLine(data.ToString());
            using var document = JsonDocument.Parse(data);
            Assert.Multiple(() =>
            {
                Assert.That(document.RootElement.EnumerateObject().Select(property => property.Name),
                    Is.EquivalentTo(new[] { wireName, "child" }), "Restoration must preserve the current wire contract.");
                Assert.That(valueProperty.GetValue(restored), Is.EqualTo(42), "Known wire conflicts must not lose values on round-trip.");
                Assert.That(generatedType.GetProperty("Child")!.GetValue(restored), Is.EqualTo("payload"));
                Assert.That(model.BaseType?.Name, Is.EqualTo(restoreBase && !changeWireName ? nameof(KnownWirePathMrwBase) : null),
                    "Matching wire metadata must still allow restoration, including downstream CLR-name projection.");
            });
        }

        [TestCase(false)]
        [TestCase(true)]
        public void MappedBaseUpgradeRetainsProjectedPropertiesOnReads(bool readOnly)
            => AssertMappedBaseUpgradeRoundTrip(readOnly);

        [Test]
        public void MappedBaseUpgradeRetainsAncestorOwnedPropertiesOnReads()
            => AssertMappedBaseUpgradeRoundTrip(ancestorValue: true);

        [Test]
        public void NullableWireCollectionFallsBackAndPreservesNullPayload()
            => AssertMappedBaseUpgradeRoundTrip(nullableTags: true);

        [Test]
        public void MappedBaseUpgradeRejectsUninitializableAncestorProperty()
        {
            var ancestor = InputFactory.Model("Ancestor",
                properties: [InputFactory.Property("location", InputPrimitiveType.String, isReadOnly: true)]);
            var current = InputFactory.Model("CurrentBase", properties: [], baseModel: ancestor);
            var input = InputFactory.Model("DerivedModel", baseModel: current,
                properties: [InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = CreateGenerator(input, frameworkType: typeof(ReadOnlyUpgradedMrwBase));
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<ModelProvider?>("CreateModelCore", ItExpr.IsAny<InputModelType>())
                .Returns((InputModelType model) => ReferenceEquals(model, current)
                    ? new SystemObjectModelProvider(new CSharpType(typeof(FlatMrwBase)), model)
                    : new ClientModelProvider(model));

            var model = generator.Object.TypeFactory.CreateModel(input)!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(FlatMrwBase)),
                "A getter-only ancestor property absent from the framework constructor must prevent restoration.");
        }

        private static void AssertMappedBaseUpgradeRoundTrip(
            bool readOnly = false, bool ancestorValue = false, bool nullableTags = false)
        {
            // Keep the immediate mapped input empty: the missing value belongs to a deeper input ancestor,
            // not to the framework constructor's immediate input model or the generated child.
            var ancestor = ancestorValue ? InputFactory.Model("Ancestor",
                properties: [InputFactory.Property("value", InputPrimitiveType.Int32, serializedName: "wireValue")]) : null;
            var current = InputFactory.Model("CurrentBase", properties: [], baseModel: ancestor);
            var tagsType = InputFactory.Dictionary(InputPrimitiveType.String);
            var input = InputFactory.Model("DerivedModel", baseModel: current, properties:
                [InputFactory.Property("location", InputPrimitiveType.String, isReadOnly: readOnly),
                    InputFactory.Property("tags", nullableTags ? new InputNullableType(tagsType) : tagsType, isReadOnly: true),
                    InputFactory.Property("items", InputFactory.Array(InputPrimitiveType.String), isReadOnly: true),
                    InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var frameworkType = readOnly ? typeof(ReadOnlyUpgradedMrwBase) : typeof(UpgradedMrwBase);
            var generator = CreateGenerator(input, frameworkType: frameworkType);
            // These exact fixture properties are known to return stable mutable collections.
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<bool>("IsLastContractModelBaseCollectionMutableCore",
                    ItExpr.Is<CSharpType>(type => type.IsFrameworkType && type.FrameworkType == typeof(UpgradedMrwBase)),
                    ItExpr.Is<PropertyProvider>(property => property.Name == "Tags" || property.Name == "Items"))
                .Returns(true);
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<ModelProvider?>("CreateModelCore", ItExpr.IsAny<InputModelType>())
                .Returns((InputModelType model) => ReferenceEquals(model, current)
                    ? new SystemObjectModelProvider(new CSharpType(typeof(FlatMrwBase)), model)
                    : new ClientModelProvider(model));
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            var generatedType = CompileModel(generator, model);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = BinaryData.FromString(nullableTags
                ? """{"location":"west","tags":null,"items":["one"],"child":"payload"}"""
                : ancestorValue
                    ? """{"wireValue":42,"location":"west","tags":{"key":"value"},"items":["one"],"child":"payload"}"""
                    : """{"location":"west","tags":{"key":"value"},"items":["one"],"child":"payload"}""");
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.That(generatedType.GetProperty("Location")!.GetValue(restored), Is.EqualTo("west"),
                "Moving a child property into a framework base must not remove its deserialization parameter.");
            Assert.That(model.BaseType?.Name, Is.EqualTo(readOnly || nullableTags ? nameof(FlatMrwBase) : nameof(UpgradedMrwBase)),
                "Reject restoration when a projected property cannot be initialized safely.");
            if (ancestorValue)
            {
                Assert.That(generatedType.GetProperty("Value")!.GetValue(restored), Is.EqualTo(42),
                    "An unconsumed ancestor property must still be deserialized into the inherited member.");
            }
            var tags = generatedType.GetProperty("Tags")!.GetValue(restored);
            if (nullableTags)
            {
                Assert.That(tags, Is.Null);
            }
            else
            {
                Assert.That((IEnumerable<KeyValuePair<string, string>>)tags!,
                    Is.EqualTo(new[] { new KeyValuePair<string, string>("key", "value") }));
            }
            Assert.That((IEnumerable<string>)generatedType.GetProperty("Items")!.GetValue(restored)!, Is.EqualTo(new[] { "one" }));
            if (!readOnly)
            {
                var serialized = (BinaryData)persistable.GetMethod("Write")!.Invoke(restored, [options])!;
                using var document = JsonDocument.Parse(serialized);
                Assert.That(document.RootElement.GetProperty("location").GetString(), Is.EqualTo("west"));
                Assert.That(document.RootElement.GetProperty("child").GetString(), Is.EqualTo("payload"));
                if (ancestorValue)
                {
                    Assert.That(document.RootElement.GetProperty("wireValue").GetInt32(), Is.EqualTo(42));
                }
                if (nullableTags)
                {
                    Assert.That(document.RootElement.GetProperty("tags").ValueKind, Is.EqualTo(JsonValueKind.Null));
                }
                else
                {
                    Assert.That(document.RootElement.GetProperty("tags").GetProperty("key").GetString(), Is.EqualTo("value"));
                }
                Assert.That(document.RootElement.GetProperty("items")[0].GetString(), Is.EqualTo("one"));
            }
        }

        [TestCase(typeof(ReadOnlyListMrwBase), false)]
        [TestCase(typeof(ReadOnlyDictionaryMrwBase), true)]
        [TestCase(typeof(UnapprovedListMrwBase), false)]
        [TestCase(typeof(UnapprovedDictionaryMrwBase), true)]
        public void GetterOnlyCollectionsRequireAKnownMutableContract(Type frameworkType, bool dictionary)
        {
            var current = InputFactory.Model("CurrentBase", properties: []);
            var property = InputFactory.Property(dictionary ? "tags" : "items", dictionary
                ? InputFactory.Dictionary(InputPrimitiveType.String) : InputFactory.Array(InputPrimitiveType.String), isReadOnly: true);
            var input = InputFactory.Model("DerivedModel", baseModel: current,
                properties: [property, InputFactory.Property("child", InputPrimitiveType.String, isRequired: true)],
                usage: InputModelTypeUsage.Input | InputModelTypeUsage.Output | InputModelTypeUsage.Json);
            var generator = CreateGenerator(input, frameworkType: frameworkType);
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<ModelProvider?>("CreateModelCore", ItExpr.IsAny<InputModelType>())
                .Returns((InputModelType model) => ReferenceEquals(model, current)
                    ? new SystemObjectModelProvider(new CSharpType(typeof(FlatMrwBase)), model)
                    : new ClientModelProvider(model));
            var model = generator.Object.TypeFactory.CreateModel(input)!;
            var generatedType = CompileModel(generator, model);
            var instance = Activator.CreateInstance(generatedType, "payload")!;
            var persistable = typeof(IPersistableModel<>).MakeGenericType(generatedType);
            var options = new ModelReaderWriterOptions("J");
            var data = BinaryData.FromString(dictionary
                ? """{"tags":{"key":"value"},"child":"payload"}"""
                : """{"items":["one"],"child":"payload"}""");
            var restored = persistable.GetMethod("Create")!.Invoke(instance, [data, options])!;
            Assert.That(model.BaseType?.Name, Is.EqualTo(nameof(FlatMrwBase)),
                "A mutable interface alone does not guarantee that the getter returns a mutable collection.");
            var serialized = (BinaryData)persistable.GetMethod("Write")!.Invoke(restored, [options])!;
            using var document = JsonDocument.Parse(serialized);
            Assert.That(document.RootElement.GetProperty("child").GetString(), Is.EqualTo("payload"));
            Assert.That(dictionary ? document.RootElement.GetProperty("tags").GetProperty("key").GetString()
                : document.RootElement.GetProperty("items")[0].GetString(), Is.EqualTo(dictionary ? "value" : "one"));
        }

        private static Mock<ScmCodeModelGenerator> CreateGenerator(
            InputModelType modelInput,
            bool restoreBase = true,
            SyntaxTree? customization = null,
            Type? frameworkType = null)
        {
            frameworkType ??= typeof(FlatMrwBase);
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => [modelInput]);
            var historical = CSharpCompilation.Create("HistoricalFlatMrwBase",
                [CSharpSyntaxTree.ParseText(Helpers.GetExpectedFromFile(method: "HistoricalFrameworkBase")
                    .Replace("__FRAMEWORK_BASE__", frameworkType.FullName))],
                GetReferences(), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            var current = customization is null ? null : CSharpCompilation.Create("CurrentCustomization", [customization],
                GetReferences(), new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
            generator.SetupProperty(plugin => plugin.SourceInputModel, new SourceInputModel(current, historical));
            Mock.Get(generator.Object.TypeFactory).Protected()
                .Setup<CSharpType?>("CreateLastContractModelBaseCore", ItExpr.IsAny<CSharpType>(), ItExpr.IsAny<InputModelType>())
                .Returns(restoreBase ? new CSharpType(frameworkType) : null);
            return generator;
        }

        private static Type CompileModel(Mock<ScmCodeModelGenerator> generator, ModelProvider model, SyntaxTree? customization = null)
        {
            var providers = generator.Object.OutputLibrary.TypeProviders.Where(provider => provider == model ||
                provider.Name is "Argument" or "Optional" or "ChangeTrackingList" or "ChangeTrackingDictionary" or
                    "ModelSerializationExtensions" or "TypeFormatters" or "SerializationFormat" ||
                provider is ModelReaderWriterContextDefinition);
            var trees = providers.SelectMany(provider => new[] { provider }.Concat(provider.SerializationProviders))
                .Distinct().Select(provider => CSharpSyntaxTree.ParseText(
                    new TypeProviderWriter(provider).Write().Content, path: provider.Name + ".cs"))
                .Concat(customization is null ? Array.Empty<SyntaxTree>() : [customization]);
            var compilation = CSharpCompilation.Create("GeneratedFlatCustomization", trees, GetReferences(),
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Disable));
            var sourceGenerators = Assembly.Load("System.ClientModel.SourceGeneration").GetTypes()
                .Where(type => type.IsDefined(typeof(GeneratorAttribute)))
                .Select(type => Activator.CreateInstance(type))
                .Select(generator => generator is ISourceGenerator sourceGenerator
                    ? sourceGenerator : ((IIncrementalGenerator)generator!).AsSourceGenerator());
            CSharpGeneratorDriver.Create(sourceGenerators).RunGeneratorsAndUpdateCompilation(compilation,
                out var generatedCompilation, out var generatorDiagnostics);
            Assert.That(generatorDiagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error), Is.Empty);
            using var assemblyStream = new MemoryStream();
            var result = generatedCompilation.Emit(assemblyStream);
            Assert.That(result.Success, Is.True, string.Join(Environment.NewLine,
                result.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)));
            return Assembly.Load(assemblyStream.ToArray()).GetType("Sample.Models.DerivedModel")!;
        }

        private static MetadataReference[] GetReferences()
            => ((string)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES")!).Split(Path.PathSeparator)
                .Append(typeof(ModelReaderWriterOptions).Assembly.Location)
                .Append(typeof(BinaryData).Assembly.Location)
                .Append(typeof(FlatMrwBase).Assembly.Location)
                .Distinct().Select(path => MetadataReference.CreateFromFile(path)).ToArray();

        private static SyntaxTree CreateCustomization(string originalName, bool field = false)
            => CSharpSyntaxTree.ParseText(Helpers.GetExpectedFromFile(field ? "field" : "property")
                .Replace("__ORIGINAL_NAME__", originalName), path: "Customization.cs");
    }

    [AttributeUsage(AttributeTargets.Property)]
    public sealed class WirePathAttribute : Attribute
    {
        public WirePathAttribute(string path) { }
    }

    public class UpgradedMrwBase : FlatMrwBase
    {
        public string? Location { get; set; }
        public IDictionary<string, string> Tags { get; } = new Dictionary<string, string>();
        public IList<string> Items { get; } = new List<string>();
        protected override void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            base.JsonModelWriteCore(writer, options);
            writer.WriteString("location", Location);
            writer.WritePropertyName("tags");
            JsonSerializer.Serialize(writer, Tags);
            writer.WritePropertyName("items");
            JsonSerializer.Serialize(writer, Items);
        }
    }

    public class ReadOnlyUpgradedMrwBase : FlatMrwBase
    {
        public string? Location { get; }
        public IDictionary<string, string> Tags { get; } = new Dictionary<string, string>();
        public IList<string> Items { get; } = new List<string>();
    }

    public class ReadOnlyListMrwBase : FlatMrwBase
    {
        public IList<string> Items { get; } = Array.AsReadOnly(new[] { "original" });
    }

    public class ReadOnlyDictionaryMrwBase : FlatMrwBase
    {
        public IDictionary<string, string> Tags { get; } = new System.Collections.ObjectModel.ReadOnlyDictionary<string, string>(
            new Dictionary<string, string> { ["original"] = "value" });
    }

    public class UnapprovedListMrwBase : FlatMrwBase
    {
        public IList<string> Items { get; } = new List<string>();
    }

    public class UnapprovedDictionaryMrwBase : FlatMrwBase
    {
        public IDictionary<string, string> Tags { get; } = new Dictionary<string, string>();
    }

    public class KnownWirePathMrwBase : IJsonModel<KnownWirePathMrwBase>
    {
        public KnownWirePathMrwBase() { }
        public KnownWirePathMrwBase(int value) { Value = value; }
        [WirePath("oldValue")]
        public int Value { get; set; }
        protected virtual void JsonModelWriteCore(Utf8JsonWriter writer, ModelReaderWriterOptions options)
            => writer.WriteNumber("oldValue", Value);
        protected virtual KnownWirePathMrwBase JsonModelCreateCore(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
        protected virtual BinaryData PersistableModelWriteCore(ModelReaderWriterOptions options)
            => throw new NotImplementedException();
        protected virtual KnownWirePathMrwBase PersistableModelCreateCore(BinaryData data, ModelReaderWriterOptions options)
            => throw new NotImplementedException();
        protected virtual string PersistableModelGetFormatFromOptions(ModelReaderWriterOptions options) => "J";
        void IJsonModel<KnownWirePathMrwBase>.Write(Utf8JsonWriter writer, ModelReaderWriterOptions options)
        {
            writer.WriteStartObject();
            JsonModelWriteCore(writer, options);
            writer.WriteEndObject();
        }
        KnownWirePathMrwBase IJsonModel<KnownWirePathMrwBase>.Create(ref Utf8JsonReader reader, ModelReaderWriterOptions options)
            => JsonModelCreateCore(ref reader, options);
        BinaryData IPersistableModel<KnownWirePathMrwBase>.Write(ModelReaderWriterOptions options)
            => PersistableModelWriteCore(options);
        KnownWirePathMrwBase IPersistableModel<KnownWirePathMrwBase>.Create(BinaryData data, ModelReaderWriterOptions options)
            => PersistableModelCreateCore(data, options);
        string IPersistableModel<KnownWirePathMrwBase>.GetFormatFromOptions(ModelReaderWriterOptions options)
            => PersistableModelGetFormatFromOptions(options);
    }
}
