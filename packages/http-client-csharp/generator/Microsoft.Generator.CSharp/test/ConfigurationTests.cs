// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests
{
    // Tests for the Configuration class
    public class ConfigurationTests
    {
        // Validates that the configuration is initialized correctly given input
        [Test]
        public void TestInitialize()
        {
            string ns = "Sample";
            string? unknownStringProperty = "unknownPropertyValue";
            bool? unknownBoolProp = false;

            var configuration = Configuration.Load(MockHelpers.TestHelpersFolder);

            var parsedNs = configuration.RootNamespace;

            Assert.AreEqual(ns, parsedNs);
            // get the unknown property from the configuration
            var additionalConfigOptions = configuration.AdditionalConfigOptions;
            Assert.IsNotNull(additionalConfigOptions);
            Assert.IsTrue(additionalConfigOptions!.ContainsKey("unknown-string-property"));
            Assert.IsTrue(additionalConfigOptions.ContainsKey("unknown-bool-property"));

            string unknownStringValue = additionalConfigOptions["unknown-string-property"].ToObjectFromJson<string>()!;
            Assert.AreEqual(unknownStringProperty, unknownStringValue);

            bool unknownBoolValue = additionalConfigOptions["unknown-bool-property"].ToObjectFromJson<bool>();
            Assert.AreEqual(unknownBoolProp, unknownBoolValue);
        }

        // Validates that an exception is thrown when no configuration file is found
        [Test]
        public void TestInitialize_NoFileFound()
        {
            var configFilePath = Path.Combine(MockHelpers.TestHelpersFolder, "unknown_file.out");
            Assert.Throws<InvalidOperationException>(() => Configuration.Load(configFilePath));
        }

        // Validates that the output folder is parsed correctly from the configuration
        [TestCaseSource("ParseConfigOutputFolderTestCases")]
        public void TestParseConfig_OutputFolder(string mockJson, bool throwsError)
        {

            var expected = Path.GetFullPath(MockHelpers.TestHelpersFolder);

            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => Configuration.Load(string.Empty));
                return;
            }

            var configuration = Configuration.Load(MockHelpers.TestHelpersFolder, mockJson);

            Assert.AreEqual(expected, configuration.OutputDirectory);
        }

        // Validates that the LibraryName field is parsed correctly from the configuration
        [TestCaseSource("ParseConfigLibraryNameTestCases")]
        public void TestParseConfig_LibraryName(string mockJson, bool throwsError)
        {
            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => MockHelpers.LoadMockPlugin(configuration: mockJson));
                return;
            }

            var library = CodeModelPlugin.Instance.Configuration.LibraryName;
            var expected = "libraryName";

            Assert.AreEqual(expected, library);
        }

        // Validates that the namespace field is parsed correctly from the configuration
        [TestCaseSource("ParseConfigNamespaceTestCases")]
        public void TestParseConfig_Namespace(string mockJson, bool throwsError)
        {
            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => MockHelpers.LoadMockPlugin(configuration: mockJson));
                return;
            }

            var ns = CodeModelPlugin.Instance.Configuration.RootNamespace;
            var expected = "namespace";

            Assert.AreEqual(expected, ns);
        }

        // Validates that the output folder is parsed correctly from the configuration
        [TestCaseSource("ParseConfigUseModelNamespaceTestCases")]
        public void TestParseConfig_UseModelNamespace(string mockJson, bool expected)
        {
            MockHelpers.LoadMockPlugin(configuration: mockJson);
            var useModelNs = CodeModelPlugin.Instance.Configuration.UseModelNamespace;

            Assert.AreEqual(expected, useModelNs);
        }

        // Validates that additional configuration options are parsed correctly
        [Test]
        public void TestParseConfig_AdditionalConfigOptions()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace"",
                ""unknown-string-property"": ""unknownPropertyValue"",
                ""unknown-bool-property"": true
                }";

            MockHelpers.LoadMockPlugin(configuration: mockJson);

            var additionalConfigOptions = CodeModelPlugin.Instance.Configuration.AdditionalConfigOptions;
            Assert.IsNotNull(additionalConfigOptions);
            Assert.IsTrue(additionalConfigOptions!.ContainsKey("unknown-string-property"));
            Assert.IsTrue(additionalConfigOptions.ContainsKey("unknown-bool-property"));

            string unknownStringValue = additionalConfigOptions["unknown-string-property"].ToObjectFromJson<string>()!;
            Assert.AreEqual("unknownPropertyValue", unknownStringValue);

            bool unknownBoolValue = additionalConfigOptions["unknown-bool-property"].ToObjectFromJson<bool>();
            Assert.AreEqual(true, unknownBoolValue);
        }

        [Test]
        public void DisableDocsForProperty()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockPlugin(configuration: mockJson);

            Assert.IsTrue(CodeModelPlugin.Instance.Configuration.DisableXmlDocs);

            PropertyProvider property = new($"IntProperty description", MethodSignatureModifiers.Public, typeof(int), "IntProperty", new AutoPropertyBody(true), new TestTypeProvider());
            using var writer = new CodeWriter();
            writer.WriteProperty(property, true);
            Assert.AreEqual("public int IntProperty { get; set; }\n", writer.ToString(false));
        }

        [Test]
        public void DisableDocsForMethod()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockPlugin(configuration: mockJson);

            Assert.IsTrue(CodeModelPlugin.Instance.Configuration.DisableXmlDocs);
            MethodProvider method = new(
                new MethodSignature(
                    "Method",
                    $"Method Description",
                    MethodSignatureModifiers.Public,
                    null,
                    null,
                    []),
                ThrowExpression(Null),
                new TestTypeProvider());
            using var writer = new CodeWriter();
            writer.WriteMethod(method);
            Assert.AreEqual("public void Method() => throw null;\n", writer.ToString(false));
        }

        [Test]
        public void DisableDocsForType()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""Test"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockPlugin(configuration: mockJson);

            Assert.IsTrue(CodeModelPlugin.Instance.Configuration.DisableXmlDocs);
            TypeProvider type = new TestTypeProvider();
            TypeProviderWriter writer = new(type);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.Write().Content);
        }

        [Test]
        public void DisableDocsForField()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockPlugin(configuration: mockJson);

            Assert.IsTrue(CodeModelPlugin.Instance.Configuration.DisableXmlDocs);
            FieldProvider field = new(FieldModifiers.Public, typeof(int), "_field", new TestTypeProvider(), $"Field Description");
            using var writer = new CodeWriter();
            writer.WriteField(field);
            Assert.AreEqual("public int _field;\n", writer.ToString(false));
        }

        public static IEnumerable<TestCaseData> ParseConfigOutputFolderTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace""
                }", false);
                yield return new TestCaseData(@"{
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace""
                }", true);
            }
        }

        public static IEnumerable<TestCaseData> ParseConfigLibraryNameTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace""
                }", false);
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder""
                }", true);
            }
        }

        public static IEnumerable<TestCaseData> ParseConfigNamespaceTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace""
                }", false);
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName""
                }", true);
            }
        }

        public static IEnumerable<TestCaseData> ParseConfigUseModelNamespaceTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace"",
                ""use-model-namespace"": true
                }", true);
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""namespace""
                }", true);
            }
        }
    }
}
