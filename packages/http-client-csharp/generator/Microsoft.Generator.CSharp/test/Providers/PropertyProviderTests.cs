// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq.Protected;
using Moq;
using NUnit.Framework;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class PropertyProviderTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private GeneratorContext _generatorContext;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, "Mocks");
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            _generatorContext = new GeneratorContext(Configuration.Load(_configFilePath));
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        [TestCaseSource(nameof(CollectionPropertyTestCases))]
        public void CollectionProperty(CSharpType coreType, InputModelProperty collectionProperty, CSharpType expectedType)
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>();
            mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns(coreType);
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var property = new PropertyProvider(collectionProperty);
            Assert.AreEqual(collectionProperty.Name.ToCleanName(), property.Name);
            Assert.AreEqual(expectedType, property.Type);

            // validate the parameter conversion
            var propertyAsParam = property.AsParameter;
            Assert.IsNotNull(propertyAsParam);
            Assert.AreEqual(collectionProperty.Name.ToVariableName(), propertyAsParam.Name);
            Assert.AreEqual(expectedType, propertyAsParam.Type);
        }

        private static IEnumerable<TestCaseData> CollectionPropertyTestCases()
        {
            // List<string> -> IReadOnlyList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                new InputModelProperty("readOnlyCollection", "readOnlyCollection", string.Empty,
                    new InputArrayType("List", "id", new InputPrimitiveType(InputPrimitiveTypeKind.String)),
                    true,
                    true,
                    false),
                new CSharpType(typeof(IReadOnlyList<>), typeof(string)));
            // Dictionary<string, int> -> IReadOnlyDictionary<string, int>
            yield return new TestCaseData(
                new CSharpType(typeof(IDictionary<,>), typeof(string), typeof(int)),
                new InputModelProperty("readOnlyDictionary", "readOnlyDictionary", string.Empty,
                    new InputDictionaryType("Dictionary", new InputPrimitiveType(InputPrimitiveTypeKind.String), new InputPrimitiveType(InputPrimitiveTypeKind.Int32)),
                    true,
                    true,
                    false),
                new CSharpType(typeof(IReadOnlyDictionary<,>), typeof(string), typeof(int)));
            // ReadOnlyMemory<byte> -> ReadOnlyMemory<byte>
            yield return new TestCaseData(
                new CSharpType(typeof(ReadOnlyMemory<>), typeof(byte)),
                new InputModelProperty("readOnlyMemory", "readOnlyMemory", string.Empty,
                    InputPrimitiveType.Base64,
                    true,
                    true,
                    false),
                new CSharpType(typeof(ReadOnlyMemory<>), typeof(byte)));
            // string -> string
            yield return new TestCaseData(
                new CSharpType(typeof(string)),
                new InputModelProperty("stringProperty", "stringProperty", string.Empty,
                    new InputPrimitiveType(InputPrimitiveTypeKind.String),
                    true,
                    true,
                    false),
                new CSharpType(typeof(string)));
        }
    }
}
