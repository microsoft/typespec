// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using Azure.Core.Pipeline;
using MgmtExtensionCommonRestOperation;
using MgmtExtensionCommonRestOperation.Mocking;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.TestProjects
{
    internal class MgmtExtensionCommonRestOperationTests : TestProjectTests
    {
        public MgmtExtensionCommonRestOperationTests()
            : base("MgmtExtensionCommonRestOperation")
        {
        }

        [Test]
        public void ValidateSingleField()
        {
            ValidateFields(typeof(TypeOneResource), "typetwo");
            ValidateFields(typeof(TypeOneCollection), "typetwo");
            ValidateFields(typeof(TypeTwoResource), "typeone");
            ValidateFields(typeof(TypeTwoCollection), "typeone");
        }

        private static void ValidateFields(Type type, string name)
        {
            var fields = type.GetFields(BindingFlags.Instance | BindingFlags.NonPublic);
            foreach (var field in fields)
            {
                Assert.IsFalse(field.Name.Contains(name, StringComparison.OrdinalIgnoreCase));
            }
        }

        [Test]
        public void ValidateBothFieldsInExtension()
        {
            var extensionClient = typeof(MockableMgmtExtensionCommonRestOperationSubscriptionResource);
            var fields = extensionClient.GetFields(BindingFlags.Instance | BindingFlags.NonPublic);
            var field = fields.FirstOrDefault(f => f.Name.Contains("_typeOneCommonRestClient", StringComparison.OrdinalIgnoreCase));
            Assert.NotNull(field);
            Assert.AreEqual(field.FieldType, typeof(CommonRestOperations));
            field = fields.FirstOrDefault(f => f.Name.Contains("_typeTwoCommonRestClient", StringComparison.OrdinalIgnoreCase));
            Assert.NotNull(field);
            Assert.AreEqual(field.FieldType, typeof(CommonRestOperations));
            field = fields.FirstOrDefault(f => f.Name.Contains("_typeOneCommonClientDiagnostics", StringComparison.OrdinalIgnoreCase));
            Assert.NotNull(field);
            Assert.AreEqual(field.FieldType, typeof(ClientDiagnostics));
            field = fields.FirstOrDefault(f => f.Name.Contains("_typeTwoCommonClientDiagnostics", StringComparison.OrdinalIgnoreCase));
            Assert.NotNull(field);
            Assert.AreEqual(field.FieldType, typeof(ClientDiagnostics));
        }
    }
}
