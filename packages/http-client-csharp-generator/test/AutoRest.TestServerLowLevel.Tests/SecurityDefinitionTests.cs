// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Reflection;
using Azure;
using Azure.Core;
using NUnit.Framework;
using SecurityDefinition_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class SecurityDefinitionTests
    {
        [Test]
        public void SecurityDefinitionClient_ShouldHaveCredentials()
        {
            var constructors = typeof(SecurityDefinitionClient).GetConstructors(BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(4, constructors.Length);

            var firstConstructor = constructors[0];
            var tokenCred = TypeAsserts.HasParameter(firstConstructor, "credential");
            Assert.NotNull(tokenCred);
            Assert.AreEqual(typeof(AzureKeyCredential), tokenCred.ParameterType);

            var secondConstructor = constructors[1];
            var keyCred = TypeAsserts.HasParameter(secondConstructor, "credential");
            Assert.NotNull(keyCred);
            Assert.AreEqual(typeof(TokenCredential), keyCred.ParameterType);
        }
    }
}
