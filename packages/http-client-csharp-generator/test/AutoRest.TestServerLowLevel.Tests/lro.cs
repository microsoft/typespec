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
using lro_LowLevel;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class LroTest : TestServerLowLevelTestBase
    {
        [Test]
        public Task CustomHeaderPostAsyncSucceded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = await new LROsCustomHeaderClient(endpoint, Key, options).PostAsyncRetrySucceededAsync(waitUntil, value, new());
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task CustomHeaderPostAsyncSucceded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = new LROsCustomHeaderClient(endpoint, Key, options).PostAsyncRetrySucceeded(waitUntil, value, new());
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task CustomHeaderPostSucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = await new LROsCustomHeaderClient(endpoint, Key, options).Post202Retry200Async(waitUntil, value, new());
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task CustomHeaderPostSucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = new LROsCustomHeaderClient(endpoint, Key, options).Post202Retry200(waitUntil, value, new());
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task CustomHeaderPutAsyncSucceded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = await new LROsCustomHeaderClient(endpoint, Key, options).PutAsyncRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task CustomHeaderPutAsyncSucceded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = new LROsCustomHeaderClient(endpoint, Key, options).PutAsyncRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task CustomHeaderPutSucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = await new LROsCustomHeaderClient(endpoint, Key, options).Put201CreatingSucceeded200Async(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Ignore("Example")]
        [Test]
        public Task CustomHeaderPutSucceededExample([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = await new LROsCustomHeaderClient(endpoint, Key, options).Put201CreatingSucceeded200Async(waitUntil, value, new());
            BinaryData data = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            JsonElement result = JsonDocument.Parse(data.ToStream()).RootElement;
            Assert.AreEqual("100", result.GetProperty("id").GetString());
            Assert.AreEqual("foo", result.GetProperty("name").GetString());
            Assert.AreEqual("Succeeded", result.GetProperty("properties").GetProperty("provisioningState").GetString());
        });

        [Test]
        public Task CustomHeaderPutSucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = new LROsCustomHeaderClient(endpoint, Key, options).Put201CreatingSucceeded200(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Ignore("Example")]
        [Test]
        public Task CustomHeaderPutSucceeded_SyncExample([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            using var _ = ClientRequestIdScope.Start("9C4D50EE-2D56-4CD3-8152-34347DC9F2B0");
            var options = new AutoRestLongRunningOperationTestServiceClientOptions();
            options.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);
            var value = RequestContent.Create(new object());
            var operation = new LROsCustomHeaderClient(endpoint, Key, options).Put201CreatingSucceeded200(waitUntil, value, new());
            BinaryData data = operation.WaitForCompletion();
            JsonElement result = JsonDocument.Parse(data.ToStream()).RootElement;
            Assert.AreEqual("100", result.GetProperty("id").GetString());
            Assert.AreEqual("foo", result.GetProperty("name").GetString());
            Assert.AreEqual("Succeeded", result.GetProperty("properties").GetProperty("provisioningState").GetString());
        });

        [Test]
        public Task LRODelete200([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).Delete202Retry200Async(waitUntil, new());
            // Empty response body
            Assert.AreEqual(0, (await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false)).Value.ToMemory().Length);
        });

        [Test]
        public Task LRODelete200_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).Delete202Retry200(waitUntil, new());
            // Empty response body
            Assert.AreEqual(0, WaitForCompletion(operation, waitUntil).Content.ToMemory().Length);
        });

        [Test]
        public Task LRODelete204([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).Delete202NoRetry204Async(waitUntil, new());
            // Empty response body
            Assert.AreEqual(0, (await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false)).Value.ToMemory().Length);
        });

        [Test]
        public Task LRODelete204_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).Delete202NoRetry204(waitUntil, new());
            // Empty response body
            Assert.AreEqual(0, WaitForCompletion(operation, waitUntil).Content.ToMemory().Length);
        });

        [Test]
        public Task LRODeleteAsyncNoHeaderInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteAsyncNoHeaderInRetryAsync(waitUntil);

            // Assert down cast exception
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });

            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteAsyncNoHeaderInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteAsyncNoHeaderInRetry(waitUntil);
            // Assert down cast exception
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRODeleteAsyncNoRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteAsyncNoRetrySucceededAsync(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteAsyncNoRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteAsyncNoRetrySucceeded(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRODeleteAsyncRetryCanceled([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).DeleteAsyncRetrycanceledAsync(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRODeleteAsyncRetryCanceled_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).DeleteAsyncRetrycanceled(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRODeleteAsyncRetryFailed([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).DeleteAsyncRetryFailedAsync(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRODeleteAsyncRetryFailed_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).DeleteAsyncRetryFailed(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRODeleteAsyncRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteAsyncRetrySucceededAsync(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteAsyncRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteAsyncRetrySucceeded(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRODeleteInlineComplete([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).Delete204SucceededAsync(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteInlineComplete_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).Delete204Succeeded(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRODeleteNoHeaderInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteNoHeaderInRetryAsync(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRODeleteNoHeaderInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteNoHeaderInRetry(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRODeleteValueInlineComplete([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            Operation operation = await new LROsClient(endpoint, Key, null).DeleteValue204SucceededAsync(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        }, true);

        [Test]
        public Task LRODeleteValueInlineComplete_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            Operation operation = new LROsClient(endpoint, Key, null).DeleteValue204Succeeded(waitUntil);
            Assert.Throws<InvalidCastException>(() => { Operation<BinaryData> castedOperation = (Operation<BinaryData>)operation; });
            return WaitForCompletion(operation, waitUntil);
        }, true);

        [Test]
        public Task LRODeleteProvisioningCanceled([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteProvisioning202Deletingcanceled200Async(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Canceled", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRODeleteProvisioningCanceled_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteProvisioning202Deletingcanceled200(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Canceled", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRODeleteProvisioningFailed([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteProvisioning202DeletingFailed200Async(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Failed", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRODeleteProvisioningFailed_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteProvisioning202DeletingFailed200(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Failed", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRODeleteProvisioningSucceededWithBody([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).DeleteProvisioning202Accepted200SucceededAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRODeleteProvisioningSucceededWithBody_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).DeleteProvisioning202Accepted200Succeeded(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROErrorDelete202RetryInvalidHeader([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).Delete202RetryInvalidHeaderAsync(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorDelete202RetryInvalidHeader_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).Delete202RetryInvalidHeader(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidHeader([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).DeleteAsyncRelativeRetryInvalidHeaderAsync(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidHeader_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).DeleteAsyncRelativeRetryInvalidHeader(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidJsonPolling([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).DeleteAsyncRelativeRetryInvalidJsonPollingAsync(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorDeleteAsyncInvalidJsonPolling_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws(Is.InstanceOf<JsonException>(), () =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).DeleteAsyncRelativeRetryInvalidJsonPolling(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorDeleteAsyncNoPollingStatus([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).DeleteAsyncRelativeRetryNoStatusAsync(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorDeleteAsyncNoPollingStatus_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).DeleteAsyncRelativeRetryNoStatus(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorDeleteNoLocation([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LrosaDsClient(endpoint, Key, null).Delete204SucceededAsync(waitUntil);
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LROErrorDeleteNoLocation_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LrosaDsClient(endpoint, Key, null).Delete204Succeeded(waitUntil);
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LROErrorPost202RetryInvalidHeader([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).Post202RetryInvalidHeaderAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPost202RetryInvalidHeader_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).Post202RetryInvalidHeader(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPostAsyncInvalidHeader([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).PostAsyncRelativeRetryInvalidHeaderAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPostAsyncInvalidHeader_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).PostAsyncRelativeRetryInvalidHeader(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPostAsyncInvalidJsonPolling([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.CatchAsync<JsonException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).PostAsyncRelativeRetryInvalidJsonPollingAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPostAsyncInvalidJsonPolling_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Catch<JsonException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).PostAsyncRelativeRetryInvalidJsonPolling(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPostAsyncNoPollingPayload([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).PostAsyncRelativeRetryNoPayloadAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPostAsyncNoPollingPayload_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).PostAsyncRelativeRetryNoPayload(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPostNoLocation([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LrosaDsClient(endpoint, Key, null).Post202NoLocationAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPostNoLocation_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LrosaDsClient(endpoint, Key, null).Post202NoLocation(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPut200InvalidJson([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.CatchAsync<JsonException>(async () => await WaitForCompletionWithValueAsync(await new LrosaDsClient(endpoint, Key, null).Put200InvalidJsonAsync(waitUntil, value, new()), waitUntil));
        });

        [Test]
        public Task LROErrorPut200InvalidJson_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Catch<JsonException>(() => WaitForCompletion(new LrosaDsClient(endpoint, Key, null).Put200InvalidJson(waitUntil, value, new()), waitUntil));
        });

        [Test]
        public Task LROErrorPut201NoProvisioningStatePayload([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LrosaDsClient(endpoint, Key, null).PutError201NoProvisioningStatePayloadAsync(waitUntil, value, new());
            // Empty response body
            Assert.AreEqual(0, (await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false)).Value.ToMemory().Length);
        });

        [Test]
        public Task LROErrorPut201NoProvisioningStatePayload_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LrosaDsClient(endpoint, Key, null).PutError201NoProvisioningStatePayload(waitUntil, value, new());
            // Empty response body
            Assert.AreEqual(0, WaitForCompletion(operation, waitUntil).Content.ToMemory().Length);
        });

        [Test]
        public Task LROErrorPutAsyncInvalidHeader([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PutAsyncRelativeRetryInvalidHeaderAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPutAsyncInvalidHeader_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PutAsyncRelativeRetryInvalidHeader(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPutAsyncInvalidJsonPolling([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.CatchAsync<JsonException>(async () =>
            {
                var operation = await client.PutAsyncRelativeRetryInvalidJsonPollingAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPutAsyncInvalidJsonPolling_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Catch<JsonException>(() =>
            {
                var operation = client.PutAsyncRelativeRetryInvalidJsonPolling(waitUntil, value, new());
                WaitForCompletionWithValue(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatus([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PutAsyncRelativeRetryNoStatusAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatus_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PutAsyncRelativeRetryNoStatus(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatusPayload([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PutAsyncRelativeRetryNoStatusPayloadAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROErrorPutAsyncNoPollingStatusPayload_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PutAsyncRelativeRetryNoStatusPayload(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryDelete202Retry400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.Delete202NonRetry400Async(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryDelete202Retry400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.Delete202NonRetry400(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryDelete400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new LrosaDsClient(endpoint, Key, null).DeleteNonRetry400Async(waitUntil).ConfigureAwait(false));
        });

        [Test]
        public Task LRONonRetryDelete400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            Assert.Throws<RequestFailedException>(() => new LrosaDsClient(endpoint, Key, null).DeleteNonRetry400(waitUntil));
        });

        [Test]
        public Task LRONonRetryDeleteAsyncRetry400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.DeleteAsyncRelativeRetry400Async(waitUntil);
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryDeleteAsyncRetry400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.DeleteAsyncRelativeRetry400(waitUntil);
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryPost202Retry400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.Post202NonRetry400Async(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryPost202Retry400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.Post202NonRetry400(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryPost400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () => await new LrosaDsClient(endpoint, Key, null).PostNonRetry400Async(waitUntil, value, new()));
        });

        [Test]
        public Task LRONonRetryPost400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() => new LrosaDsClient(endpoint, Key, null).PostNonRetry400(waitUntil, value, new()));
        });

        [Test]
        public Task LRONonRetryPostAsyncRetry400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PostAsyncRelativeRetry400Async(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryPostAsyncRetry400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PostAsyncRelativeRetry400(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryPut201Creating400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PutNonRetry201Creating400Async(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryPut201Creating400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PutNonRetry201Creating400(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryPut201Creating400InvalidJson([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PutNonRetry201Creating400InvalidJsonAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryPut201Creating400InvalidJson_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PutNonRetry201Creating400InvalidJson(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LRONonRetryPut400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () => await new LrosaDsClient(endpoint, Key, null).PutNonRetry400Async(waitUntil, value, new()));
        });

        [Test]
        public Task LRONonRetryPut400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() => new LrosaDsClient(endpoint, Key, null).PutNonRetry400(waitUntil, value, new()));
        });

        [Test]
        public Task LRONonRetryPutAsyncRetry400([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await client.PutAsyncRelativeRetry400Async(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LRONonRetryPutAsyncRetry400_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var client = new LrosaDsClient(endpoint, Key, null);
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = client.PutAsyncRelativeRetry400(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPost200([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).Post200WithPayloadAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("1", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("product", GetResultValue(result.Value, "Name"));
        });

        [Test]
        public Task LROPost200_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).Post200WithPayload(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("1", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("product", GetResultValue(result.Value, "Name"));
        });

        [Test]
        public Task LROPostAsyncNoRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PostAsyncNoRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostAndGetList([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).Post202ListAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual(1, GetArrayLength(result.Value));
            Assert.AreEqual("100", GetResultArrayValue(result.Value, 0, "Id"));
            Assert.AreEqual("foo", GetResultArrayValue(result.Value, 0, "Name"));
        });

        [Test]
        public Task LROPostAndGetList_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).Post202List(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual(1, GetArrayLength(result.Value));
            Assert.AreEqual("100", GetResultArrayValue(result.Value, 0, "Id"));
            Assert.AreEqual("foo", GetResultArrayValue(result.Value, 0, "Name"));
        });

        [Test]
        public Task LROPostAsyncNoRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PostAsyncNoRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostAsyncRetryCanceled([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).PostAsyncRetrycanceledAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROPostAsyncRetryCanceled_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).PostAsyncRetrycanceled(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPostAsyncRetryFailed([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).PostAsyncRetryFailedAsync(waitUntil, value, new());
                await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROPostAsyncRetryFailed_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).PostAsyncRetryFailed(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPostAsyncRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PostAsyncRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostAsyncRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PostAsyncRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGet([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).PostDoubleHeadersFinalAzureHeaderGetAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual(null, GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGet_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).PostDoubleHeadersFinalAzureHeaderGet(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual(null, GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGetDefault([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).PostDoubleHeadersFinalAzureHeaderGetDefaultAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostDoubleHeadersFinalAzureHeaderGetDefault_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).PostDoubleHeadersFinalAzureHeaderGetDefault(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostDoubleHeadersFinalLocationGet([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LROsClient(endpoint, Key, null).PostDoubleHeadersFinalLocationGetAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostDoubleHeadersFinalLocationGet_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LROsClient(endpoint, Key, null).PostDoubleHeadersFinalLocationGet(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPostSuccededNoBody([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Post202NoRetry204Async(waitUntil, value, new());
            // Empty response body
            Assert.AreEqual(0, (await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false)).Value.ToMemory().Length);
        });

        [Test]
        public Task LROPostSuccededNoBody_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Post202NoRetry204(waitUntil, value, new());
            // Empty response body
            Assert.AreEqual(0, WaitForCompletion(operation, waitUntil).Content.ToMemory().Length);
        });

        [Test]
        public Task LROPostSuccededWithBody([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Post202Retry200Async(waitUntil, value, new());
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LROPostSuccededWithBody_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Post202Retry200(waitUntil, value, new());
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LROPut200InlineCompleteNoState([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Put200SucceededNoStateAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPut200InlineCompleteNoState_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Put200SucceededNoState(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPut202Retry200([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Put202Retry200Async(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPut202Retry200_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Put202Retry200(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual(null, GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutAsyncNoHeaderInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutAsyncNoHeaderInRetryAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutAsyncNoHeaderInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutAsyncNoHeaderInRetry(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutAsyncNoRetryCanceled([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).PutAsyncNoRetrycanceledAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROPutAsyncNoRetryCanceled_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).PutAsyncNoRetrycanceled(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPutAsyncNoRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutAsyncNoRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutAsyncNoRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutAsyncNoRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutAsyncRetryFailed([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).PutAsyncRetryFailedAsync(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROPutAsyncRetryFailed_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).PutAsyncRetryFailed(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPutAsyncRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutAsyncRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutAsyncRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutAsyncRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutCanceled([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).Put200Acceptedcanceled200Async(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROPutCanceled_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).Put200Acceptedcanceled200(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPutFailed([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                var operation = await new LROsClient(endpoint, Key, null).Put201CreatingFailed200Async(waitUntil, value, new());
                await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            });
        });

        [Test]
        public Task LROPutFailed_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            Assert.Throws<RequestFailedException>(() =>
            {
                var operation = new LROsClient(endpoint, Key, null).Put201CreatingFailed200(waitUntil, value, new());
                WaitForCompletion(operation, waitUntil);
            });
        });

        [Test]
        public Task LROPutInlineComplete([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Put200SucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutInlineComplete_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Put200Succeeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutInlineComplete201([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Put201SucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutInlineComplete201_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Put201Succeeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutNoHeaderInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutNoHeaderInRetryAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutNoHeaderInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutNoHeaderInRetry(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutNonResourceAsyncInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutAsyncNonResourceAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("sku", GetResultValue(result.Value, "Name"));
        });

        [Test]
        public Task LROPutNonResourceAsyncInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutAsyncNonResource(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("sku", GetResultValue(result.Value, "Name"));
        });

        [Test]
        public Task LROPutNonResourceInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutNonResourceAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("sku", GetResultValue(result.Value, "Name"));
        });

        [Test]
        public Task LROPutNonResourceInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutNonResource(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("sku", GetResultValue(result.Value, "Name"));
        });

        [Test]
        public Task LROPutSubResourceAsyncInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutAsyncSubResourceAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSubResourceAsyncInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutAsyncSubResource(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSubResourceInRetry([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).PutSubResourceAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSubResourceInRetry_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).PutSubResource(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSucceededNoBody([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Put200UpdatingSucceeded204Async(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSucceededNoBody_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Put200UpdatingSucceeded204(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSucceededWithBody([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LROsClient(endpoint, Key, null).Put201CreatingSucceeded200Async(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LROPutSucceededWithBody_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LROsClient(endpoint, Key, null).Put201CreatingSucceeded200(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryErrorDelete202Accepted200Succeeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var operation = await new LRORetrysClient(endpoint, Key, null).DeleteProvisioning202Accepted200SucceededAsync(waitUntil, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryErrorDelete202Accepted200Succeeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var operation = new LRORetrysClient(endpoint, Key, null).DeleteProvisioning202Accepted200Succeeded(waitUntil, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryErrorDelete202Retry200Succeeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LRORetrysClient(endpoint, Key, null).Delete202Retry200Async(waitUntil);
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorDelete202Retry200Succeeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LRORetrysClient(endpoint, Key, null).Delete202Retry200(waitUntil);
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRORetryErrorDeleteAsyncRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var operation = await new LRORetrysClient(endpoint, Key, null).DeleteAsyncRelativeRetrySucceededAsync(waitUntil);
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorDeleteAsyncRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var operation = new LRORetrysClient(endpoint, Key, null).DeleteAsyncRelativeRetrySucceeded(waitUntil);
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRORetryErrorPost202Retry200Succeeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LRORetrysClient(endpoint, Key, null).Post202Retry200Async(waitUntil, value, new());
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorPost202Retry200Succeeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LRORetrysClient(endpoint, Key, null).Post202Retry200(waitUntil, value, new());
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRORetryErrorPostAsyncRetrySucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LRORetrysClient(endpoint, Key, null).PostAsyncRelativeRetrySucceededAsync(waitUntil, value, new());
            return await WaitForCompletionAsync(operation, waitUntil).ConfigureAwait(false);
        });

        [Test]
        public Task LRORetryErrorPostAsyncRetrySucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => TestStatus(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LRORetrysClient(endpoint, Key, null).PostAsyncRelativeRetrySucceeded(waitUntil, value, new());
            return WaitForCompletion(operation, waitUntil);
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceeded([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LRORetrysClient(endpoint, Key, null).PutAsyncRelativeRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceeded_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LRORetrysClient(endpoint, Key, null).PutAsyncRelativeRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceededPolling([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LRORetrysClient(endpoint, Key, null).PutAsyncRelativeRetrySucceededAsync(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryErrorPutAsyncSucceededPolling_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LRORetrysClient(endpoint, Key, null).PutAsyncRelativeRetrySucceeded(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryPutSucceededWithBody([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(async endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = await new LRORetrysClient(endpoint, Key, null).Put201CreatingSucceeded200Async(waitUntil, value, new());
            var result = await WaitForCompletionWithValueAsync(operation, waitUntil).ConfigureAwait(false);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        [Test]
        public Task LRORetryPutSucceededWithBody_Sync([Values(WaitUntil.Started, WaitUntil.Completed)] WaitUntil waitUntil) => Test(endpoint =>
        {
            var value = RequestContent.Create(new object());
            var operation = new LRORetrysClient(endpoint, Key, null).Put201CreatingSucceeded200(waitUntil, value, new());
            var result = WaitForCompletionWithValue(operation, waitUntil);
            Assert.AreEqual("100", GetResultValue(result.Value, "Id"));
            Assert.AreEqual("foo", GetResultValue(result.Value, "Name"));
            Assert.AreEqual("Succeeded", GetResultValue(result.Value, "ProvisioningState"));
        });

        private static ValueTask<Response> WaitForCompletionAsync(Operation operation, WaitUntil waitUntil, CancellationToken cancellationToken = default)
        {
            var operationHasCompleted = waitUntil == WaitUntil.Completed;
            if (operationHasCompleted)
            {
                Assert.IsTrue(operation.HasCompleted);
                return new ValueTask<Response>(operation.GetRawResponse());
            }

            return operation.WaitForCompletionResponseAsync(TimeSpan.FromSeconds(1), cancellationToken);
        }

        private static ValueTask<Response<TResult>> WaitForCompletionWithValueAsync<TResult>(Operation<TResult> operation, WaitUntil waitUntil, CancellationToken cancellationToken = default) where TResult : notnull
        {
            var operationHasCompleted = waitUntil == WaitUntil.Completed;
            if (operationHasCompleted)
            {
                Assert.IsTrue(operation.HasCompleted);
                return new ValueTask<Response<TResult>>(Response.FromValue(operation.Value, operation.GetRawResponse()));
            }

            return operation.WaitForCompletionAsync(TimeSpan.FromSeconds(1), cancellationToken);
        }

        private static Response WaitForCompletion(Operation operation, WaitUntil waitUntil, CancellationToken cancellationToken = default)
        {
            var operationHasCompleted = waitUntil == WaitUntil.Completed;
            if (operationHasCompleted)
            {
                Assert.IsTrue(operation.HasCompleted);
                return operation.GetRawResponse();
            }

            return operation.WaitForCompletionResponse(TimeSpan.FromSeconds(1), cancellationToken);
        }

        private static Response<TResult> WaitForCompletionWithValue<TResult>(Operation<TResult> operation, WaitUntil waitUntil, CancellationToken cancellationToken = default) where TResult : notnull
        {
            var operationHasCompleted = waitUntil == WaitUntil.Completed;
            if (operationHasCompleted)
            {
                Assert.IsTrue(operation.HasCompleted);
                return Response.FromValue(operation.Value, operation.GetRawResponse());
            }

            return operation.WaitForCompletion(TimeSpan.FromSeconds(1), cancellationToken);
        }

        private static int GetArrayLength(BinaryData result)
        {
            using var doc = JsonDocument.Parse(result);
            int length = 0;
            foreach (var _ in doc.RootElement.EnumerateArray())
            {
                length++;
            }
            return length;
        }

        private static string GetResultArrayValue(BinaryData result, int index, string valueName)
        {
            using var doc = JsonDocument.Parse(result);
            var enumerator = doc.RootElement.EnumerateArray();

            int cur = 0;
            while (enumerator.MoveNext())
            {
                if (cur == index)
                {
                    return GetElementValue(enumerator.Current, valueName);
                }
                cur++;
            }

            throw new IndexOutOfRangeException();
        }

        private static string GetResultValue(BinaryData result, string valueName)
        {
            using var doc = JsonDocument.Parse(result);
            return GetElementValue(doc.RootElement, valueName);
        }

        private static string GetElementValue(JsonElement element, string valueName)
        {
            switch (valueName)
            {
                case "Id":
                    return element.GetProperty("id").GetString();
                case "Name":
                    if (element.TryGetProperty("name", out var name))
                    {
                        return name.GetString();
                    }
                    return null;
                case "ProvisioningState":
                    if (element.TryGetProperty("properties", out var properties))
                    {
                        if (properties.TryGetProperty("provisioningState", out var provisioningState))
                        {
                            return provisioningState.GetString();
                        }
                    }
                    return null;
                default:
                    throw new KeyNotFoundException(valueName);
            }
        }
    }
}
