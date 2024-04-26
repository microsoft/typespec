// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Input.Tests
{
    internal class OperationKindsTests
    {
        [Test]
        public void TestCustomKind()
        {
            var customKind = new OperationKinds("CustomKind");
            Assert.IsTrue("CustomKind" == customKind);
        }

        [Test]
        public void TestEquals()
        {
            Assert.IsTrue("Default" == OperationKinds.Default);
            Assert.IsTrue("LongRunning" == OperationKinds.LongRunning);
            Assert.IsTrue("Paging" == OperationKinds.Paging);

            Assert.IsFalse(OperationKinds.Default == OperationKinds.LongRunning);
            Assert.IsFalse(OperationKinds.LongRunning == OperationKinds.Paging);
            Assert.IsFalse(OperationKinds.Paging == OperationKinds.Default);
        }

    }
}
