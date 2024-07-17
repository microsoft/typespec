// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using Moq.Protected;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers
{
    public class EnumProviderSerializationTests
    {
        internal const string NewLine = "\n";
        private readonly string _mocksFolder = "Mocks";
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var configFilePath = Path.Combine(AppContext.BaseDirectory, _mocksFolder);
            var mockTypeFactory = new Mock<ScmTypeFactory>() { };
            mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(new CSharpType(typeof(int)));
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            // invoke the load method with the config file path
            var loadMethod = typeof(Configuration).GetMethod("Load", BindingFlags.Static | BindingFlags.NonPublic);
            object?[] parameters = [configFilePath, null];
            var config = loadMethod?.Invoke(null, parameters);
            var mockGeneratorContext = new Mock<GeneratorContext>(config!);
            var mockPluginInstance = new Mock<ClientModelPlugin>(mockGeneratorContext.Object) {CallBase = true };
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        //// Validates the int based fixed enum
        //[TestCase]
        //public void BuildEnumType_ValidateIntBasedFixedEnum()
        //{
        //    var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Int32), [new InputEnumTypeValue("One", 1, null), new InputEnumTypeValue("Two", 2, null)], false);
        //    var enumType = TypeProvider.Create(input);

        //    // fixed enums have serialization
        //    TypeProvider? serialization = enumType.SerializationProviders.FirstOrDefault();
        //    Assert.IsTrue(enumType.SerializationProviders.Count == 1);
        //    Assert.IsNotNull(serialization);

        //    // validate the expression is working fine
        //    var writer = new TypeProviderWriter(serialization!);
        //    CodeFile codeFile = writer.Write();
        //    var result = codeFile.Content;
        //    var expected = Helpers.GetExpectedFromFile();
        //    Assert.AreEqual(expected, result);
        //}

        //// Validates the float based fixed enum
        //[TestCase]
        //public void BuildEnumType_ValidateFloatBasedFixedEnum()
        //{
        //    var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Float32), [new InputEnumTypeValue("One", 1f, null), new InputEnumTypeValue("Two", 2f, null)], false);
        //    var enumType = EnumProvider.Create(input);

        //    // fixed enums have serialization
        //    TypeProvider? serialization = enumType.SerializationProviders.FirstOrDefault();
        //    Assert.IsTrue(enumType.SerializationProviders.Count == 1);
        //    Assert.IsNotNull(serialization);

        //    // validate the expression is working fine
        //    var writer = new TypeProviderWriter(serialization!);
        //    CodeFile codeFile = writer.Write();
        //    var result = codeFile.Content;
        //    var expected = Helpers.GetExpectedFromFile();
        //    Assert.AreEqual(expected, result);
        //}

        //// Validates the string based fixed enum
        //[TestCase]
        //public void BuildEnumType_ValidateStringBasedFixedEnum()
        //{
        //    var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.String), [new InputEnumTypeValue("One", "1", null), new InputEnumTypeValue("Two", "2", null)], false);
        //    var enumType = EnumProvider.Create(input);

        //    // fixed enums have serialization
        //    TypeProvider? serialization = enumType.SerializationProviders.FirstOrDefault();
        //    Assert.IsTrue(enumType.SerializationProviders.Count == 1);
        //    Assert.IsNotNull(serialization);

        //    // validate the expression is working fine
        //    var writer = new TypeProviderWriter(serialization!);
        //    CodeFile codeFile = writer.Write();
        //    var result = codeFile.Content;
        //    var expected = Helpers.GetExpectedFromFile();
        //    Assert.AreEqual(expected, result);
        //}

        //// Validates the int based extensible enum
        //[TestCase]
        //public void BuildEnumType_ValidateIntBasedExtensibleEnum()
        //{
        //    var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Int32), [new InputEnumTypeValue("One", 1, null), new InputEnumTypeValue("Two", 2, null)], true);
        //    var enumType = EnumProvider.Create(input);

        //    // extensible enums have serialization
        //    var serialization = enumType.SerializationProviders.FirstOrDefault();
        //    Assert.IsNotNull(serialization);
        //    Assert.IsTrue(enumType.SerializationProviders.Count == 1);

        //    // validate the expression is working fine
        //    var writer = new TypeProviderWriter(serialization!);
        //    CodeFile codeFile = writer.Write();
        //    var result = codeFile.Content;
        //    var expected = Helpers.GetExpectedFromFile();
        //    Assert.AreEqual(expected, result);
        //}

        //// Validates the float based extensible enum
        //[TestCase]
        //public void BuildEnumType_ValidateFloatBasedExtensibleEnum()
        //{
        //    var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Float32), [new InputEnumTypeValue("One", 1f, null), new InputEnumTypeValue("Two", 2f, null)], true);
        //    var enumType = EnumProvider.Create(input);

        //    // extensible enums have serialization
        //    var serialization = enumType.SerializationProviders.FirstOrDefault();
        //    Assert.IsNotNull(serialization);
        //    Assert.IsTrue(enumType.SerializationProviders.Count == 1);

        //    // validate the expression is working fine
        //    var writer = new TypeProviderWriter(serialization!);
        //    CodeFile codeFile = writer.Write();
        //    var result = codeFile.Content;
        //    var expected = Helpers.GetExpectedFromFile();
        //    Assert.AreEqual(expected, result);
        //}

        //// Validates the string based extensible enum
        //[TestCase]
        //public void BuildEnumType_ValidateStringBasedExtensibleEnum()
        //{
        //    var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.String), [new InputEnumTypeValue("One", "1", null), new InputEnumTypeValue("Two", "2", null)], true);
        //    var enumType = EnumProvider.Create(input);

        //    // extensible enums have serialization
        //    var serialization = enumType.SerializationProviders.FirstOrDefault();
        //    Assert.IsNotNull(serialization);
        //    Assert.IsTrue(enumType.SerializationProviders.Count == 1);

        //    // validate the expression is working fine
        //    var writer = new TypeProviderWriter(serialization!);
        //    CodeFile codeFile = writer.Write();
        //    var result = codeFile.Content;
        //    var expected = Helpers.GetExpectedFromFile();
        //    Assert.AreEqual(expected, result);
        //}
    }
}
