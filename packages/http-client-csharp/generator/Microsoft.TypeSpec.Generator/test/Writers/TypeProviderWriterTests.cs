// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Writers
{
    internal class TypeProviderWriterTests
    {
        public TypeProviderWriterTests()
        {
            MockHelpers.LoadMockGenerator();
        }

        // Tests that the Write method is successfully overridden.
        [Test]
        public void Write_Override()
        {
            var writer = new MockExpressionTypeProviderWriter(TestTypeProvider.Empty);
            Assert.That(writer.Write, Throws.Exception.TypeOf<NotImplementedException>());
        }

        private class MockExpressionTypeProviderWriter : TypeProviderWriter
        {
            public MockExpressionTypeProviderWriter(TypeProvider provider) : base(provider) { }

            public override CodeFile Write()
            {
                throw new NotImplementedException();
            }
        }

        [Test]
        public void TypeProviderWriter_WriteModel()
        {
            var properties = new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty };
            var inputModel = InputFactory.Model("TestModel", properties: properties);
            MockHelpers.LoadMockGenerator(inputModelTypes: [inputModel]);

            var modelProvider = new ModelProvider(inputModel);
            var codeFile = new TypeProviderWriter(modelProvider).Write();
            var result = codeFile.Content;

            var expected = Helpers.GetExpectedFromFile();

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void TypeProviderWriter_WriteModelAsStruct()
        {
            var properties = new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty };
            var inputModel = InputFactory.Model("TestModel", properties: properties, modelAsStruct: true);
            MockHelpers.LoadMockGenerator(inputModelTypes: [inputModel]);

            var modelProvider = new ModelProvider(inputModel);
            var codeFile = new TypeProviderWriter(modelProvider).Write();
            var result = codeFile.Content;

            var expected = Helpers.GetExpectedFromFile();

            Assert.AreEqual(expected, result);
        }

        // common usages definitions
        internal static readonly InputModelProperty RequiredStringProperty = InputFactory.Property("requiredString", InputPrimitiveType.String, isRequired: true);

        internal static readonly InputModelProperty RequiredIntProperty = InputFactory.Property("requiredInt", InputPrimitiveType.Int32, isRequired: true);

        [Test]
        public void TypeProviderWriter_WriteEnumWithFieldAttributes()
        {
            var enumProvider = new TestEnumWithAttributesProvider();
            var codeFile = new TypeProviderWriter(enumProvider).Write();
            var result = codeFile.Content;

            var expected = Helpers.GetExpectedFromFile();

            Assert.AreEqual(expected, result);
        }

        private class TestEnumWithAttributesProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => "TestEnum.cs";
            protected override string BuildName() => "TestEnum";
            protected override string BuildNamespace() => "Sample.Models";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum;

            protected internal override FieldProvider[] BuildFields()
            {
                return
                [
                    new FieldProvider(
                        FieldModifiers.Public | FieldModifiers.Static,
                        typeof(int),
                        "Value1",
                        this,
                        $"First value",
                        initializationValue: new LiteralExpression(1),
                        attributes: [new AttributeStatement(typeof(ObsoleteAttribute))]),
                    new FieldProvider(
                        FieldModifiers.Public | FieldModifiers.Static,
                        typeof(int),
                        "Value2",
                        this,
                        $"Second value",
                        initializationValue: new LiteralExpression(2))
                ];
            }
        }
    }
}
