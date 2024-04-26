// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    internal class CSharpMethodKindsTests
    {
        [Test]
        public void TestCustomKind()
        {
            var customKind = new CSharpMethodKinds("CustomKind");
            Assert.IsTrue("CustomKind" == customKind);
        }

        [Test]
        public void TestEquals()
        {
            Assert.IsTrue(CSharpMethodKinds.Convenience == "convenience");
            Assert.IsTrue(CSharpMethodKinds.Protocol == "protocol");
            Assert.IsTrue(CSharpMethodKinds.CreateMessage == "createMessage");

            Assert.IsFalse(CSharpMethodKinds.Convenience == CSharpMethodKinds.Protocol);
            Assert.IsFalse(CSharpMethodKinds.Protocol == CSharpMethodKinds.CreateMessage);
            Assert.IsFalse(CSharpMethodKinds.CreateMessage == CSharpMethodKinds.Convenience);
        }
    }
}
