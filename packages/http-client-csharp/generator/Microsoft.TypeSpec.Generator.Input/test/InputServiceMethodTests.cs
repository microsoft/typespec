// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputServiceMethodTests
    {
        [Test]
        public void CanUpdateServiceMethodName()
        {
            var operation = InputFactory.Operation("TestOperation", "TestService");
            var serviceMethod = InputFactory.BasicServiceMethod("TestMethod", operation);
            serviceMethod.Update("UpdatedMethod");
            serviceMethod.Operation.Update("UpdatedOperation");

            Assert.AreEqual("UpdatedMethod", serviceMethod.Name);
            Assert.AreEqual("UpdatedOperation", serviceMethod.Operation.Name);
        }

    }
}
