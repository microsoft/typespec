// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using azure_special_properties;
using azure_special_properties.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class AzureSpecialPropertiesTest : TestServerTestBase
    {
        [Test]
        public Task AzureApiVersionMethodGlobalNotProvidedValid() => TestStatus(async (host, pipeline) => await new ApiVersionDefaultClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodGlobalNotProvidedValidAsync());

        [Test]
        public Task AzureApiVersionMethodGlobalValid() => TestStatus(async (host, pipeline) => await new ApiVersionDefaultClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodGlobalValidAsync());

        [Test]
        public Task AzureApiVersionMethodLocalNull() => TestStatus(async (host, pipeline) => await new ApiVersionLocalClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodLocalNullAsync());

        // Issue with test logic: https://github.com/Azure/autorest.testserver/issues/167
        [Test]
        public Task AzureApiVersionMethodLocalValid() => TestStatus(async (host, pipeline) => await new ApiVersionLocalClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodLocalValidAsync());

        [Test]
        public Task AzureApiVersionPathGlobalValid() => TestStatus(async (host, pipeline) => await new ApiVersionDefaultClient(ClientDiagnostics, pipeline, host).RestClient.GetPathGlobalValidAsync());

        // Issue with test logic: https://github.com/Azure/autorest.testserver/issues/167
        [Test]
        public Task AzureApiVersionPathLocalValid() => TestStatus(async (host, pipeline) => await new ApiVersionLocalClient(ClientDiagnostics, pipeline, host).RestClient.GetPathLocalValidAsync());

        [Test]
        public Task AzureApiVersionSwaggerGlobalValid() => TestStatus(async (host, pipeline) => await new ApiVersionDefaultClient(ClientDiagnostics, pipeline, host).RestClient.GetSwaggerGlobalValidAsync());

        // Issue with test logic: https://github.com/Azure/autorest.testserver/issues/167
        [Test]
        public Task AzureApiVersionSwaggerLocalValid() => TestStatus(async (host, pipeline) => await new ApiVersionLocalClient(ClientDiagnostics, pipeline, host).RestClient.GetSwaggerLocalValidAsync());

        [Test]
        public Task AzureMethodPathUrlEncoding() => TestStatus(async (host, pipeline) =>
        {
            var value = "path1/path2/path3";
            return await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodPathValidAsync(value);
        });

        [Test]
        public Task AzureMethodQueryUrlEncoding() => TestStatus(async (host, pipeline) =>
        {
            var value = "value1&q2=value2&q3=value3";
            return await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodQueryValidAsync(value);
        });

        [Test]
        public Task AzureMethodQueryUrlEncodingNull() => TestStatus(async (host, pipeline) => await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetMethodQueryNullAsync());

        [Test]
        public Task AzureODataFilter() => TestStatus(async (host, pipeline) =>
        {
            var filter = "id gt 5 and name eq 'foo'";
            var top = 10;
            var orderBy = "id";
            return await new OdataClient(ClientDiagnostics, pipeline, host).RestClient.GetWithFilterAsync(filter, top, orderBy);
        });

        [Test]
        public Task AzurePathPathUrlEncoding() => TestStatus(async (host, pipeline) =>
        {
            var value = "path1/path2/path3";
            return await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetPathValidAsync(value);
        });

        [Test]
        public Task AzurePathQueryUrlEncoding() => TestStatus(async (host, pipeline) =>
        {
            var value = "value1&q2=value2&q3=value3";
            return await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetPathQueryValidAsync(value);
        });

        [Test]
        public Task AzureRequestClientIdInError() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new XMsClientRequestIdClient(ClientDiagnostics, pipeline, host).RestClient.GetAsync());
        });

        [Test]
        public Task AzureSubscriptionMethodGlobalNotProvidedValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInCredentialsClient(ClientDiagnostics, pipeline, value, host).RestClient.PostMethodGlobalNotProvidedValidAsync();
        });

        [Test]
        public Task AzureSubscriptionMethodGlobalValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInCredentialsClient(ClientDiagnostics, pipeline, value, host).RestClient.PostMethodGlobalValidAsync();
        });

        [Test]
        public Task AzureSubscriptionMethodLocalValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInMethodClient(ClientDiagnostics, pipeline, host).RestClient.PostMethodLocalValidAsync(value);
        });

        [Test]
        public Task AzureSubscriptionPathGlobalValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInCredentialsClient(ClientDiagnostics, pipeline, value, host).RestClient.PostPathGlobalValidAsync();
        });

        [Test]
        public Task AzureSubscriptionPathLocalValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInMethodClient(ClientDiagnostics, pipeline, host).RestClient.PostPathLocalValidAsync(value);
        });

        [Test]
        public Task AzureSubscriptionSwaggerGlobalValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInCredentialsClient(ClientDiagnostics, pipeline, value, host).RestClient.PostSwaggerGlobalValidAsync();
        });

        [Test]
        public Task AzureSubscriptionSwaggerLocalValid() => TestStatus(async (host, pipeline) =>
        {
            var value = "1234-5678-9012-3456";
            return await new SubscriptionInMethodClient(ClientDiagnostics, pipeline, host).RestClient.PostSwaggerLocalValidAsync(value);
        });

        [Test]
        public Task AzureSwaggerPathUrlEncoding() => TestStatus(async (host, pipeline) => await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetSwaggerPathValidAsync());

        [Test]
        public Task AzureSwaggerQueryUrlEncoding() => TestStatus(async (host, pipeline) => await new SkipUrlEncodingClient(ClientDiagnostics, pipeline, host).RestClient.GetSwaggerQueryValidAsync());

        [Test]
        public Task AzureXmsCustomNamedRequestId() => TestStatus(async (host, pipeline) =>
        {
            var value = "9C4D50EE-2D56-4CD3-8152-34347DC9F2B0";
            var result = await new HeaderClient(ClientDiagnostics, pipeline, host).RestClient.CustomNamedRequestIdAsync(value);
            return result.GetRawResponse();
        });

        [Test]
        public Task AzureXmsCustomNamedRequestIdParameterGroup() => TestStatus(async (host, pipeline) =>
        {
            var value = new HeaderCustomNamedRequestIdParamGroupingParameters("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var result = await new HeaderClient(ClientDiagnostics, pipeline, host).RestClient.CustomNamedRequestIdParamGroupingAsync(value);
            return result.GetRawResponse();
        });

        [Test]
        public Task AzureXmsRequestClientIdNull() => TestStatus(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("");
            return await new XMsClientRequestIdClient(ClientDiagnostics, pipeline, host).RestClient.GetAsync();
        });

        [Test]
        public Task AzureXmsRequestClientOverwrite() => TestStatus(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            return await new XMsClientRequestIdClient(ClientDiagnostics, pipeline, host).RestClient.GetAsync();
        });

        [Test]
        public Task AzureXmsRequestClientOverwriteViaParameter() => TestStatus(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            return await new XMsClientRequestIdClient(ClientDiagnostics, pipeline, host).RestClient.ParamGetAsync();
        });
    }
}
