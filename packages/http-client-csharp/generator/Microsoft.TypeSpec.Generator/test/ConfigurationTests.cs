// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests
{
    // Tests for the Configuration class
    public class ConfigurationTests
    {
        // Validates that the configuration is initialized correctly given input
        [Test]
        public void TestInitialize()
        {
            string? unknownStringProperty = "unknownPropertyValue";
            bool? unknownBoolProp = false;

            var configuration = Configuration.Load(MockHelpers.TestHelpersFolder);

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
        [TestCaseSource(nameof(ParseConfigOutputFolderTestCases))]
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
            Assert.AreEqual(Path.Combine(expected, "src", "Generated"), configuration.ProjectGeneratedDirectory);
            Assert.AreEqual(Path.Combine(expected, "tests", "Generated"), configuration.TestGeneratedDirectory);
        }

        // Validates that the LibraryName field is parsed correctly from the configuration
        [TestCaseSource("ParseConfigLibraryNameTestCases")]
        public void TestParseConfig_LibraryName(string mockJson, bool throwsError)
        {
            if (throwsError)
            {
                Assert.Throws<InvalidOperationException>(() => MockHelpers.LoadMockGenerator(configuration: mockJson));
                return;
            }

            var library = CodeModelGenerator.Instance.Configuration.PackageName;
            var expected = "libraryName";

            Assert.AreEqual(expected, library);
        }

        // Validates that additional configuration options are parsed correctly
        [Test]
        public void TestParseConfig_AdditionalConfigOptions()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName"",
                ""unknown-string-property"": ""unknownPropertyValue"",
                ""unknown-bool-property"": true
                }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);

            var additionalConfigOptions = CodeModelGenerator.Instance.Configuration.AdditionalConfigOptions;
            Assert.IsNotNull(additionalConfigOptions);
            Assert.IsTrue(additionalConfigOptions!.ContainsKey("unknown-string-property"));
            Assert.IsTrue(additionalConfigOptions.ContainsKey("unknown-bool-property"));

            string unknownStringValue = additionalConfigOptions["unknown-string-property"].ToObjectFromJson<string>()!;
            Assert.AreEqual("unknownPropertyValue", unknownStringValue);

            bool unknownBoolValue = additionalConfigOptions["unknown-bool-property"].ToObjectFromJson<bool>();
            Assert.AreEqual(true, unknownBoolValue);

            Assert.AreEqual("libraryName", CodeModelGenerator.Instance.Configuration.PackageName);
            Assert.AreEqual("Sample", CodeModelGenerator.Instance.TypeFactory.PrimaryNamespace);
        }

        [Test]
        public void DisableDocsForProperty()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);

            Assert.IsTrue(CodeModelGenerator.Instance.Configuration.DisableXmlDocs);

            PropertyProvider property = new($"IntProperty description", MethodSignatureModifiers.Public, typeof(int), "IntProperty", new AutoPropertyBody(true), new TestTypeProvider());
            using var writer = new CodeWriter();
            writer.WriteProperty(property);
            Assert.AreEqual("public int IntProperty { get; set; }\n", writer.ToString(false));
        }

        [Test]
        [TestCase("removeOrInternalize")]
        [TestCase("keepAll")]
        [TestCase("internalize")]
        public void UnreferencedTypeHandling(string input)
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName"",
                ""unreferenced-types-handling"": ""keepAll""
                }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);
            var expected = input switch
            {
                "removeOrInternalize" => Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                "keepAll" => Configuration.UnreferencedTypesHandlingOption.KeepAll,
                "internalize" => Configuration.UnreferencedTypesHandlingOption.Internalize,
                _ => throw new ArgumentException("Invalid input", nameof(input))
            };

            StringAssert.AreEqualIgnoringCase(expected.ToString(), input);
        }

        [Test]
        public void DisableDocsForMethod()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);

            Assert.IsTrue(CodeModelGenerator.Instance.Configuration.DisableXmlDocs);
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
                ""package-name"": ""libraryName"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);

            Assert.IsTrue(CodeModelGenerator.Instance.Configuration.DisableXmlDocs);
            TypeProvider type = new TestTypeProvider();
            TypeProviderWriter writer = new(type);
            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.Write().Content);
        }

        [Test]
        public void DisableDocsForField()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName"",
                ""disable-xml-docs"": true
                }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);

            Assert.IsTrue(CodeModelGenerator.Instance.Configuration.DisableXmlDocs);

            FieldProvider field = new(FieldModifiers.Public, typeof(int), "_field", new TestTypeProvider(), $"Field Description");
            using var writer = new CodeWriter();
            writer.WriteField(field);
            Assert.AreEqual("public int _field;\n", writer.ToString(false));
        }

        [Test]
        public void CanAddLicenseInfo()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName"",
                ""license"": {
                    ""name"": ""MIT"",
                    ""company"": ""Microsoft"",
                    ""link"": ""https://mit-license.org"",
                    ""header"": ""This is a test header."",
                    ""description"": ""This is a test description.""
                }
            }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);
            var licenseInfo = CodeModelGenerator.Instance.Configuration.LicenseInfo;
            Assert.IsNotNull(licenseInfo);
            Assert.AreEqual("This is a test header.", licenseInfo!.Header);
            Assert.AreEqual("MIT", licenseInfo.Name);
            Assert.AreEqual("Microsoft", licenseInfo.Company);
            Assert.AreEqual("https://mit-license.org", licenseInfo.Link);
            Assert.AreEqual("This is a test description.", licenseInfo.Description);
            Assert.AreEqual("This is a test header.", CodeModelGenerator.Instance.LicenseHeader);
        }

        [Test]
        public void LicenseInfoIsNullWhenNotInConfig()
        {
            var mockJson = @"{
                ""output-folder"": ""outputFolder"",
                ""package-name"": ""libraryName""
            }";

            MockHelpers.LoadMockGenerator(configuration: mockJson);
            var licenseInfo = CodeModelGenerator.Instance.Configuration.LicenseInfo;
            Assert.IsNull(licenseInfo);
        }

        public static IEnumerable<TestCaseData> ParseConfigOutputFolderTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                    ""output-folder"": ""outputFolder"",
                    ""package-name"": ""libraryName""
                }", false);
                yield return new TestCaseData(@"{
                    ""package-name"": ""libraryName""
                }", true);
            }
        }

        public static IEnumerable<TestCaseData> ParseConfigLibraryNameTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                    ""output-folder"": ""outputFolder"",
                    ""package-name"": ""libraryName"",
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
                    ""package-name"": ""libraryName"",
                }", false);
                yield return new TestCaseData(@"{
                    ""output-folder"": ""outputFolder"",
                    ""package-name"": ""libraryName""
                }", true);
            }
        }

        public static IEnumerable<TestCaseData> ParseConfigUseModelNamespaceTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                    ""output-folder"": ""outputFolder"",
                    ""package-name"": ""libraryName"",
                ""use-model-namespace"": true
                }", true);
                yield return new TestCaseData(@"{
                    ""output-folder"": ""outputFolder"",
                    ""package-name"": ""libraryName"",
                }", true);
            }
        }
    }
}
