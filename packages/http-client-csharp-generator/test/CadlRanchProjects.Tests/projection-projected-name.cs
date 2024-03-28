// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using Projection.ProjectedName;
using Projection.ProjectedName.Models;

namespace CadlRanchProjects.Tests
{
    public class ProjectionProjectedNameTests : CadlRanchTestBase
    {
        [Test]
        public Task Projection_ProjectedName_Property_json() => Test(async (host) =>
        {
            JsonProjectedNameModel project = new JsonProjectedNameModel(true);
            Response response = await new ProjectedNameClient(host, null).GetPropertyClient().JsonAsync(project);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Projection_ProjectedName_Property_client() => Test(async (host) =>
        {
            ClientProjectedNameModel project = new ClientProjectedNameModel(true);
            Response response = await new ProjectedNameClient(host, null).GetPropertyClient().ClientAsync(project);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Projection_ProjectedName_Property_language() => Test(async (host) =>
        {
            LanguageProjectedNameModel project = new LanguageProjectedNameModel(true);
            Response response = await new ProjectedNameClient(host, null).GetPropertyClient().LanguageAsync(project);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Projection_ProjectedName_Property_jsonAndClient() => Test(async (host) =>
        {
            JsonAndClientProjectedNameModel project = new JsonAndClientProjectedNameModel(true);
            Response response = await new ProjectedNameClient(host, null).GetPropertyClient().JsonAndClientAsync(project);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Projection_ProjectedName_operation() => Test(async (host) =>
        {
            Response response = await new ProjectedNameClient(host, null).ClientNameAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Projection_ProjectedName_parameter() => Test(async (host) =>
        {
            Response response = await new ProjectedNameClient(host, null).ParameterAsync("true");
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Projection_ProjectedName_Model_client() => Test(async (host) =>
        {
            Response response = await new ProjectedNameClient(host, null).GetModelClient().ClientAsync(new ClientModel(true));
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Projection_ProjectedName_Model_language() => Test(async (host) =>
        {
            Response response = await new ProjectedNameClient(host, null).GetModelClient().LanguageAsync(new CSModel(true));
            Assert.AreEqual(204, response.Status);
        });
    }
}
