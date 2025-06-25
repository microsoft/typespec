﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Abstractions
{
    public class RequestContentApiTests
    {
        [Test]
        public void BinaryContentHelperMethodsUseCorrectReturnType()
        {
            MockHelpers.LoadMockGenerator(requestContentApi: TestRequestContentApi.Instance);
            var binaryContentHelper = new BinaryContentHelperDefinition();

            foreach (var method in binaryContentHelper.Methods)
            {
                Assert.IsNotNull(method);
                Assert.IsNotNull(method.Signature.ReturnType);
                Assert.IsTrue(method.Signature.ReturnType!.Equals(typeof(string)));
            }
        }
    }
}
