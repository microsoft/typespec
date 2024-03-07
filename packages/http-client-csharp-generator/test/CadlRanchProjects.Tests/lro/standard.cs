// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using NUnit.Framework;
using _Azure.Lro.Standard;
using _Azure.Lro.Standard.Models;
using System.Net;

namespace CadlRanchProjects.Tests
{
    public class LroStandardTests : CadlRanchTestBase
    {
        [Test]
        public Task CreateOrReplace() => Test(async (host) =>
        {
            var operation = await new StandardClient(host, null).CreateOrReplaceAsync(WaitUntil.Completed, "madge", new User("contributor"));
            var user = operation.Value;

            Assert.AreEqual("madge", user.Name);
            Assert.AreEqual("contributor", user.Role);
        });

        [Test]
        public Task Delete() => Test(async (host) =>
        {
            var operation = await new StandardClient(host, null).DeleteAsync(WaitUntil.Completed, "madge");

            Assert.IsTrue(operation.HasCompleted);
            Assert.AreEqual(((int)HttpStatusCode.OK), operation.GetRawResponse().Status);
        });

        [Test]
        public Task Action() => Test(async (host) =>
        {
            var operation = await new StandardClient(host, null).ExportAsync(WaitUntil.Completed, "madge", "json");
            Assert.IsTrue(operation.HasCompleted);

            var exportedUser = operation.Value;
            Assert.AreEqual("madge", exportedUser.Name);
            Assert.AreEqual("/users/madge", exportedUser.ResourceUri);
        });
    }
}
