// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System.Threading.Tasks;
using Resiliency.SrvDriven.V2;

namespace TestProjects.CadlRanch.Tests.Http.Resiliency.SrvDriven.V2
{
    public partial class SrvDrivenV2Tests : CadlRanchTestBase
    {
        private const string ServiceDeploymentV2 = "v2";

        [CadlRanchTest]
        public Task AddOperation() => Test(async (host) =>
        {
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2);
            var response = await client.AddOperationAsync();

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        // This test validates the "new" client behavior when the api version is set to V1.
        [CadlRanchTest]
        public Task AddOptionalParamFromNone_WithApiVersionV1() => Test(async (host) =>
        {
            var options = new ResiliencyServiceDrivenClientOptions(ResiliencyServiceDrivenClientOptions.ServiceVersion.V1);
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2, options);
            var response = await client.FromNoneAsync();

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        // This test validates the "new" client behavior when the api version is set to V2.
        [CadlRanchTest]
        public Task AddOptionalParamFromNone_WithApiVersionV2() => Test(async (host) =>
        {
            var options = new ResiliencyServiceDrivenClientOptions(ResiliencyServiceDrivenClientOptions.ServiceVersion.V2);
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2, options);
            var response = await client.FromNoneAsync("new", cancellationToken: default);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AddOptionalParamFromOneOptional_WithApiVersionV1() => Test(async (host) =>
        {
            var options = new ResiliencyServiceDrivenClientOptions(ResiliencyServiceDrivenClientOptions.ServiceVersion.V1);
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2, options);
            var response = await client.FromOneOptionalAsync("optional");

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AddOptionalParamFromOneOptional_WithApiVersionV2() => Test(async (host) =>
        {
            var options = new ResiliencyServiceDrivenClientOptions(ResiliencyServiceDrivenClientOptions.ServiceVersion.V2);
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2, options);
            var response = await client.FromOneOptionalAsync("optional", "new", cancellationToken: default);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AddOptionalParamFromOneRequired_WithApiVersionV1() => Test(async (host) =>
        {
            var options = new ResiliencyServiceDrivenClientOptions(ResiliencyServiceDrivenClientOptions.ServiceVersion.V1);
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2, options);
            var response = await client.FromOneRequiredAsync("required");

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AddOptionalParamFromOneRequired_WithApiVersionV2() => Test(async (host) =>
        {
            var options = new ResiliencyServiceDrivenClientOptions(ResiliencyServiceDrivenClientOptions.ServiceVersion.V2);
            var client = new ResiliencyServiceDrivenClient(host, ServiceDeploymentV2, options);
            var response = await client.FromOneRequiredAsync("required", "new", cancellationToken: default);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
