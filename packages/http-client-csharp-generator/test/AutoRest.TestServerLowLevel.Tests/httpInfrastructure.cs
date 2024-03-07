// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using httpInfrastructure_LowLevel;
using NUnit.Framework;
using Azure.Core;

namespace AutoRest.TestServer.Tests
{
    public class HttpInfrastructureTests : TestServerLowLevelTestBase
    {
        [Test]
        public Task HttpClientFailure400Delete() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Delete400Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure400Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Get400Async());
        });

        [Test]
        public Task HttpClientFailure400Head() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Head400Async());
        });

        [Test]
        public Task HttpClientFailure400Options() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Options400Async());
        }, true);

        [Test]
        public Task HttpClientFailure400Patch() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Patch400Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure400Post() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Post400Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure400Put() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Put400Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure401Head() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Head401Async());
        });

        [Test]
        public Task HttpClientFailure402Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Get402Async());
        });

        [Test]
        public Task HttpClientFailure403Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Get403Async());
        });

        [Test]
        public Task HttpClientFailure403Options() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Options403Async());
        }, true);

        [Test]
        public Task HttpClientFailure404Put() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Put404Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure405Patch() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Patch405Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure406Post() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Post406Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure407Delete() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Delete407Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure409Put() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Put409Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure410Head() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Head410Async());
        });

        [Test]
        public Task HttpClientFailure411Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Get411Async());
        });

        [Test]
        public Task HttpClientFailure412Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Get412Async());
        });

        [Test]
        public Task HttpClientFailure412Options() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Options412Async());
        }, true);

        [Test]
        public Task HttpClientFailure413Put() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Put413Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure414Patch() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Patch414Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure415Post() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Post415Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure416Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Get416Async());
        });

        [Test]
        public Task HttpClientFailure417Delete() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Delete417Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpClientFailure429Head() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpClientFailureClient(host, Key, null).Head429Async());
        });

        [Test]
        public Task HttpRedirect300Get() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Get300Async(new()));

        [Test]
        public Task HttpRedirect300Head() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Head300Async());

        [Test]
        public Task HttpRedirect301Get() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Get301Async());

        [Test]
        public Task HttpRedirect302Get() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Get302Async());

        [Test]
        public Task HttpRedirect302Head() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Head302Async());

        [Test]
        public Task HttpRedirect307Delete() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Delete307Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRedirect307Get() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Get307Async());

        [Test]
        public Task HttpRedirect307Head() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Head307Async());

        [Test]
        public Task HttpRedirect307Options() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Options307Async());

        [Test]
        public Task HttpRedirect307Patch() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Patch307Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRedirect307Post() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Post307Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRedirect307Put() => TestStatus(async (host) =>
            await new HttpRedirectsClient(host, Key, null).Put307Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRetry408Head() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Head408Async());

        [Test]
        public Task HttpRetry500Patch() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Patch500Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRetry500Put() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Put500Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRetry502Get() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Get502Async());

        [Test]
        public Task HttpRetry502Options() => Test(async (host) =>
        {
            var result = await new HttpRetryClient(host, Key, null).Options502Async(new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task HttpRetry503Delete() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Delete503Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRetry503Post() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Post503Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRetry504Patch() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Patch504Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpRetry504Put() => TestStatus(async (host) =>
            await new HttpRetryClient(host, Key, null).Put504Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpServerFailure501Get() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(host, Key, null).Get501Async());
        });

        [Test]
        public Task HttpServerFailure501Head() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(host, Key, null).Head501Async());
        });

        [Test]
        public Task HttpServerFailure505Delete() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(host, Key, null).Delete505Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpServerFailure505Post() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpServerFailureClient(host, Key, null).Post505Async(RequestContent.Create(new JsonData(true)), new()));
        });

        [Test]
        public Task HttpSuccess200Delete() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Delete200Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess200Get() => Test(async (host) =>
        {
            var result = await new HttpSuccessClient(host, Key, null).Get200Async(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual(true, (bool)responseBody);
        });

        [Test]
        public Task HttpSuccess200Head() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Head200Async());

        [Test]
        public Task HttpSuccess200Options() => Test(async (host) =>
        {
            var result = await new HttpSuccessClient(host, Key, null).Options200Async(new());
            Assert.AreEqual(200, result.Status);
        }, true);

        [Test]
        public Task HttpSuccess200Patch() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Patch200Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess200Post() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Post200Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess200Put() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Put200Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess201Post() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Post201Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess201Put() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Put201Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess202Delete() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Delete202Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess202Patch() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Patch202Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess202Post() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Post202Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess202Put() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Put202Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess204Delete() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Delete204Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess204Head() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Head204Async());

        [Test]
        public Task HttpSuccess204Patch() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Patch204Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess204Post() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Post204Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess204Put() => TestStatus(async (host) =>
            await new HttpSuccessClient(host, Key, null).Put204Async(RequestContent.Create(new JsonData(true)), new()));

        [Test]
        public Task HttpSuccess404Head() => Test(async (host) =>
        {
            var response = await new HttpSuccessClient(host, Key, null).Head404Async();
            Assert.AreEqual(404, response.Status);
        });

        [Test]
        public Task ResponsesScenarioA200MatchingModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200Model204NoModelDefaultError200ValidAsync(new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task ResponsesScenarioA201DefaultNoModel() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200Model204NoModelDefaultError201InvalidAsync(new()));
        });

        [Test]
        public Task ResponsesScenarioA202DefaultNoModel() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200Model204NoModelDefaultError202NoneAsync(new()));
        });

        [Test]
        public Task ResponsesScenarioA204MatchingNoModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200Model204NoModelDefaultError204ValidAsync(new());
            Assert.IsEmpty(result.Content.ToString());
        });

        [Test]
        public Task ResponsesScenarioA400DefaultModel() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200Model204NoModelDefaultError400ValidAsync(new()));
        });

        [Test]
        public Task ResponsesScenarioB200MatchingModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200Model201ModelDefaultError200ValidAsync(new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task ResponsesScenarioB201MatchingModel() => Test(async (host) =>
        {
            Response result = await new MultipleResponsesClient(host, Key, null).Get200Model201ModelDefaultError201ValidAsync(new());
            Assert.AreEqual(201, result.Status);
        });

        [Test]
        public Task ResponsesScenarioB400DefaultModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200Model201ModelDefaultError400ValidAsync(new()));
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioC200MatchingModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200ModelA201ModelC404ModelDDefaultError200ValidAsync(new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task ResponsesScenarioC201MatchingModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200ModelA201ModelC404ModelDDefaultError201ValidAsync(new());
            Assert.AreEqual(201, result.Status);
        });

        [Test]
        public Task ResponsesScenarioC400DefaultModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200ModelA201ModelC404ModelDDefaultError400ValidAsync(new()));
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioC404MatchingModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200ModelA201ModelC404ModelDDefaultError404ValidAsync(new());
            Assert.AreEqual(404, result.Status);
        });

        [Test]
        public Task ResponsesScenarioD202MatchingNoModel() => TestStatus(async (host) =>
            await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultError202NoneAsync());

        [Test]
        public Task ResponsesScenarioD204MatchingNoModel() => TestStatus(async (host) =>
            await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultError204NoneAsync());

        [Test]
        public Task ResponsesScenarioD400DefaultModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultError400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioE202MatchingInvalid() => TestStatus(async (host) =>
            await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultNone202InvalidAsync());

        [Test]
        public Task ResponsesScenarioE204MatchingNoModel() => TestStatus(async (host) =>
            await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultNone204NoneAsync());

        [Test]
        public Task ResponsesScenarioE400DefaultInvalid() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultNone400InvalidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioE400DefaultNoModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get202None204NoneDefaultNone400NoneAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioEmptyErrorBody() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpFailureClient(host, Key, null).GetEmptyErrorAsync(new()));
        });

        [Test]
        public Task ResponsesScenarioF200DefaultModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).GetDefaultModelA200ValidAsync(new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task ResponsesScenarioF200DefaultNone() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).GetDefaultModelA200NoneAsync(new());
            Assert.IsEmpty(result.Content.ToString());
        });

        [Test]
        public Task ResponsesScenarioF400DefaultModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).GetDefaultModelA400ValidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioF400DefaultNone() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).GetDefaultModelA400NoneAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioG200DefaultInvalid() => TestStatus(async (host) =>
            await new MultipleResponsesClient(host, Key, null).GetDefaultNone200InvalidAsync());

        [Test]
        public Task ResponsesScenarioG200DefaultNoModel() => TestStatus(async (host) =>
            await new MultipleResponsesClient(host, Key, null).GetDefaultNone200NoneAsync());

        [Test]
        public Task ResponsesScenarioG400DefaultInvalid() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).GetDefaultNone400InvalidAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioG400DefaultNoModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).GetDefaultNone400NoneAsync());
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH200MatchingInvalid() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200ModelA200InvalidAsync(new());
            var responseBody = JsonData.FromBytes(result.Content.ToMemory());
            Assert.AreEqual("200", (string)responseBody["statusCodeInvalid"]);
        });

        [Test]
        public Task ResponsesScenarioH200MatchingModel() => Test(async (host) =>
        {
            var result = await new MultipleResponsesClient(host, Key, null).Get200ModelA200ValidAsync(new());
            Assert.AreEqual(200, result.Status);
        });

        [Test]
        public Task ResponsesScenarioH200MatchingNone() => Test(async (host) =>
        {
            var response = await new MultipleResponsesClient(host, Key, null).Get200ModelA200NoneAsync(new());
            Assert.IsEmpty(response.Content.ToString());
        });

        [Test]
        public Task ResponsesScenarioH202NonMatchingModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200ModelA202ValidAsync(new()));
            Assert.AreEqual(202, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH400NonMatchingInvalid() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200ModelA400InvalidAsync(new()));
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH400NonMatchingModel() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new MultipleResponsesClient(host, Key, null).Get200ModelA400ValidAsync(new()));
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioH400NonMatchingNone() => Test((host) =>
        {
            Assert.ThrowsAsync(Is.InstanceOf<RequestFailedException>(), async () => await new MultipleResponsesClient(host, Key, null).Get200ModelA400NoneAsync(new()));
        });

        [Test]
        public Task ResponsesScenarioNoModelEmptyBody() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpFailureClient(host, Key, null).GetNoModelEmptyAsync(new()));
            Assert.AreEqual(400, exception.Status);
        });

        [Test]
        public Task ResponsesScenarioNoModelErrorBody() => Test((host) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new HttpFailureClient(host, Key, null).GetNoModelErrorAsync(new()));
        });
    }
}
