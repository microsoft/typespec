// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Snippets;
using Moq;
using NUnit.Framework;
using NUnit.Framework.Internal;
using static Microsoft.Generator.CSharp.Snippets.ExtensibleSnippets;

namespace Microsoft.Generator.CSharp.Tests
{
    // Tests for the Configuration class
    public class ConfigurationTests
    {
#pragma warning disable CS8602 // Dereference of a possibly null reference.
        private readonly string _mocksFolder = "./Mocks";

        // Validates that the configuration is initialized correctly given input
        [Test]
        public void TestInitialize()
        {
            // mock api types
            var mockApiTypes = new Mock<ApiTypes>()
            {
                CallBase = true
            };

            var mockExtensibleSnippets = new Mock<ExtensibleSnippets>()
            {
                CallBase = true
            };

            mockApiTypes.SetupGet(p => p.EndPointSampleValue).Returns("Sample");

            var modelSnippets = new Mock<ModelSnippets>().Object;
            mockExtensibleSnippets.SetupGet(p => p.Model).Returns(modelSnippets);

            string ns = "sample.namespace";
            string? unknownStringProperty = "unknownPropertyValue";
            bool? unknownBoolProp = false;

            var configuration = Configuration.Load(_mocksFolder);

            var parsedNs = configuration.Namespace;

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
            var configFilePath = Path.Combine(_mocksFolder, "unknown_file.out");
            Assert.Throws<InvalidOperationException>(() => Configuration.Load(configFilePath));
        }

        // Validates that the output folder is parsed correctly from the configuration
        [TestCaseSource("ParseConfigOutputFolderTestCases")]
        public void TestParseConfig_OutputFolder(string mockJson, bool throwsError)
        {

            var expected = Path.GetFullPath(_mocksFolder);

            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => Configuration.Load(string.Empty));
                return;
            }

            var configuration = Configuration.Load(_mocksFolder, mockJson);

            Assert.AreEqual(expected, configuration.OutputDirectory);
        }

        // Validates that the LibraryName field is parsed correctly from the configuration
        [TestCaseSource("ParseConfigLibraryNameTestCases")]
        public void TestParseConfig_LibraryName(string mockJson, bool throwsError)
        {

            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => Configuration.Load(string.Empty, mockJson));
                return;
            }

            var configuration = Configuration.Load(string.Empty, mockJson);
            var library = configuration.LibraryName;
            var expected = "libraryName";

            Assert.AreEqual(expected, library);
        }

        // Validates that the namespace field is parsed correctly from the configuration
        [TestCaseSource("ParseConfigNamespaceTestCases")]
        public void TestParseConfig_Namespace(string mockJson, bool throwsError)
        {
            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => Configuration.Load(string.Empty, mockJson));
                return;
            }

            var configuration = Configuration.Load(string.Empty, mockJson);
            var ns = configuration.Namespace;
            var expected = "namespace";

            Assert.AreEqual(expected, ns);
        }

        // Validates that the output folder is parsed correctly from the configuration
        [TestCaseSource("ParseConfigUseModelNamespaceTestCases")]
        public void TestParseConfig_UseModelNamespace(string mockJson, bool expected)
        {
            var configuration = Configuration.Load(string.Empty, mockJson);
            var useModelNs = configuration.UseModelNamespace;

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

            var configuration = Configuration.Load(string.Empty, mockJson);

            var additionalConfigOptions = configuration.AdditionalConfigOptions;
            Assert.IsNotNull(additionalConfigOptions);
            Assert.IsTrue(additionalConfigOptions!.ContainsKey("unknown-string-property"));
            Assert.IsTrue(additionalConfigOptions.ContainsKey("unknown-bool-property"));

            string unknownStringValue = additionalConfigOptions["unknown-string-property"].ToObjectFromJson<string>()!;
            Assert.AreEqual("unknownPropertyValue", unknownStringValue);

            bool unknownBoolValue = additionalConfigOptions["unknown-bool-property"].ToObjectFromJson<bool>();
            Assert.AreEqual(true, unknownBoolValue);
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
