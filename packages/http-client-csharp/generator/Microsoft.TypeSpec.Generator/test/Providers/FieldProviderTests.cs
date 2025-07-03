// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;
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
            field.WireInfo = new PropertyWireInformation(SerializationFormat.Default, true, true, true, false, "newName");
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
    }
}
