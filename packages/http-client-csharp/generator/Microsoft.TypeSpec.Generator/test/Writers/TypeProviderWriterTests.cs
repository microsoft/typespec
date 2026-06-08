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

        [Test]
        public void CodeWriter_UsesSimpleTypeNamesWhenResolverIsEnabled()
        {
            var result = WriteWithResolver(CSharpTypeNameResolver.Create([]), writer =>
                writer.WriteLine($"{typeof(BinaryData)} Value;"));

            StringAssert.Contains("using System;\n", result);
            StringAssert.Contains("BinaryData Value;\n", result);
            StringAssert.DoesNotContain("global::System.BinaryData", result);
        }

        [Test]
        public void CodeWriter_FallsBackToFullyQualifiedNameForConflictingSimpleNames()
        {
            var firstType = new CSharpType("Foo", "Azure.Sample", false, false, null, [], true, false);
            var secondType = new CSharpType("Foo", "System", false, false, null, [], true, false);

            var result = WriteWithResolver(CSharpTypeNameResolver.Create([]), writer =>
            {
                writer.WriteLine($"{firstType} first;");
                writer.WriteLine($"{secondType} second;");
            });

            StringAssert.DoesNotContain("using Azure.Sample;\n", result);
            StringAssert.DoesNotContain("using System;\n", result);
            StringAssert.Contains("Azure.Sample.Foo first;\n", result);
            StringAssert.Contains("System.Foo second;\n", result);
            StringAssert.DoesNotContain("global::", result);
        }

        [Test]
        public void CodeWriter_FallsBackToFullyQualifiedNameWhenCurrentNamespaceShadowsType()
        {
            var resolver = CSharpTypeNameResolver.Create(
            [
                new TestTypeProvider(name: "BinaryData", ns: "Sample.Models")
            ]);

            var result = WriteWithResolver(resolver, writer =>
                writer.WriteLine($"{typeof(BinaryData)} Value;"));

            StringAssert.DoesNotContain("using System;\n", result);
            StringAssert.Contains("System.BinaryData Value;\n", result);
            StringAssert.DoesNotContain("global::", result);
        }

        [Test]
        public void CodeWriter_UsesFullNameForConflictingSimpleNamesWithCommonNamespacePrefix()
        {
            var firstType = new CSharpType("Foo", "Azure.ResourceManager.Network", false, false, null, [], true, false);
            var secondType = new CSharpType("Foo", "Azure.ResourceManager.Compute", false, false, null, [], true, false);

            var result = WriteWithResolver(CSharpTypeNameResolver.Create([]), writer =>
            {
                writer.WriteLine($"{firstType} first;");
                writer.WriteLine($"{secondType} second;");
            });

            StringAssert.DoesNotContain("using Azure.ResourceManager;\n", result);
            StringAssert.Contains("Azure.ResourceManager.Network.Foo first;\n", result);
            StringAssert.Contains("Azure.ResourceManager.Compute.Foo second;\n", result);
            StringAssert.DoesNotContain("global::", result);
        }

        private static string WriteWithResolver(CSharpTypeNameResolver resolver, Action<CodeWriter> write)
        {
            using var collector = new CodeWriter(resolver.CreateCollector(), suppressOutput: true);
            using (collector.SetNamespace("Sample.Models"))
            {
                write(collector);
            }

            using var writer = new CodeWriter(resolver.CreateResolver(collector.ReferencedTypes, "Sample.Models"));
            using (writer.SetNamespace("Sample.Models"))
            {
                write(writer);
            }

            return writer.ToString();
        }
    }
}
