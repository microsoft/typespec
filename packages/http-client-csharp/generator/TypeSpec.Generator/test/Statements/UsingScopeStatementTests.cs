// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Statements;
using NUnit.Framework;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.Tests.Statements
{
    internal class UsingScopeStatementTests
    {
        [Test]
        public void SiblingScopeLinesUseSameName()
        {
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            using CodeWriter writer = new CodeWriter();
            var using1 = new UsingScopeStatement(typeof(StreamReader), cwd1, New.Instance(typeof(StreamReader), [Literal("path")]));
            var using2 = new UsingScopeStatement(typeof(StreamReader), cwd2, New.Instance(typeof(StreamReader), [Literal("path")]));
            using1.Write(writer);
            using2.Write(writer);
            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(expected, writer.ToString(false));
        }

    }
}
