// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Writers
{
    public class CodeWriterTests
    {
        internal const string NewLine = "\n";

        public CodeWriterTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        [Test]
        public void CorrectlyHandlesCurlyBraces()
        {
            using var writer = new CodeWriter();
            writer.Append($"public {typeof(string)} Data {{ get; private set; }}");
            var expected = "public string Data { get; private set; }";

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [Test]
        public void FormatInFormat()
        {
            FormattableString fs1 = $"'1' is {typeof(int)}";
            FormattableString fs2 = $"'a' is {typeof(char)} and {fs1} and 'true' is {typeof(bool)}";

            using var writer = new CodeWriter();
            writer.Append(fs2);
            var expected = "'a' is char and '1' is int and 'true' is bool";

            Assert.AreEqual(expected, writer.ToString(false));
        }


        [Test]
        public void EnumerableFormatInFormat()
        {
            using var writer = new CodeWriter();
            writer.Append($"Multiply:{Enumerable.Range(1, 4).Select(i => (FormattableString)$" {i} * 2 = {i * 2};")}");
            var expected = "Multiply: 1 * 2 = 2; 2 * 2 = 4; 3 * 2 = 6; 4 * 2 = 8;";

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [Test]
        public void SingleLineSummary()
        {
            using var writer = new CodeWriter();
            var summary = new XmlDocSummaryStatement([$"Some {typeof(string)} summary."]);
            summary.Write(writer);
            var expected = "/// <summary> Some string summary. </summary>" + NewLine;

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [Test]
        public void NoEmptySummary()
        {
            using var writer = new CodeWriter();
            var summary = new XmlDocSummaryStatement([$"{string.Empty}"]);
            summary.Write(writer);
            var expected = "/// <summary></summary>" + NewLine;

            Assert.AreEqual(expected, writer.ToString(false));
        }

        [TestCase(typeof(string), false)]
        [TestCase(typeof(int), false)]
        [TestCase(typeof(int), true)] //bug should be <see cref="int?"/> vs <see cref="int"/>?
        [TestCase(typeof(List<>), false)]
        [TestCase(typeof(KeyValuePair<,>), false)]
        [TestCase(typeof(KeyValuePair<int, string>), true)]
        public void SeeCRefType(Type type, bool isNullable)
        {
            using var writer = new CodeWriter();
            var csType = new CSharpType(type).WithNullable(isNullable);
            var summary = new XmlDocSummaryStatement([$"Some {csType:C} summary."]);
            summary.Write(writer);
            var expected = Helpers.GetExpectedFromFile($"{type.Name}, {isNullable}");

            Assert.AreEqual(expected, writer.ToString());
        }

        [Test]
        public void MultiLineSummary()
        {
            List<FormattableString> fs1 = new List<FormattableString>
            {
                $"L04",
                $"L05",
                $"L06 {typeof(int)}",
                $"",
                $"",
                $"L09"
            };

            List<FormattableString> fs2 = new List<FormattableString>
            {
                $"",
                $"L11 {typeof(bool)}",
                $"L12",
                $"",
                $""
            };

            List<FormattableString> fss = new List<FormattableString>();
            fss.AddRange(fs1);
            fss.AddRange(fs2);

            List<FormattableString> fs = new List<FormattableString>()
            {
                $"L00",
                $"L01",
                $"L02 {typeof(string)}",
                $""
            };
            fs.AddRange(fss);
            fs.Add($"L15");
            fs.Add($"L16");

            using var writer = new CodeWriter();
            var summary = new XmlDocSummaryStatement(fs);
            summary.Write(writer);

            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(expected, writer.ToString(false));
        }

        // Validate that the WriteMethodDeclarationNoScope method correctly writes a custom constructor signature method
        [Test]
        public void TestWriteMethodDeclarationNoScope_ConstructorSignature()
        {
            var baseInitializerStatement = new ConstructorInitializer(true, new List<ValueExpression> { Literal("test") });
            var constructorSignature = new ConstructorSignature(new CSharpType(typeof(string)), $"Test description",
                MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>(), null, baseInitializerStatement);
            using var codeWriter = new CodeWriter();
            codeWriter.WriteMethodDeclarationNoScope(constructorSignature);

            var result = codeWriter.ToString(false);
            Assert.AreEqual("public String() : base(\"test\")", result);
        }

        [Test]
        public void CodeWriter_WriteField()
        {
            var field1 = new FieldProvider(FieldModifiers.Private, typeof(int), "_intConst", new TestTypeProvider(), $"To test int");
            var field2 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly, typeof(string), "_stringValue", new TestTypeProvider(), $"To test string");
            var field3 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static | FieldModifiers.ReadOnly, typeof(string), "withValue", new TestTypeProvider(), $"To test a field with initialization value", Literal("abc"));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteField(field1);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteField(field2);
            codeWriter.WriteField(field3);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString();

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_AutoBody()
        {
            var property1 = new PropertyProvider($"To test an auto property without a setter", MethodSignatureModifiers.Public, typeof(string), "Property1", new AutoPropertyBody(false), new TestTypeProvider());
            var property2 = new PropertyProvider($"To test an auto property with a setter", MethodSignatureModifiers.Public, typeof(string), "Property2", new AutoPropertyBody(true, MethodSignatureModifiers.None), new TestTypeProvider());
            var property3 = new PropertyProvider($"To test an auto property with an internal setter", MethodSignatureModifiers.Public, typeof(string), "Property3", new AutoPropertyBody(true, MethodSignatureModifiers.Internal), new TestTypeProvider());
            var property4 = new PropertyProvider($"To test an auto property with an internal setter and initialization value", MethodSignatureModifiers.Public, typeof(string), "Property4", new AutoPropertyBody(true, MethodSignatureModifiers.Internal, Literal("abc")), new TestTypeProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(property1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(property2, true);
            codeWriter.WriteProperty(property3, true);
            codeWriter.WriteProperty(property4, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_AutoBody_WithExplicitInterface()
        {
            var property1 = new PropertyProvider($"To test an auto property without a setter", MethodSignatureModifiers.Public, typeof(int), nameof(IList<string>.Count), new AutoPropertyBody(false), new TestTypeProvider(), explicitInterface: typeof(IList<string>));
            var property2 = new PropertyProvider($"To test an auto property with a setter", MethodSignatureModifiers.Public, typeof(bool), nameof(IList<string>.IsReadOnly), new AutoPropertyBody(true, MethodSignatureModifiers.None), new TestTypeProvider(), explicitInterface: typeof(IList<string>));
            var property3 = new PropertyProvider($"To test an auto property with an internal setter", MethodSignatureModifiers.Public, typeof(int), nameof(IReadOnlyList<string>.Count), new AutoPropertyBody(true, MethodSignatureModifiers.Internal), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyList<string>));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(property1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(property2, true);
            codeWriter.WriteProperty(property3, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_ExpressionBody()
        {
            var property1 = new PropertyProvider($"To test an expression property with string type", MethodSignatureModifiers.Public, typeof(string), "Property1", new ExpressionPropertyBody(Literal("abc")), new TestTypeProvider());
            var property2 = new PropertyProvider($"To test an expression property with int type", MethodSignatureModifiers.Public, typeof(int), "Property2", new ExpressionPropertyBody(Literal(299792458)), new TestTypeProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(property1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(property2, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_ExpressionBody_WithExplicitInterface()
        {
            var property1 = new PropertyProvider($"To test an expression property with int type", MethodSignatureModifiers.Public, typeof(int), nameof(IList<string>.Count), new ExpressionPropertyBody(Literal(299792458)), new TestTypeProvider(), explicitInterface: typeof(IList<string>));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(property1, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_MethodPropertyBody()
        {
            var property1 = new PropertyProvider($"To test an auto property without a setter", MethodSignatureModifiers.Public, typeof(string), "Property1", new MethodPropertyBody(Return(Literal("abc"))), new TestTypeProvider());
            var property2 = new PropertyProvider($"To test an auto property with a setter", MethodSignatureModifiers.Public, typeof(string), "Property2", new MethodPropertyBody(Return(Literal("abc")), This.Property("Property2").Assign(Value).Terminate()), new TestTypeProvider());
            var property3 = new PropertyProvider($"To test an auto property with an internal setter", MethodSignatureModifiers.Public, typeof(string), "Property3", new MethodPropertyBody(Return(Literal("abc")), This.Property("Property3").Assign(Value).Terminate(), MethodSignatureModifiers.Internal), new TestTypeProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(property1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(property2, true);
            codeWriter.WriteProperty(property3, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_MethodPropertyBody_WithExplicitInterface()
        {
            var property1 = new PropertyProvider($"To test an auto property without a setter", MethodSignatureModifiers.Public, typeof(int), nameof(IList<string>.Count), new MethodPropertyBody(Return(Literal(299792458))), new TestTypeProvider(), explicitInterface: typeof(IList<string>));
            var property2 = new PropertyProvider($"To test an auto property with a setter", MethodSignatureModifiers.Public, typeof(bool), nameof(IList<string>.IsReadOnly), new MethodPropertyBody(Return(True), This.Property($"{nameof(IList<string>.IsReadOnly)}").Assign(Value).Terminate()), new TestTypeProvider(), explicitInterface: typeof(IList<string>));
            var property3 = new PropertyProvider($"To test an auto property with an internal setter", MethodSignatureModifiers.Public, typeof(int), nameof(IReadOnlyList<string>.Count), new MethodPropertyBody(Return(Literal(299792458)), This.Property($"{nameof(IReadOnlyList<string>.Count)}").Assign(Value).Terminate(), MethodSignatureModifiers.Internal), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyList<string>));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(property1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(property2, true);
            codeWriter.WriteProperty(property3, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_IndexerProperty_AutoBody()
        {
            var p1 = new ParameterProvider("p1", $"p1", typeof(int), null);
            var indexer1 = new IndexPropertyProvider($"To test an auto property without a setter", MethodSignatureModifiers.Public, typeof(float), p1, new AutoPropertyBody(false), new TestTypeProvider());
            var p2 = new ParameterProvider("p2", $"p2", typeof(string), null);
            var indexer2 = new IndexPropertyProvider($"To test an auto property with a setter", MethodSignatureModifiers.Public, typeof(bool), p2, new AutoPropertyBody(true, MethodSignatureModifiers.None), new TestTypeProvider());
            var p3 = new ParameterProvider("p3", $"p3", typeof(float), null);
            var indexer3 = new IndexPropertyProvider($"To test an auto property with an internal setter", MethodSignatureModifiers.Public, typeof(double), p3, new AutoPropertyBody(true, MethodSignatureModifiers.Internal), new TestTypeProvider());
            var p4 = new ParameterProvider("p4", $"p4", typeof(double), null);
            var indexer4 = new IndexPropertyProvider($"To test an auto property with an internal setter and initialization value", MethodSignatureModifiers.Public, typeof(string), p4, new AutoPropertyBody(true, MethodSignatureModifiers.Internal, Literal("abc")), new TestTypeProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(indexer1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(indexer2, true);
            codeWriter.WriteProperty(indexer3, true);
            codeWriter.WriteProperty(indexer4, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_IndexerProperty_AutoBody_WithExplicitInterface()
        {
            var index = new ParameterProvider("index", $"index", typeof(int), null);
            var indexer1 = new IndexPropertyProvider($"To test an auto property without a setter", MethodSignatureModifiers.Public, typeof(string), index, new AutoPropertyBody(false), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyList<string>));
            var indexer2 = new IndexPropertyProvider($"To test an auto property with a setter", MethodSignatureModifiers.Public, typeof(bool), index, new AutoPropertyBody(true, MethodSignatureModifiers.None), new TestTypeProvider(), explicitInterface: typeof(IList<bool>));
            var indexer3 = new IndexPropertyProvider($"To test an auto property with an internal setter", MethodSignatureModifiers.Public, typeof(double), index, new AutoPropertyBody(true, MethodSignatureModifiers.Internal), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyList<double>));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(indexer1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(indexer2, true);
            codeWriter.WriteProperty(indexer3, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_IndexerProperty_ExpressionBody()
        {
            var p1 = new ParameterProvider("p1", $"p1", typeof(int), null);
            var indexer1 = new IndexPropertyProvider($"To test an expression property with string type", MethodSignatureModifiers.Public, typeof(string), p1, new ExpressionPropertyBody(Literal("abc")), new TestTypeProvider());
            var p2 = new ParameterProvider("p2", $"p2", typeof(string), null);
            var indexer2 = new IndexPropertyProvider($"To test an expression property with int type", MethodSignatureModifiers.Public, typeof(int), p2, new ExpressionPropertyBody(Literal(299792458)), new TestTypeProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(indexer1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(indexer2, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_IndexerProperty_ExpressionBody_WithExplicitInterface()
        {
            var p1 = new ParameterProvider("index", $"index", typeof(int), null);
            var indexer1 = new IndexPropertyProvider($"To test an expression property with string type", MethodSignatureModifiers.Public, typeof(string), p1, new ExpressionPropertyBody(Literal("abc")), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyList<string>));
            var p2 = new ParameterProvider("key", $"key", typeof(string), null);
            var indexer2 = new IndexPropertyProvider($"To test an expression property with int type", MethodSignatureModifiers.Public, typeof(int), p2, new ExpressionPropertyBody(Literal(299792458)), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyDictionary<string, int>));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(indexer1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(indexer2, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_IndexerProperty_MethodPropertyBody()
        {
            var p1 = new ParameterProvider("p1", $"p1", typeof(int), null);
            var indexer1 = new IndexPropertyProvider($"To test a method property without a setter", MethodSignatureModifiers.Public, typeof(string), p1, new MethodPropertyBody(Return(Literal("abc"))), new TestTypeProvider());
            var p2 = new ParameterProvider("p2", $"p2", typeof(int), null);
            var indexer2 = new IndexPropertyProvider($"To test a method property with a setter", MethodSignatureModifiers.Public, typeof(string), p2, new MethodPropertyBody(Return(Literal("abc")), This.Property($"Property2").Assign(Value).Terminate()), new TestTypeProvider());
            var p3 = new ParameterProvider("p3", $"p3", typeof(int), null);
            var indexer3 = new IndexPropertyProvider($"To test a method property with an internal setter", MethodSignatureModifiers.Public, typeof(string), p3, new MethodPropertyBody(Return(Literal("abc")), This.Property($"Property3").Assign(Value).Terminate(), MethodSignatureModifiers.Internal), new TestTypeProvider());

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(indexer1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(indexer2, true);
            codeWriter.WriteProperty(indexer3, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void CodeWriter_WriteProperty_IndexerProperty_MethodPropertyBody_WithExplicitInterface()
        {
            var index = new ParameterProvider("index", $"index", typeof(int), null);
            var indexer1 = new IndexPropertyProvider($"To test a method property without a setter", MethodSignatureModifiers.Public, typeof(string), index, new MethodPropertyBody(Return(Literal("abc"))), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyList<string>));
            var indexer2 = new IndexPropertyProvider($"To test a method property with a setter", MethodSignatureModifiers.Public, typeof(string), index, new MethodPropertyBody(Return(Literal("abc")), This.Property($"Property2").Assign(Value).Terminate()),new TestTypeProvider(), explicitInterface: typeof(IList<string>));
            var indexer3 = new IndexPropertyProvider($"To test a method property with an internal setter", MethodSignatureModifiers.Public, typeof(string), index, new MethodPropertyBody(Return(Literal("abc")), This.Property($"Property3").Assign(Value).Terminate(), MethodSignatureModifiers.Internal), new TestTypeProvider(), explicitInterface: typeof(IReadOnlyDictionary<int, string>));

            using var codeWriter = new CodeWriter();
            codeWriter.WriteProperty(indexer1, true);
            codeWriter.WriteLine($"// test comment");
            codeWriter.WriteProperty(indexer2, true);
            codeWriter.WriteProperty(indexer3, true);

            var expected = Helpers.GetExpectedFromFile();

            var result = codeWriter.ToString(false);

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void TestWriteArguments()
        {
            var arg1 = Literal("arg1");
            var arg2 = Literal("arg2");
            var arg3 = Literal("arg3");

            using var codeWriter = new CodeWriter();
            codeWriter.WriteArguments(new List<ValueExpression> { arg1, arg2, arg3 }, false);

            var expected = new StringBuilder()
                .Append("(")
                .Append(NewLine)
                .Append("    \"arg1\",")
                .Append(NewLine)
                .Append("    \"arg2\",")
                .Append(NewLine)
                .Append("    \"arg3\")")
                .ToString();
            var result = codeWriter.ToString(false);
            Assert.AreEqual(expected, result);
        }

        [TestCase(TypeSignatureModifiers.Private | TypeSignatureModifiers.Class)]
        [TestCase(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class)]
        [TestCase(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static | TypeSignatureModifiers.Class)]
        [TestCase(TypeSignatureModifiers.Public | TypeSignatureModifiers.Abstract | TypeSignatureModifiers.Class)]
        [TestCase(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Abstract | TypeSignatureModifiers.Class)]
        public void TypeModifiersTest(TypeSignatureModifiers modifiers)
        {
            using var codeWriter = new CodeWriter();
            codeWriter.WriteTypeModifiers(modifiers);
            var result = codeWriter.ToString(false);

            foreach (var bit in Enum.GetValues<TypeSignatureModifiers>())
            {
                if (bit == TypeSignatureModifiers.None)
                    continue;

                var expected = bit.ToString().ToLower();
                if (modifiers.HasFlag(bit))
                {
                    Assert.IsTrue(result.Contains(expected), $"Expected bit `{expected}` to be present");
                }
                else
                {
                    Assert.IsFalse(result.Contains(expected), $"Expected bit `{expected}` to be absent");

                }
            }
        }
    }
}
