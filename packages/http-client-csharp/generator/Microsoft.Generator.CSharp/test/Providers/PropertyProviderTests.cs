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

            var parameter = new ParameterProvider(collectionProperty);
            Assert.AreEqual(collectionProperty.Name, parameter.Name);
            Assert.AreEqual(expectedType, parameter.Type);
        }

        private static IEnumerable<TestCaseData> CollectionPropertyTestCases()
        {
            // List<string> -> IReadOnlyList<string>
            yield return new TestCaseData(
                new CSharpType(typeof(IList<>), typeof(string)),
                new InputModelProperty("readOnlyCollection", "readOnlyCollection", string.Empty,
                    new InputArrayType("List", new InputPrimitiveType(InputPrimitiveTypeKind.String), false),
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
        }
    }
}
