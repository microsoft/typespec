// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Microsoft.TypeSpec.Generator.Utilities;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class FieldProviderTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void AsParameterRespectsChangesToFieldType()
        {
            var field = new FieldProvider(FieldModifiers.Private, new CSharpType(typeof(int)), "name", new TestTypeProvider());
            field.Type = new CSharpType(typeof(string));
            field.WireInfo = new PropertyWireInformation(SerializationFormat.Default, true, true, true, false, "newName", false, false);
            var parameter = field.AsParameter;

            Assert.IsTrue(parameter.Type.Equals(typeof(string)));
        }

        [Test]
        public void CanUpdateFieldProvider()
        {
            var field = new FieldProvider(FieldModifiers.Private, new CSharpType(typeof(int)), "name", new TestTypeProvider());
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };

            field.Update(
                modifiers: field.Modifiers | FieldModifiers.ReadOnly,
                description: $"foo",
                type: new CSharpType(typeof(string)),
                name: "_newName",
                enclosingType: new TestTypeProvider(),
                attributes: attributes);

            Assert.AreEqual("_newName", field.Name);
            Assert.AreEqual("foo", field.Description!.ToString());
            Assert.AreEqual(FieldModifiers.Private | FieldModifiers.ReadOnly, field.Modifiers);
            Assert.AreEqual(new CSharpType(typeof(string)), field.Type);

            Assert.IsNotNull(field.Attributes);
            Assert.AreEqual(attributes.Count, field.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, field.Attributes[i].Type);
                Assert.IsTrue(field.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            // validate the attributes are written correctly
            using var writer = new CodeWriter();
            writer.WriteField(field);
            var expectedString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "private readonly string _newName;\n";
            var result = writer.ToString(false);
            Assert.AreEqual(expectedString, result);
        }

        [Test]
        public void TestAttributes()
        {
            var attributes = new List<AttributeStatement>
            {
                 new(typeof(ObsoleteAttribute)),
                 new(typeof(ObsoleteAttribute), Snippet.Literal("This is obsolete")),
                 new(typeof(ExperimentalAttribute), Snippet.Literal("001"))
            };
            var field = new FieldProvider(
                FieldModifiers.Private,
                new CSharpType(typeof(int)),
                "_name",
                new TestTypeProvider(),
                attributes: attributes);

            Assert.IsNotNull(field.Attributes);
            Assert.AreEqual(attributes.Count, field.Attributes.Count);
            for (int i = 0; i < attributes.Count; i++)
            {
                Assert.AreEqual(attributes[i].Type, field.Attributes[i].Type);
                Assert.IsTrue(field.Attributes[i].Arguments.SequenceEqual(attributes[i].Arguments));
            }

            // validate the attributes are written correctly
            using var writer = new CodeWriter();
            writer.WriteField(field);
            var expectedString = "[global::System.ObsoleteAttribute]\n" +
                "[global::System.ObsoleteAttribute(\"This is obsolete\")]\n" +
                "[global::System.Diagnostics.CodeAnalysis.ExperimentalAttribute(\"001\")]\n" +
                "private int _name;\n";
            Assert.AreEqual(expectedString, writer.ToString(false));
        }

        [Test]
        public void ExperimentalFieldTypesHaveScopedSuppressions()
        {
            MockHelpers.LoadMockGenerator(includeXmlDocs: true);
#pragma warning disable FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var experimentalType = new CSharpType(typeof(Sample.ExperimentalFieldType));
            var genericType = new CSharpType(typeof(Sample.ExperimentalFieldGeneric<>), experimentalType);
            var nestedType = new CSharpType(typeof(Sample.ExperimentalFieldType.Nested));
#pragma warning restore FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var polyfilledType = new CSharpType(EmitPolyfilledExperimentalFieldType());
            var provider = new TestTypeProvider("FieldContainer", ns: "Sample");
            var explicitlySuppressed = new FieldProvider(FieldModifiers.Private, experimentalType, "_explicitlySuppressed", provider);
            explicitlySuppressed.Update(suppressions:
            [
                new SuppressionStatement(null, Snippet.Literal("FIELD001"), "Existing suppression.")
            ]);
            provider.Update(fields:
            [
                new FieldProvider(FieldModifiers.Private, experimentalType, "_value", provider,
                    $"The experimental value.", Snippet.New.Instance(experimentalType),
                    attributes: [new AttributeStatement(typeof(ObsoleteAttribute))]),
                new FieldProvider(FieldModifiers.Private, experimentalType.WithNullable(true), "_nullable", provider),
                new FieldProvider(FieldModifiers.Private, new CSharpType(typeof(List<>), experimentalType), "_list", provider),
                new FieldProvider(FieldModifiers.Private, new CSharpType(experimentalType.FrameworkType.MakeArrayType()), "_array", provider),
                new FieldProvider(FieldModifiers.Private, nestedType, "_nested", provider),
                new FieldProvider(FieldModifiers.Private, genericType, "_generic", provider),
                explicitlySuppressed,
                new FieldProvider(FieldModifiers.Private, experimentalType, "_experimentalMember", provider,
                    attributes: [new AttributeStatement(typeof(ExperimentalAttribute), Snippet.Literal("FIELD001"))]),
                new FieldProvider(FieldModifiers.Private, typeof(string), "_stable", provider),
                new FieldProvider(FieldModifiers.Private, polyfilledType, "_polyfilled", provider)
            ]);

            Assert.AreEqual(Helpers.GetExpectedFromFile(), new TypeProviderWriter(provider).Write().Content);
        }

        [Test]
        public void InlineDeclarationSuppressionsDoNotSuppressOtherReferences()
        {
#pragma warning disable FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var type = new CSharpType(typeof(Sample.ExperimentalFieldGeneric<>), typeof(Sample.ExperimentalFieldType));
#pragma warning restore FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var provider = new TestTypeProvider("Container");
            var field = new FieldProvider(FieldModifiers.Private, type, "_value", provider);
            var otherField = new FieldProvider(FieldModifiers.Private, type, "_other", provider);
            var declaration = Snippet.Declare(field.AsVariableExpression, Snippet.Default);
            MethodBodyStatement body = new SuppressionStatement(
                new SuppressionStatement(declaration, Snippet.Literal("FIELD001"), "First inline suppression."),
                Snippet.Literal("FIELD002"), "Second inline suppression.");

            Assert.AreEqual(0, ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(field.AsParameter, body).Length);
            Assert.AreEqual(2, ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(otherField.AsParameter, body).Length);
            Assert.AreEqual(2, ExperimentalApiHelpers.MergeSuppressions(
                ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(field.AsParameter, body),
                ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(otherField.AsParameter, body)).Length);
            Assert.AreEqual(2, ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(field.AsParameter, null).Length);
            Assert.AreEqual(2, ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(field.AsParameter, declaration).Length);
            Assert.AreEqual(2, ExperimentalApiHelpers.GetReferenceSuppressions(type).Length);
        }

        [TestCase("FIELD001", 1)]
        [TestCase("OTHER001", 2)]
        public void InlineDeclarationOnlyExcludesMatchingDiagnostic(string diagnosticId, int expectedCount)
        {
#pragma warning disable FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var type = new CSharpType(typeof(Sample.ExperimentalFieldGeneric<>), typeof(Sample.ExperimentalFieldType));
#pragma warning restore FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var property = new PropertyProvider(null, MethodSignatureModifiers.Public, type, "Value",
                new AutoPropertyBody(true), new TestTypeProvider("Container"));
            MethodBodyStatement body = new SuppressionStatement(
                Snippet.Declare(property.AsVariableExpression, Snippet.Default),
                Snippet.Literal(diagnosticId), "Inline suppression.");

            var suppressions = ExperimentalApiHelpers.GetUnscopedReferenceSuppressions(property.AsParameter, body);

            Assert.AreEqual(expectedCount, suppressions.Length);
            if (expectedCount == 1)
            {
                Assert.AreEqual(Snippet.Literal("FIELD002").ToDisplayString(), suppressions[0].Code.ToDisplayString());
            }
        }

        [Test]
        public void ExperimentalPropertyAndMethodTypesHaveScopedSuppressions()
        {
            MockHelpers.LoadMockGenerator();
#pragma warning disable FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var experimentalType = new CSharpType(typeof(Sample.ExperimentalFieldType));
#pragma warning restore FIELD001, FIELD002 // Type is for evaluation purposes only and is subject to change or removal in future updates.
            var provider = new TestTypeProvider("MemberContainer", ns: "Sample");

            var property = new PropertyProvider(
                description: null,
                modifiers: MethodSignatureModifiers.Private,
                type: experimentalType,
                name: "Value",
                body: new AutoPropertyBody(HasSetter: false),
                enclosingType: provider);
            using var propertyWriter = new CodeWriter();
            propertyWriter.WriteProperty(property);
            var propertyOutput = propertyWriter.ToString(false);
            StringAssert.Contains("#pragma warning disable FIELD001 // This generated code depends on experimental functionality.", propertyOutput);
            StringAssert.Contains("#pragma warning restore FIELD001 // This generated code depends on experimental functionality.", propertyOutput);

            var method = new MethodProvider(
                new MethodSignature("UseValue", null, MethodSignatureModifiers.Private, experimentalType, null,
                    [new ParameterProvider("value", $"", experimentalType)]),
                Snippet.Throw(Snippet.Null),
                provider);
            using var methodWriter = new CodeWriter();
            methodWriter.WriteMethod(method);
            var methodOutput = methodWriter.ToString(false);
            StringAssert.Contains("#pragma warning disable FIELD001 // This generated code depends on experimental functionality.", methodOutput);
            StringAssert.Contains("#pragma warning restore FIELD001 // This generated code depends on experimental functionality.", methodOutput);
        }

        private static Type EmitPolyfilledExperimentalFieldType()
        {
            var source = Helpers.GetExpectedFromFile("Input", nameof(ExperimentalFieldTypesHaveScopedSuppressions));
            var references = AppDomain.CurrentDomain.GetAssemblies()
                .Where(a => !a.IsDynamic && !string.IsNullOrEmpty(a.Location))
                .Select(a => MetadataReference.CreateFromFile(a.Location))
                .ToList();
            var compilation = CSharpCompilation.Create(
                "Polyfilled.ExperimentalFieldTypes",
                [CSharpSyntaxTree.ParseText(source)],
                references,
                new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Enable));

            using var ms = new MemoryStream();
            var emitResult = compilation.Emit(ms);
            Assert.IsTrue(
                emitResult.Success,
                "Failed to emit polyfilled experimental field assembly: " +
                string.Join(Environment.NewLine, emitResult.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error)));

            var assembly = Assembly.Load(ms.ToArray());
            return assembly.GetType("Polyfilled.External.PolyfilledExperimentalFieldType")!;
        }
    }
}
