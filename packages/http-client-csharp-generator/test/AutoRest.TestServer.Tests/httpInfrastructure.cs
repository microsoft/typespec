// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using httpInfrastructure;
using httpInfrastructure.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class HttpInfrastructureTests : TestServerTestBase
    {
        [Test]
        public Task HttpClientFailure400Delete() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Delete400Async());
        });

        [Test]
        public Task HttpClientFailure400Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Get400Async());
        });

        [Test]
        public Task HttpClientFailure400Head() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Head400Async());
        });

        [Test]
        public Task HttpClientFailure400Options() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Options400Async());
        }, true);

        [Test]
        public Task HttpClientFailure400Patch() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Patch400Async());
        });

        [Test]
        public Task HttpClientFailure400Post() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Post400Async());
        });

        [Test]
        public Task HttpClientFailure400Put() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Put400Async());
        });

        [Test]
        public Task HttpClientFailure401Head() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Head401Async());
        });

        [Test]
        public Task HttpClientFailure402Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Get402Async());
        });

        [Test]
        public Task HttpClientFailure403Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Get403Async());
        });

        [Test]
        public Task HttpClientFailure403Options() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Options403Async());
        }, true);

        [Test]
        public Task HttpClientFailure404Put() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Put404Async());
        });

        [Test]
        public Task HttpClientFailure405Patch() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Patch405Async());
        });

        [Test]
        public Task HttpClientFailure406Post() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Post406Async());
        });

        [Test]
        public Task HttpClientFailure407Delete() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Delete407Async());
        });

        [Test]
        public Task HttpClientFailure409Put() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Put409Async());
        });

        [Test]
        public Task HttpClientFailure410Head() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Head410Async());
        });

        [Test]
        public Task HttpClientFailure411Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Get411Async());
        });

        [Test]
        public Task HttpClientFailure412Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Get412Async());
        });

        [Test]
        public Task HttpClientFailure412Options() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Options412Async());
        }, true);

        [Test]
        public Task HttpClientFailure413Put() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Put413Async());
        });

        [Test]
        public Task HttpClientFailure414Patch() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Patch414Async());
        });

        [Test]
        public Task HttpClientFailure415Post() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Post415Async());
        });

        [Test]
        public Task HttpClientFailure416Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Get416Async());
        });

        [Test]
        public Task HttpClientFailure417Delete() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Delete417Async());
        });

        [Test]
        public Task HttpClientFailure429Head() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(ClientDiagnostics, pipeline, host).Head429Async());
        });

        [Test]
        public Task HttpRedirect300Get() => TestStatus(async (host, pipeline) =>
        {
            var result = await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Get300Async();

            return result.GetRawResponse();
        });

        [Test]
        public Task HttpRedirect300Head() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Head300Async());

        [Test]
        public Task HttpRedirect301Get() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Get301Async());

        [Test]
        [Ignore("This test is not supposed to redirect, but it does. I'm not sure why it is not supposed to redirect.")]
        public Task HttpRedirect301Put() => Test(async (host, pipeline) =>
        {
            var result = await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).RestClient.Put301Async();
            Assert.AreEqual("/http/failure/500", result.Headers.Location);
        });

        [Test]
        public Task HttpRedirect302Get() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Get302Async());

        [Test]
        public Task HttpRedirect302Head() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Head302Async());

        [Test]
        [Ignore("This test is not supposed to redirect, but it does. I'm not sure why it is not supposed to redirect.")]
        public Task HttpRedirect302Patch() => Test(async (host, pipeline) =>
        {
            var result = await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).RestClient.Patch302Async();
            Assert.AreEqual("/http/failure/500", result.Headers.Location);
        });

        [Test]
        public Task HttpRedirect303Post() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Post303Async());

        [Test]
        public Task HttpRedirect307Delete() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Delete307Async());

        [Test]
        public Task HttpRedirect307Get() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Get307Async());

        [Test]
        public Task HttpRedirect307Head() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Head307Async());

        [Test]
        [Ignore("For whatever reason, this test is returning 204 and is considered a failure. It should be returning 200 and succeed.")]
        public Task HttpRedirect307Options() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Options307Async());

        [Test]
        public Task HttpRedirect307Patch() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Patch307Async());

        [Test]
        public Task HttpRedirect307Post() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Post307Async());

        [Test]
        public Task HttpRedirect307Put() => TestStatus(async (host, pipeline) =>
            await new HttpRedirectsClient(ClientDiagnostics, pipeline, host).Put307Async());

        [Test]
        public Task HttpRetry408Head() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Head408Async());

        [Test]
        public Task HttpRetry500Patch() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Patch500Async());

        [Test]
        public Task HttpRetry500Put() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Put500Async());

        [Test]
        public Task HttpRetry502Get() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Get502Async());

        [Test]
        [Ignore("For whatever reason, this test is returning 204 and is considered a failure. It should be returning 200 and succeed.")]
        public Task HttpRetry502Options() => Test(async (host, pipeline) =>
        {
            var result = await new HttpRetryClient(ClientDiagnostics, pipeline, host).Options502Async();
            Assert.AreEqual(true, result.Value);
        });

        [Test]
        public Task HttpRetry503Delete() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Delete503Async());

        [Test]
        public Task HttpRetry503Post() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Post503Async());

        [Test]
        public Task HttpRetry504Patch() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Patch504Async());

        [Test]
        public Task HttpRetry504Put() => TestStatus(async (host, pipeline) =>
            await new HttpRetryClient(ClientDiagnostics, pipeline, host).Put504Async());

        [Test]
        public Task HttpServerFailure501Get() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(ClientDiagnostics, pipeline, host).Get501Async());
        });

        [Test]
        public Task HttpServerFailure501Head() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(ClientDiagnostics, pipeline, host).Head501Async());
        });

        [Test]
        public Task HttpServerFailure505Delete() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(ClientDiagnostics, pipeline, host).Delete505Async());
        });

        [Test]
        public Task HttpServerFailure505Post() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(ClientDiagnostics, pipeline, host).Post505Async());
        });

        [Test]
        public Task HttpSuccess200Delete() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Delete200Async());

        [Test]
        public Task HttpSuccess200Get() => Test(async (host, pipeline) =>
        {
            var result = await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Get200Async();
            Assert.AreEqual(true, result.Value);
        });

        [Test]
        public Task HttpSuccess200Head() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Head200Async());

        [Test]
        [Ignore("For whatever reason, this test is returning 204 and is considered a failure. It should be returning 200 and succeed.")]
        public Task HttpSuccess200Options() => Test(async (host, pipeline) =>
        {
            var result = await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Options200Async();
            Assert.AreEqual(true, result.Value);
        }, true);

        [Test]
        public Task HttpSuccess200Patch() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Patch200Async());

        [Test]
        public Task HttpSuccess200Post() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Post200Async());

        [Test]
        public Task HttpSuccess200Put() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Put200Async());

        [Test]
        public Task HttpSuccess201Post() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Post201Async());

        [Test]
        public Task HttpSuccess201Put() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Put201Async());

        [Test]
        public Task HttpSuccess202Delete() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Delete202Async());

        [Test]
        public Task HttpSuccess202Patch() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Patch202Async());

        [Test]
        public Task HttpSuccess202Post() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Post202Async());

        [Test]
        public Task HttpSuccess202Put() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Put202Async());

        [Test]
        public Task HttpSuccess204Delete() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Delete204Async());

        [Test]
        public Task HttpSuccess204Head() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Head204Async());

        [Test]
        public Task HttpSuccess204Patch() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Patch204Async());

        [Test]
        public Task HttpSuccess204Post() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Post204Async());

        [Test]
        public Task HttpSuccess204Put() => TestStatus(async (host, pipeline) =>
            await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Put204Async());

        [Test]
        public Task HttpSuccess404Head() => Test(async (host, pipeline) =>
        {
            var response = await new HttpSuccessClient(ClientDiagnostics, pipeline, host).Head404Async();

            // 404 is considered success in this test
            Assert.AreEqual(404, response.Status);
        });

        [Test]
        public Task ResponsesScenarioA200MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model204NoModelDefaultError200ValidAsync();
            Assert.AreEqual("200", ((MyException)result.Value).StatusCode);
        });

        [Test]
        public Task ResponsesScenarioA201DefaultNoModel() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model204NoModelDefaultError201InvalidAsync());
        });

        [Test]
        public Task ResponsesScenarioA202DefaultNoModel() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model204NoModelDefaultError202NoneAsync());
        });

        [Test]
        public Task ResponsesScenarioA204MatchingNoModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model204NoModelDefaultError204ValidAsync();
            Assert.Null(result.Value);
        });

        [Test]
        public Task ResponsesScenarioA400DefaultModel() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model204NoModelDefaultError400ValidAsync());
        });

        [Test]
        public Task ResponsesScenarioB200MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model201ModelDefaultError200ValidAsync();
            Assert.AreEqual("200", ((MyException)result.Value).StatusCode);
        });

        [Test]
        public Task ResponsesScenarioB201MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model201ModelDefaultError201ValidAsync();
            Assert.AreEqual("201", ((B)result.Value).StatusCode);
        });

        [Test]
        public Task ResponsesScenarioB400DefaultModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200Model201ModelDefaultError400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioC200MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA201ModelC404ModelDDefaultError200ValidAsync();
            Assert.AreEqual("200", ((MyException)result.Value).StatusCode);
        });

        [Test]
        public Task ResponsesScenarioC201MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA201ModelC404ModelDDefaultError201ValidAsync();
            Assert.AreEqual("201", ((C)result.Value).HttpCode);
        });

        [Test]
        public Task ResponsesScenarioC400DefaultModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA201ModelC404ModelDDefaultError400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioC404MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA201ModelC404ModelDDefaultError404ValidAsync();
            Assert.AreEqual("404", ((D)result.Value).HttpStatusCode);
        });

        [Test]
        public Task ResponsesScenarioD202MatchingNoModel() => TestStatus(async (host, pipeline) =>
            await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultError202NoneAsync());

        [Test]
        public Task ResponsesScenarioD204MatchingNoModel() => TestStatus(async (host, pipeline) =>
            await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultError204NoneAsync());

        [Test]
        public Task ResponsesScenarioD400DefaultModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultError400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        // Passes but should fail for https://github.com/Azure/autorest.csharp/issues/413
        public Task ResponsesScenarioE202MatchingInvalid() => TestStatus(async (host, pipeline) =>
            await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultNone202InvalidAsync());

        [Test]
        public Task ResponsesScenarioE204MatchingNoModel() => TestStatus(async (host, pipeline) =>
            await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultNone204NoneAsync());

        [Test]
        public Task ResponsesScenarioE400DefaultInvalid() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultNone400InvalidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioE400DefaultNoModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get202None204NoneDefaultNone400NoneAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioEmptyErrorBody() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpFailureClient(ClientDiagnostics, pipeline, host).GetEmptyErrorAsync());
        });

        [Test]
        public Task ResponsesScenarioF200DefaultModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultModelA200ValidAsync();
            Assert.AreEqual("200", result.Value.StatusCode);
        });

        [Test]
        public Task ResponsesScenarioF200DefaultNone() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultModelA200NoneAsync());
        });

        [Test]
        public Task ResponsesScenarioF400DefaultModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultModelA400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioF400DefaultNone() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultModelA400NoneAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioG200DefaultInvalid() => TestStatus(async (host, pipeline) =>
            await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultNone200InvalidAsync());

        [Test]
        public Task ResponsesScenarioG200DefaultNoModel() => TestStatus(async (host, pipeline) =>
            await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultNone200NoneAsync());

        [Test]
        public Task ResponsesScenarioG400DefaultInvalid() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultNone400InvalidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioG400DefaultNoModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).GetDefaultNone400NoneAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH200MatchingInvalid() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA200InvalidAsync();
            Assert.AreEqual(null, result.Value.StatusCode);
        });

        [Test]
        public Task ResponsesScenarioH200MatchingModel() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA200ValidAsync();
            Assert.AreEqual("200", result.Value.StatusCode);
        });

        [Test]
        public Task ResponsesScenarioH200MatchingNone() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA200NoneAsync());
        });

        [Test]
        public Task ResponsesScenarioH202NonMatchingModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA202ValidAsync());
            Assert.AreEqual(202, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH400NonMatchingInvalid() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA400InvalidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH400NonMatchingModel() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH400NonMatchingNone() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<RequestFailedException>(), async () => await new MultipleResponsesClient(ClientDiagnostics, pipeline, host).Get200ModelA400NoneAsync());
        });

        [Test]
        public Task ResponsesScenarioNoModelEmptyBody() => Test((host, pipeline) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpFailureClient(ClientDiagnostics, pipeline, host).GetNoModelEmptyAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioNoModelErrorBody() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpFailureClient(ClientDiagnostics, pipeline, host).GetNoModelErrorAsync());
        });
    }
}
