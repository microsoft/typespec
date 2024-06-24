// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Writers
{
    internal class CodeScopeTests
    {
        [Test]
        public void GeneratesNewNamesInChildScope()
        {
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            using CodeWriter writer = new CodeWriter();
            writer.WriteLine($"{cwd1:D}");
            using (writer.Scope())
            {
                writer.WriteLine($"{cwd2:D}");
            }

            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(expected, writer.ToString(false));
        }

        [Test]
        public void ScopeLineIsInsideScope()
        {
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            using CodeWriter writer = new CodeWriter();
            using (writer.Scope($"{cwd1:D}"))
            {
            }

            using (writer.Scope($"{cwd2:D}"))
            {
            }

            //TODO strange behavior for scope that we might want to fix.
            // if you want the "a" and "{" lines to be the same indent level as "}"
            // you must write A then use an empty `Scope()` method call.
            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(expected, writer.ToString(false));
        }

        [Test]
        public void VariableNameNotReusedWhenUsedInChildScope()
        {
            var cwd1 = new CodeWriterDeclaration("a");
            var cwd2 = new CodeWriterDeclaration("a");
            using CodeWriter writer = new CodeWriter();
            using (writer.Scope())
            {
                writer.WriteLine($"{cwd1:D}");
            }

            writer.WriteLine($"{cwd2:D}");

            Assert.AreEqual(Helpers.GetExpectedFromFile(), writer.ToString(false));
        }
    }
}
