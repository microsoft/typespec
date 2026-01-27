// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using NUnit.Framework;
using Payload.Xml;

namespace TestProjects.Spector.Tests.Http.Payload.Xml
{
    public class XmlTests : SpectorTestBase
    {
        [SpectorTest]
        public Task GetSimpleModel() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetSimpleModelValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);

            Assert.AreEqual("foo", model.Name);
            Assert.AreEqual(123, model.Age);
        });

        [SpectorTest]
        public Task PutSimpleModel() => Test(async (host) =>
        {
            SimpleModel model = new SimpleModel("foo", 123);
            var response = await new XmlClient(host, null).GetSimpleModelValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithSimpleArrays() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithSimpleArraysValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.AreEqual(3, model.Colors.Count);
            Assert.AreEqual(model.Colors[0], "red");
            Assert.AreEqual(model.Colors[1], "green");
            Assert.AreEqual(model.Colors[2], "blue");

            Assert.AreEqual(2, model.Counts.Count);
            Assert.AreEqual(model.Counts[0], 1);
            Assert.AreEqual(model.Counts[1], 2);
        });

        [SpectorTest]
        public Task PutModelWithSimpleArrays() => Test(async (host) =>
        {
            var model = new ModelWithSimpleArrays(
                new[] { "red", "green", "blue" },
                new[] { 1, 2 });
            var response = await new XmlClient(host, null).GetModelWithSimpleArraysValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithArrayOfModel() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithArrayOfModelValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.AreEqual(2, model.Items.Count);
            Assert.AreEqual("foo", model.Items[0].Name);
            Assert.AreEqual(123, model.Items[0].Age);
            Assert.AreEqual("bar", model.Items[1].Name);
            Assert.AreEqual(456, model.Items[1].Age);
        });

        [SpectorTest]
        public Task PutModelWithArrayOfModel() => Test(async (host) =>
        {
            var model = new ModelWithArrayOfModel(new[]
            {
                new SimpleModel("foo", 123),
                new SimpleModel("bar", 456)
            });
            var response = await new XmlClient(host, null).GetModelWithArrayOfModelValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithOptionalField() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithOptionalFieldValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.AreEqual("widget", model.Item);
        });

        [SpectorTest]
        public Task PutModelWithOptionalField() => Test(async (host) =>
        {
            var model = new ModelWithOptionalField("widget");
            var response = await new XmlClient(host, null).GetModelWithOptionalFieldValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithAttributes() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithAttributesValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.IsTrue(model.Enabled);
            Assert.AreEqual(123, model.Id1);
            Assert.AreEqual("foo", model.Id2);
        });

        [SpectorTest]
        public Task PutModelWithAttributes() => Test(async (host) =>
        {
            var model = new ModelWithAttributes(123, "foo", true);
            var response = await new XmlClient(host, null).GetModelWithAttributesValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithUnwrappedArray() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithUnwrappedArrayValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);

            var colors = model.Colors;
            Assert.NotNull(colors);
            Assert.AreEqual(3, colors.Count);
            Assert.AreEqual("red", colors[0]);
            Assert.AreEqual("green", colors[1]);
            Assert.AreEqual("blue", colors[2]);

            var counts = model.Counts;
            Assert.NotNull(counts);
            Assert.AreEqual(2, counts.Count);
            Assert.AreEqual(1, counts[0]);
            Assert.AreEqual(2, counts[1]);
        });

        [SpectorTest]
        public Task PutModelWithUnwrappedArray() => Test(async (host) =>
        {
            var model = new ModelWithUnwrappedArray(
                new[] { "red", "green", "blue" },
                new[] { 1, 2 });
            var response = await new XmlClient(host, null).GetModelWithUnwrappedArrayValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithRenamedArrays() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithRenamedArraysValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.AreEqual(3, model.Colors.Count);
            Assert.AreEqual(model.Colors[0], "red");
            Assert.AreEqual(model.Colors[1], "green");
            Assert.AreEqual(model.Colors[2], "blue");
            Assert.AreEqual(2, model.Counts.Count);
            Assert.AreEqual(model.Counts[0], 1);
            Assert.AreEqual(model.Counts[1], 2);
        });

        [SpectorTest]
        public Task PutModelWithRenamedArrays() => Test(async (host) =>
        {
            var model = new ModelWithRenamedArrays(
                new[] { "red", "green", "blue" },
                new[] { 1, 2 });
            var response = await new XmlClient(host, null).GetModelWithRenamedArraysValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithRenamedFields() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithRenamedFieldsValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            var inputData = model.InputData;
            Assert.NotNull(inputData);
            Assert.AreEqual("foo", inputData.Name);
            Assert.AreEqual(123, inputData.Age);

            var outputData = model.OutputData;
            Assert.NotNull(outputData);
            Assert.AreEqual("bar", outputData.Name);
            Assert.AreEqual(456, outputData.Age);
        });

        [SpectorTest]
        public Task PutModelWithRenamedFields() => Test(async (host) =>
        {
            var model = new ModelWithRenamedFields(
                new SimpleModel("foo", 123),
                new SimpleModel("bar", 456));
            var response = await new XmlClient(host, null).GetModelWithRenamedFieldsValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithEmptyArray() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithEmptyArrayValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.NotNull(model.Items);
            Assert.AreEqual(0, model.Items.Count);
        });

        [SpectorTest]
        public Task PutModelWithEmptyArray() => Test(async (host) =>
        {
            var model = new ModelWithEmptyArray(new List<SimpleModel>());
            var response = await new XmlClient(host, null).GetModelWithEmptyArrayValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithText() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithTextValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);
            Assert.AreEqual("foo", model.Language);
            Assert.IsTrue(model.Content.Contains("This is some text."));
        });

        [SpectorTest]
        public Task PutModelWithText() => Test(async (host) =>
        {
            var model = new ModelWithText("foo", "\n  This is some text.\n");
            var response = await new XmlClient(host, null).GetModelWithTextValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithDictionary() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithDictionaryValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);

            var metadata = model.Metadata;
            Assert.NotNull(metadata);
            Assert.AreEqual(3, metadata.Count);
            Assert.AreEqual("blue", metadata["Color"]);
            Assert.AreEqual("123", metadata["Count"]);
            Assert.AreEqual("false", metadata["Enabled"]);
        });

        [SpectorTest]
        public Task PutModelWithDictionary() => Test(async (host) =>
        {
            var model = new ModelWithDictionary(new Dictionary<string, string>
            {
                { "Color", "blue" },
                { "Count", "123" },
                { "Enabled", "false" }
            });
            var response = await new XmlClient(host, null).GetModelWithDictionaryValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task GetModelWithEncodedNames() => Test(async (host) =>
        {
            var response = await new XmlClient(host, null).GetModelWithEncodedNamesValueClient().GetAsync();

            Assert.AreEqual(200, response.GetRawResponse().Status);

            var model = response.Value;
            Assert.NotNull(model);

            var modelData = model.ModelData;
            Assert.NotNull(modelData);
            Assert.AreEqual("foo", modelData.Name);
            Assert.AreEqual(123, modelData.Age);

            var colors = model.Colors;
            Assert.NotNull(colors);
            Assert.AreEqual(3, colors.Count);
            Assert.AreEqual("red", colors[0]);
            Assert.AreEqual("green", colors[1]);
            Assert.AreEqual("blue", colors[2]);
        });

        [SpectorTest]
        public Task PutModelWithEncodedNames() => Test(async (host) =>
        {
            var model = new ModelWithEncodedNames(
                new SimpleModel("foo", 123),
                new[] { "red", "green", "blue" });
            var response = await new XmlClient(host, null).GetModelWithEncodedNamesValueClient()
                .PutAsync(model);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public void ComplexModel_SerializeAndDeserialize_UsingModelReaderWriter()
        {
            // Arrange
            var original = new ComplexModel("TestName", 42, "TestBar");

            // Act - Serialize using ModelReaderWriter with XML format
            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = ModelReaderWriter.Write(original, options);

            // Assert - Verify XML structure
            string xml = serialized.ToString();
            Assert.IsTrue(xml.Contains("<ComplexModel"), "Should have ComplexModel root element");
            Assert.IsTrue(xml.Contains("<name>TestName</name>"), "Should contain name element");
            Assert.IsTrue(xml.Contains("<age>42</age>"), "Should contain age element");
            Assert.IsTrue(xml.Contains("<bar>TestBar</bar>"), "Should contain bar element");

            // Act - Deserialize
            ComplexModel? deserialized = ModelReaderWriter.Read<ComplexModel>(serialized, options);

            // Assert - Verify roundtrip
            Assert.NotNull(deserialized);
            Assert.AreEqual(original.Name, deserialized!.Name);
            Assert.AreEqual(original.Age, deserialized.Age);
            Assert.AreEqual(original.Bar, deserialized.Bar);
        }

        [Test]
        public void ComplexModel_SerializeAndDeserialize_UsingIPersistableModel()
        {
            // Arrange
            var original = new ComplexModel("TestName", 42, "TestBar");
            IPersistableModel<ComplexModel> persistable = original;

            // Act - Serialize using IPersistableModel.Write
            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = persistable.Write(options);

            // Assert - Verify XML structure
            string xml = serialized.ToString();
            Assert.IsTrue(xml.Contains("<ComplexModel"), "Should have ComplexModel root element");
            Assert.IsTrue(xml.Contains("<name>TestName</name>"), "Should contain name element");
            Assert.IsTrue(xml.Contains("<age>42</age>"), "Should contain age element");
            Assert.IsTrue(xml.Contains("<bar>TestBar</bar>"), "Should contain bar element");

            // Act - Deserialize using IPersistableModel.Create
            ComplexModel? deserialized = persistable.Create(serialized, options);

            // Assert - Verify roundtrip
            Assert.NotNull(deserialized);
            Assert.AreEqual(original.Name, deserialized!.Name);
            Assert.AreEqual(original.Age, deserialized.Age);
            Assert.AreEqual(original.Bar, deserialized.Bar);
        }

        [Test]
        public void ComplexModel_InheritsBaseClassPropertiesInXml()
        {
            // Arrange - Verify inheritance serialization order
            var model = new ComplexModel("BaseName", 99, "DerivedBar");

            // Act
            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = ModelReaderWriter.Write(model, options);
            string xml = serialized.ToString();

            // Assert - Base class properties (name, age) should come before derived (bar)
            int nameIndex = xml.IndexOf("<name>");
            int ageIndex = xml.IndexOf("<age>");
            int barIndex = xml.IndexOf("<bar>");

            Assert.IsTrue(nameIndex < barIndex, "Base class 'name' should come before derived 'bar'");
            Assert.IsTrue(ageIndex < barIndex, "Base class 'age' should come before derived 'bar'");
        }

        #region AnotherModelWithNs Tests

        private static string AnotherModelWithNsTestData => File.ReadAllText(
            Path.Combine(Path.GetDirectoryName(typeof(XmlTests).Assembly.Location)!, "Http", "Payload", "Xml", "TestData", "AnotherModelWithNs.xml"));

        [Test]
        public void AnotherModelWithNs_DeserializesFromTestData()
        {
            // Arrange
            var options = new ModelReaderWriterOptions("X");
            var testData = BinaryData.FromString(AnotherModelWithNsTestData);

            // Act - Deserialize
            var model = ModelReaderWriter.Read<AnotherModelWithNs>(testData, options);

            // Assert - Validate model
            Assert.IsNotNull(model);
            Assert.AreEqual("testValue", model!.Foo);

            // Act - Serialize back
            BinaryData serialized = ModelReaderWriter.Write(model, options);

            // Assert - Compare XML (semantic comparison)
            var originalXml = LoadXml(AnotherModelWithNsTestData);
            var serializedXml = LoadXml(serialized);
            AssertXmlEqual(originalXml, serializedXml);
        }

        [Test]
        public void AnotherModelWithNs_SerializesWithNamespace()
        {
            // Arrange
            var model = new AnotherModelWithNs("testValue");

            // Act - Serialize
            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = ModelReaderWriter.Write(model, options);

            // Assert - Compare XML with expected test data
            var expectedXml = LoadXml(AnotherModelWithNsTestData);
            var serializedXml = LoadXml(serialized);
            AssertXmlEqual(expectedXml, serializedXml);

            // Act - Deserialize back
            var deserialized = ModelReaderWriter.Read<AnotherModelWithNs>(serialized, options);

            // Assert - Validate model matches original
            Assert.IsNotNull(deserialized);
            Assert.AreEqual(model.Foo, deserialized!.Foo);
        }

        #endregion

        #region ModelWithNs Tests

        private static string ModelWithNsTestData => File.ReadAllText(
            Path.Combine(Path.GetDirectoryName(typeof(XmlTests).Assembly.Location)!, "Http", "Payload", "Xml", "TestData", "ModelWithNs.xml"));

        [Test]
        public void ModelWithNs_DeserializesFromTestData()
        {
            // Arrange
            var options = new ModelReaderWriterOptions("X");
            var testData = BinaryData.FromString(ModelWithNsTestData);

            // Act - Deserialize
            var model = ModelReaderWriter.Read<ModelWithNs>(testData, options);

            // Assert - Validate model
            Assert.IsNotNull(model);
            Assert.AreEqual("testName", model!.Name);
            Assert.AreEqual(25, model.Age);
            Assert.AreEqual(2, model.Items.Count);
            Assert.AreEqual("item1", model.Items[0]);
            Assert.AreEqual("item2", model.Items[1]);
            Assert.AreEqual("nestedName", model.AnotherModel.Name);
            Assert.AreEqual(42, model.AnotherModel.Age);
            Assert.AreEqual(1, model.MoreModels.Count);
            Assert.AreEqual("anotherValue", model.MoreModels[0].Foo);
            Assert.AreEqual(2, model.UnwrappedModels.Count);
            Assert.AreEqual("unwrappedValue1", model.UnwrappedModels[0].Foo);
            Assert.AreEqual("unwrappedValue2", model.UnwrappedModels[1].Foo);

            // Act - Serialize back
            BinaryData serialized = ModelReaderWriter.Write(model, options);

            // Assert - Compare XML (semantic comparison)
            var originalXml = LoadXml(ModelWithNsTestData);
            var serializedXml = LoadXml(serialized);
            AssertXmlEqual(originalXml, serializedXml);
        }

        [Test]
        public void ModelWithNs_SerializesWithNamespaces()
        {
            // Arrange
            var simpleModel = new SimpleModel("nestedName", 42);
            var anotherModel = new AnotherModelWithNs("anotherValue");
            var unwrappedModel1 = new AnotherModelWithNs("unwrappedValue1");
            var unwrappedModel2 = new AnotherModelWithNs("unwrappedValue2");
            var model = new ModelWithNs(
                "testName",
                25,
                new[] { "item1", "item2" },
                simpleModel,
                new[] { anotherModel },
                new[] { unwrappedModel1, unwrappedModel2 }
            );

            // Act - Serialize
            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = ModelReaderWriter.Write(model, options);
            string xml = serialized.ToString();

            // Assert - Validate XML structure with all namespaces
            Assert.IsTrue(xml.Contains("http://www.contoso.com/books.dtd"),
                          $"Expected mymodel namespace URI. Actual: {xml}");
            Assert.IsTrue(xml.Contains("https://example.com/ns1"),
                          $"Expected ns1 namespace URI. Actual: {xml}");
            Assert.IsTrue(xml.Contains("https://example.com/ns2"),
                          $"Expected ns2 namespace URI. Actual: {xml}");
            Assert.IsTrue(xml.Contains("http://www.contoso.com/anotherbook.dtd"),
                          $"Expected foo namespace URI. Actual: {xml}");
            Assert.IsTrue(xml.Contains("http://www.contoso.com/anothermodel.dtd"),
                          $"Expected bar namespace URI. Actual: {xml}");
            Assert.IsTrue(xml.Contains("http://www.example.com/namespace"),
                          $"Expected unwrapped namespace URI. Actual: {xml}");

            // Act - Deserialize back
            var deserialized = ModelReaderWriter.Read<ModelWithNs>(serialized, options);

            // Assert - Validate model matches original
            Assert.IsNotNull(deserialized);
            Assert.AreEqual(model.Name, deserialized!.Name);
            Assert.AreEqual(model.Age, deserialized.Age);
            Assert.AreEqual(model.Items.Count, deserialized.Items.Count);
            Assert.AreEqual(model.Items[0], deserialized.Items[0]);
            Assert.AreEqual(model.Items[1], deserialized.Items[1]);
            Assert.AreEqual(model.AnotherModel.Name, deserialized.AnotherModel.Name);
            Assert.AreEqual(model.AnotherModel.Age, deserialized.AnotherModel.Age);
            Assert.AreEqual(model.MoreModels.Count, deserialized.MoreModels.Count);
            Assert.AreEqual(model.MoreModels[0].Foo, deserialized.MoreModels[0].Foo);
            Assert.AreEqual(model.UnwrappedModels.Count, deserialized.UnwrappedModels.Count);
            Assert.AreEqual(model.UnwrappedModels[0].Foo, deserialized.UnwrappedModels[0].Foo);
            Assert.AreEqual(model.UnwrappedModels[1].Foo, deserialized.UnwrappedModels[1].Foo);
        }

        [Test]
        public void ModelWithNs_NestedModelSerializesContentOnly()
        {
            // This test verifies that when a nested model is serialized via WriteObjectValue,
            // only the content is written (not a duplicate wrapper element)
            var simpleModel = new SimpleModel("testName", 99);
            var anotherModel = new AnotherModelWithNs("testFoo");
            var unwrappedModel = new AnotherModelWithNs("unwrappedFoo");
            var model = new ModelWithNs(
                "rootName",
                50,
                new[] { "a" },
                simpleModel,
                new[] { anotherModel },
                new[] { unwrappedModel }
            );

            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = ModelReaderWriter.Write(model, options);
            string xml = serialized.ToString();

            // The nested SimpleModel should NOT have its own <SimpleModel> wrapper inside the <bar:AnotherModel> wrapper
            // It should just have <name> and <age> directly inside the parent's wrapper
            Assert.IsTrue(xml.Contains("AnotherModel"), "Should find AnotherModel element");

            // Should not have duplicate nesting like <bar:AnotherModel><SimpleModel>...</SimpleModel></bar:AnotherModel>
            Assert.IsFalse(xml.Contains("><SimpleModel><name>"), 
                $"Nested model should not have duplicate wrapper. XML: {xml}");
        }

        #endregion

        #region ExtendingModelWithNs Tests

        private static string ExtendingModelWithNsTestData => File.ReadAllText(
            Path.Combine(Path.GetDirectoryName(typeof(XmlTests).Assembly.Location)!, "Http", "Payload", "Xml", "TestData", "ExtendingModelWithNs.xml"));

        [Test]
        public void ExtendingModelWithNs_DeserializesFromTestData()
        {
            // Arrange
            var options = new ModelReaderWriterOptions("X");
            var testData = BinaryData.FromString(ExtendingModelWithNsTestData);

            // Act - Deserialize
            var model = ModelReaderWriter.Read<ExtendingModelWithNs>(testData, options);

            // Assert - Validate model (including inherited property)
            Assert.IsNotNull(model);
            Assert.AreEqual("testFooValue", model!.Foo);
            Assert.AreEqual(42, model.Bar);

            // Act - Serialize back
            BinaryData serialized = ModelReaderWriter.Write(model, options);

            // Assert - Compare XML (semantic comparison)
            var originalXml = LoadXml(ExtendingModelWithNsTestData);
            var serializedXml = LoadXml(serialized);
            AssertXmlEqual(originalXml, serializedXml);
        }

        [Test]
        public void ExtendingModelWithNs_SerializesWithNamespace()
        {
            // Arrange
            var model = new ExtendingModelWithNs("testFooValue", 42);

            // Act - Serialize
            var options = new ModelReaderWriterOptions("X");
            BinaryData serialized = ModelReaderWriter.Write(model, options);

            // Assert - Compare XML with expected test data
            var expectedXml = LoadXml(ExtendingModelWithNsTestData);
            var serializedXml = LoadXml(serialized);
            AssertXmlEqual(expectedXml, serializedXml);

            // Act - Deserialize back
            var deserialized = ModelReaderWriter.Read<ExtendingModelWithNs>(serialized, options);

            // Assert - Validate model matches original
            Assert.IsNotNull(deserialized);
            Assert.AreEqual(model.Foo, deserialized!.Foo);
            Assert.AreEqual(model.Bar, deserialized.Bar);
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Loads XML from a string, handling XML declaration.
        /// </summary>
        private static XElement LoadXml(string xmlContent)
        {
            return XDocument.Parse(xmlContent).Root!;
        }

        /// <summary>
        /// Loads XML from BinaryData, handling BOM and encoding.
        /// </summary>
        private static XElement LoadXml(BinaryData data)
        {
            using var stream = data.ToStream();
            return XDocument.Load(stream).Root!;
        }

        /// <summary>
        /// Performs semantic XML comparison, ignoring whitespace and attribute order.
        /// </summary>
        private static void AssertXmlEqual(XElement expected, XElement actual)
        {
            // Compare element names (including namespace)
            Assert.AreEqual(expected.Name, actual.Name,
                $"Element names differ. Expected: {expected.Name}, Actual: {actual.Name}");

            // Compare attributes (order-independent)
            var expectedAttrs = expected.Attributes()
                .Where(a => !a.IsNamespaceDeclaration)
                .OrderBy(a => a.Name.ToString())
                .ToList();
            var actualAttrs = actual.Attributes()
                .Where(a => !a.IsNamespaceDeclaration)
                .OrderBy(a => a.Name.ToString())
                .ToList();

            Assert.AreEqual(expectedAttrs.Count, actualAttrs.Count,
                $"Attribute count differs for element {expected.Name}. Expected: {expectedAttrs.Count}, Actual: {actualAttrs.Count}");

            for (int i = 0; i < expectedAttrs.Count; i++)
            {
                Assert.AreEqual(expectedAttrs[i].Name, actualAttrs[i].Name,
                    $"Attribute name differs. Expected: {expectedAttrs[i].Name}, Actual: {actualAttrs[i].Name}");
                Assert.AreEqual(expectedAttrs[i].Value, actualAttrs[i].Value,
                    $"Attribute value differs for {expectedAttrs[i].Name}. Expected: {expectedAttrs[i].Value}, Actual: {actualAttrs[i].Value}");
            }

            // Compare text content (if no child elements)
            if (!expected.HasElements && !actual.HasElements)
            {
                Assert.AreEqual(expected.Value.Trim(), actual.Value.Trim(),
                    $"Text content differs for element {expected.Name}. Expected: {expected.Value.Trim()}, Actual: {actual.Value.Trim()}");
                return;
            }

            // Compare child elements
            var expectedChildren = expected.Elements().ToList();
            var actualChildren = actual.Elements().ToList();

            Assert.AreEqual(expectedChildren.Count, actualChildren.Count,
                $"Child element count differs for {expected.Name}. Expected: {expectedChildren.Count}, Actual: {actualChildren.Count}");

            for (int i = 0; i < expectedChildren.Count; i++)
            {
                AssertXmlEqual(expectedChildren[i], actualChildren[i]);
            }
        }

        #endregion
    }
}
