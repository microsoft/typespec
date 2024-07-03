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
            var customKind = new InputOperationKinds("CustomKind");
            Assert.IsTrue("CustomKind" == customKind);
        }

        [Test]
        public void TestEquals()
        {
            Assert.IsTrue("Default" == InputOperationKinds.Default);
            Assert.IsTrue("LongRunning" == InputOperationKinds.LongRunning);
            Assert.IsTrue("Paging" == InputOperationKinds.Paging);

            Assert.IsFalse(InputOperationKinds.Default == InputOperationKinds.LongRunning);
            Assert.IsFalse(InputOperationKinds.LongRunning == InputOperationKinds.Paging);
            Assert.IsFalse(InputOperationKinds.Paging == InputOperationKinds.Default);
        }

    }
}
