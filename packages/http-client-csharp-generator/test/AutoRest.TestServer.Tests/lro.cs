// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using lro;
using lro.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class LroTest: TestServerTestBase
    {
        [Test]
        public Task CustomHeaderPostAsyncSucceded() => TestStatus(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = await new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetrySucceededAsync(value);
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task CustomHeaderPostAsyncSucceded_Sync() => TestStatus((host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetrySucceeded(value);
            return WaitForCompletion(operation);
        });

        [Test]
        public Task CustomHeaderPostSucceeded() => TestStatus(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = await new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPost202Retry200Async(value);
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task CustomHeaderPostSucceeded_Sync() => TestStatus((host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPost202Retry200(value);
            return WaitForCompletion(operation);
        });

        [Test]
        public Task CustomHeaderPutAsyncSucceded() => Test(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = await new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPutAsyncRetrySucceededAsync(value);
            var result =  await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task CustomHeaderPutAsyncSucceded_Sync() => Test((host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPutAsyncRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task CustomHeaderPutSucceeded() => Test(async (host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = await new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPut201CreatingSucceeded200Async(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task CustomHeaderPutSucceeded_Sync() => Test((host, pipeline) =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var value = new Product();
            var operation = new LROsCustomHeaderClient(ClientDiagnostics, pipeline, host).StartPut201CreatingSucceeded200(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPatchInlineCompleteIgnoreHeaders() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPatch200SucceededIgnoreHeadersAsync();
            var resp = await operation.WaitForCompletionAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LROPatchInlineCompleteIgnoreHeaders_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPatch200SucceededIgnoreHeaders();
            var resp = WaitForCompletion(operation);
        });

        [Test]
        public Task LROPatch201WithAsyncHeader() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPatch201RetryWithAsyncHeaderAsync();
            var resp = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("/lro/patch/201/retry/onlyAsyncHeader", resp.Value.Id);
        });

        [Test]
        public Task LROPatch201WithAsyncHeader_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPatch201RetryWithAsyncHeader();
            var resp = WaitForCompletionWithValue(operation);
            Assert.AreEqual("/lro/patch/201/retry/onlyAsyncHeader", resp.Value.Id);
        });

        [Test]
        public Task LROPatch202WithAsyncAndLocationHeader() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPatch202RetryWithAsyncAndLocationHeaderAsync();
            var resp = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("/lro/patch/202/retry/asyncAndLocationHeader", resp.Value.Id);
        });

        [Test]
        public Task LROPatch202WithAsyncAndLocationHeader_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPatch202RetryWithAsyncAndLocationHeader();
            var resp = WaitForCompletionWithValue(operation);
            Assert.AreEqual("/lro/patch/202/retry/asyncAndLocationHeader", resp.Value.Id);
        });

        [Test]
        public Task LRODelete200() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDelete202Retry200Async();
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRODelete200_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDelete202Retry200();
            // Empty response body
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LRODelete204() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDelete202NoRetry204Async();
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRODelete204_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDelete202NoRetry204();
            // Empty response body
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LRODeleteAsyncNoHeaderInRetry() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncNoHeaderInRetryAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteAsyncNoHeaderInRetry_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncNoHeaderInRetry();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRODeleteAsyncNoRetrySucceeded() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncNoRetrySucceededAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteAsyncNoRetrySucceeded_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncNoRetrySucceeded();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRODeleteAsyncRetryCanceled() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRetrycanceledAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRODeleteAsyncRetryCanceled_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRetrycanceled();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRODeleteAsyncRetryFailed() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRetryFailedAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRODeleteAsyncRetryFailed_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRetryFailed();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRODeleteAsyncRetrySucceeded() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRetrySucceededAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteAsyncRetrySucceeded_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRetrySucceeded();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRODeleteInlineComplete() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDelete204SucceededAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteInlineComplete_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDelete204Succeeded();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRODeleteNoHeaderInRetry() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteNoHeaderInRetryAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteNoHeaderInRetry_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteNoHeaderInRetry();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRODeleteProvisioningCanceled() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202Deletingcanceled200Async();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Canceled", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRODeleteProvisioningCanceled_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202Deletingcanceled200();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Canceled", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRODeleteProvisioningFailed() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202DeletingFailed200Async();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Failed", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRODeleteProvisioningFailed_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202DeletingFailed200();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Failed", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRODeleteProvisioningSucceededWithBody() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202Accepted200SucceededAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRODeleteProvisioningSucceededWithBody_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202Accepted200Succeeded();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROErrorDelete202RetryInvalidHeader() => Test(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDelete202RetryInvalidHeaderAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorDelete202RetryInvalidHeader_Sync() => Test((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDelete202RetryInvalidHeader();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidHeader() => Test(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetryInvalidHeaderAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidHeader_Sync() => Test((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetryInvalidHeader();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidJsonPolling() => Test(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetryInvalidJsonPollingAsync();
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidJsonPolling_Sync() => Test((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetryInvalidJsonPolling();
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorDeleteAsyncNoPollingStatus() => Test(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetryNoStatusAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorDeleteAsyncNoPollingStatus_Sync() => Test((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetryNoStatus();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorDeleteNoLocation() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDelete204SucceededAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LROErrorDeleteNoLocation_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDelete204Succeeded();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LROErrorPost202RetryInvalidHeader() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPost202RetryInvalidHeaderAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPost202RetryInvalidHeader_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPost202RetryInvalidHeader(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPostAsyncInvalidHeader() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetryInvalidHeaderAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPostAsyncInvalidHeader_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetryInvalidHeader(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPostAsyncInvalidJsonPolling() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetryInvalidJsonPollingAsync(value);
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPostAsyncInvalidJsonPolling_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetryInvalidJsonPolling(value);
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPostAsyncNoPollingPayload() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetryNoPayloadAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPostAsyncNoPollingPayload_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetryNoPayload(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPostNoLocation() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPost202NoLocationAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPostNoLocation_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPost202NoLocation(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPut200InvalidJson() => Test((host, pipeline) =>
        {
            var value = new Product();
            Assert.CatchAsync<JsonException>(async () => await (await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPut200InvalidJsonAsync(value)).WaitForCompletionAsync());
        });

        [Test]
        public Task LROErrorPut200InvalidJson_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            Assert.Catch<JsonException>(() => WaitForCompletion(new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPut200InvalidJson(value)));
        });

        [Test]
        public Task LROErrorPut201NoProvisioningStatePayload() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutError201NoProvisioningStatePayloadAsync(value);
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPut201NoProvisioningStatePayload_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutError201NoProvisioningStatePayload(value);
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPutAsyncInvalidHeader() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryInvalidHeaderAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPutAsyncInvalidHeader_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryInvalidHeader(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPutAsyncInvalidJsonPolling() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryInvalidJsonPollingAsync(value);
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPutAsyncInvalidJsonPolling_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryInvalidJsonPolling(value);
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatus() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryNoStatusAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatus_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryNoStatus(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatusPayload() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryNoStatusPayloadAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatusPayload_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetryNoStatusPayload(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryDelete202Retry400() => Test(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDelete202NonRetry400Async();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryDelete202Retry400_Sync() => Test((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDelete202NonRetry400();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryDelete400() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteNonRetry400Async());
        });

        [Test]
        public Task LRONonRetryDelete400_Sync() => Test((host, pipeline) =>
        {
            Assert.Throws<RequestFailedException>(() => new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteNonRetry400());
        });

        [Test]
        public Task LRONonRetryDeleteAsyncRetry400() => Test(async (host, pipeline) =>
        {
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetry400Async();
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryDeleteAsyncRetry400_Sync() => Test((host, pipeline) =>
        {
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetry400();
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryPost202Retry400() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPost202NonRetry400Async(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryPost202Retry400_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPost202NonRetry400(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryPost400() => Test((host, pipeline) =>
        {
            var value = new Product();
            Assert.ThrowsAsync<RequestFailedException>(async () => await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostNonRetry400Async(value));
        });

        [Test]
        public Task LRONonRetryPost400_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            Assert.Throws<RequestFailedException>(() => new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostNonRetry400(value));
        });

        [Test]
        public Task LRONonRetryPostAsyncRetry400() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetry400Async(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryPostAsyncRetry400_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetry400(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryPut201Creating400() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutNonRetry201Creating400Async(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryPut201Creating400_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutNonRetry201Creating400(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryPut201Creating400InvalidJson() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutNonRetry201Creating400InvalidJsonAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryPut201Creating400InvalidJson_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutNonRetry201Creating400InvalidJson(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LRONonRetryPut400() => Test((host, pipeline) =>
        {
            var value = new Product();
            Assert.ThrowsAsync<RequestFailedException>(async () => await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutNonRetry400Async(value));
        });

        [Test]
        public Task LRONonRetryPut400_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            Assert.Throws<RequestFailedException>(() => new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutNonRetry400(value));
        });

        [Test]
        public Task LRONonRetryPutAsyncRetry400() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetry400Async(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryPutAsyncRetry400_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LrosaDsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetry400(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPost200() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPost200WithPayloadAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("1", result.Value.Id);
            Assert.AreEqual("product", result.Value.Name);
        });

        [Test]
        public Task LROPost200_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPost200WithPayload();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("1", result.Value.Id);
            Assert.AreEqual("product", result.Value.Name);
        });

        [Test]
        public Task LROPostAsyncNoRetrySucceeded() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncNoRetrySucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostAndGetList() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPost202ListAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual(1, result.Value.Count);
            Assert.AreEqual("100", result.Value[0].Id);
            Assert.AreEqual("foo", result.Value[0].Name);
        });

        [Test]
        public Task LROPostAsyncNoRetrySucceeded_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncNoRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostAsyncRetryCanceled() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetrycanceledAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPostAsyncRetryCanceled_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetrycanceled(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPostAsyncRetryFailed() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetryFailedAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionResponseAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPostAsyncRetryFailed_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetryFailed(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPostAsyncRetrySucceeded() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetrySucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostAsyncRetrySucceeded_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostAsyncRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGet() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostDoubleHeadersFinalAzureHeaderGetAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual(null, result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGet_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostDoubleHeadersFinalAzureHeaderGet();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual(null, result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGetDefault() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostDoubleHeadersFinalAzureHeaderGetDefaultAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGetDefault_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostDoubleHeadersFinalAzureHeaderGetDefault();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostDoubleHeadersFinalLocationGet() => Test(async (host, pipeline) =>
        {
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPostDoubleHeadersFinalLocationGetAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostDoubleHeadersFinalLocationGet_Sync() => Test((host, pipeline) =>
        {
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPostDoubleHeadersFinalLocationGet();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPostSuccededNoBody() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPost202NoRetry204Async(value);
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPostSuccededNoBody_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPost202NoRetry204(value);
            Assert.Throws(Is.InstanceOf<JsonException>(), () => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPostSuccededWithBody() => TestStatus(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPost202Retry200Async(value);
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LROPostSuccededWithBody_Sync() => TestStatus((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPost202Retry200(value);
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LROPut200InlineCompleteNoState() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut200SucceededNoStateAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPut200InlineCompleteNoState_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut200SucceededNoState(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPut202Retry200() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut202Retry200Async(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPut202Retry200_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut202Retry200(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual(null, result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutAsyncNoHeaderInRetry() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNoHeaderInRetryAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutAsyncNoHeaderInRetry_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNoHeaderInRetry(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutAsyncNoRetryCanceled() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNoRetrycanceledAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPutAsyncNoRetryCanceled_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNoRetrycanceled(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPutAsyncNoRetrySucceeded() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNoRetrySucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutAsyncNoRetrySucceeded_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNoRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutAsyncRetryFailed() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRetryFailedAsync(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPutAsyncRetryFailed_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRetryFailed(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPutAsyncRetrySucceeded() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRetrySucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutAsyncRetrySucceeded_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutCanceled() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut200Acceptedcanceled200Async(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPutCanceled_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut200Acceptedcanceled200(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPutFailed() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut201CreatingFailed200Async(value);
            Assert.ThrowsAsync<RequestFailedException>(async () => await operation.WaitForCompletionAsync().ConfigureAwait(false));
        });

        [Test]
        public Task LROPutFailed_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut201CreatingFailed200(value);
            Assert.Throws<RequestFailedException>(() => WaitForCompletion(operation));
        });

        [Test]
        public Task LROPutInlineComplete() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut200SucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutInlineComplete_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut200Succeeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutInlineComplete201() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut201SucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutInlineComplete201_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut201Succeeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutNoHeaderInRetry() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutNoHeaderInRetryAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutNoHeaderInRetry_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutNoHeaderInRetry(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutNonResourceAsyncInRetry() => Test(async (host, pipeline) =>
        {
            var value = new Sku();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNonResourceAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("sku", result.Value.Name);
        });

        [Test]
        public Task LROPutNonResourceAsyncInRetry_Sync() => Test((host, pipeline) =>
        {
            var value = new Sku();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncNonResource(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("sku", result.Value.Name);
        });

        [Test]
        public Task LROPutNonResourceInRetry() => Test(async (host, pipeline) =>
        {
            var value = new Sku();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutNonResourceAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("sku", result.Value.Name);
        });

        [Test]
        public Task LROPutNonResourceInRetry_Sync() => Test((host, pipeline) =>
        {
            var value = new Sku();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutNonResource(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("sku", result.Value.Name);
        });

        [Test]
        public Task LROPutSubResourceAsyncInRetry() => Test(async (host, pipeline) =>
        {
            var value = new SubProduct();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncSubResourceAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSubResourceAsyncInRetry_Sync() => Test((host, pipeline) =>
        {
            var value = new SubProduct();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutAsyncSubResource(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSubResourceInRetry() => Test(async (host, pipeline) =>
        {
            var value = new SubProduct();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPutSubResourceAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSubResourceInRetry_Sync() => Test((host, pipeline) =>
        {
            var value = new SubProduct();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPutSubResource(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSucceededNoBody() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut200UpdatingSucceeded204Async(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSucceededNoBody_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut200UpdatingSucceeded204(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSucceededWithBody() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LROsClient(ClientDiagnostics, pipeline, host).StartPut201CreatingSucceeded200Async(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LROPutSucceededWithBody_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LROsClient(ClientDiagnostics, pipeline, host).StartPut201CreatingSucceeded200(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryErrorDelete202Accepted200Succeeded() => Test(async (host, pipeline) =>
        {
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202Accepted200SucceededAsync();
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryErrorDelete202Accepted200Succeeded_Sync() => Test((host, pipeline) =>
        {
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartDeleteProvisioning202Accepted200Succeeded();
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryErrorDelete202Retry200Succeeded() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartDelete202Retry200Async();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorDelete202Retry200Succeeded_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartDelete202Retry200();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRORetryErrorDeleteAsyncRetrySucceeded() => TestStatus(async (host, pipeline) =>
        {
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetrySucceededAsync();
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorDeleteAsyncRetrySucceeded_Sync() => TestStatus((host, pipeline) =>
        {
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartDeleteAsyncRelativeRetrySucceeded();
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRORetryErrorPost202Retry200Succeeded() => TestStatus(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPost202Retry200Async(value);
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorPost202Retry200Succeeded_Sync() => TestStatus((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPost202Retry200(value);
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRORetryErrorPostAsyncRetrySucceeded() => TestStatus(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetrySucceededAsync(value);
            return await operation.WaitForCompletionResponseAsync().ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorPostAsyncRetrySucceeded_Sync() => TestStatus((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPostAsyncRelativeRetrySucceeded(value);
            return WaitForCompletion(operation);
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceeded() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetrySucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceeded_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceededPolling() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetrySucceededAsync(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceededPolling_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPutAsyncRelativeRetrySucceeded(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryPutSucceededWithBody() => Test(async (host, pipeline) =>
        {
            var value = new Product();
            var operation = await new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPut201CreatingSucceeded200Async(value);
            var result = await operation.WaitForCompletionAsync().ConfigureAwait(false);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public Task LRORetryPutSucceededWithBody_Sync() => Test((host, pipeline) =>
        {
            var value = new Product();
            var operation = new LRORetrysClient(ClientDiagnostics, pipeline, host).StartPut201CreatingSucceeded200(value);
            var result = WaitForCompletionWithValue(operation);
            Assert.AreEqual("100", result.Value.Id);
            Assert.AreEqual("foo", result.Value.Name);
            Assert.AreEqual("Succeeded", result.Value.ProvisioningState);
        });

        [Test]
        public void LROValueTypeIsReadOnlyList()
        {
            Assert.AreEqual(typeof(Operation<IReadOnlyList<Product>>), typeof(LROsPost202ListOperation).BaseType);
        }

        private static Response WaitForCompletion(Operation operation, CancellationToken cancellationToken = default)
        {
            return WaitForCompletion(operation, TimeSpan.FromSeconds(1), cancellationToken);
        }

        private static Response WaitForCompletion(Operation operation, TimeSpan pollingInterval, CancellationToken cancellationToken = default)
        {
            while (true)
            {
                operation.UpdateStatus(cancellationToken);
                if (operation.HasCompleted)
                {
                    return operation.GetRawResponse();
                }

                Thread.Sleep(pollingInterval);
            }
        }

        private static Response<TResult> WaitForCompletionWithValue<TResult>(Operation<TResult> operation, CancellationToken cancellationToken = default) where TResult : notnull
        {
            return WaitForCompletionWithValue(operation, TimeSpan.FromSeconds(1), cancellationToken);
        }

        private static Response<TResult> WaitForCompletionWithValue<TResult>(Operation<TResult> operation, TimeSpan pollingInterval, CancellationToken cancellationToken = default) where TResult : notnull
        {
            while (true)
            {
                operation.UpdateStatus(cancellationToken);
                if (operation.HasCompleted)
                {
                    return Response.FromValue(operation.Value, operation.GetRawResponse());
                }

                Thread.Sleep(pollingInterval);
            }
        }
    }
}
