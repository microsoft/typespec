// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using xms_error_responses;

namespace AutoRest.TestServer.Tests
{
    public class XMsErrorResponsesTest : TestServerTestBase
    {
        [Test]
        public Task AnimalNotFoundError() => Test((host, pipeline) =>
        {
            var value = "coyoteUgly";
            var content = "{\"someBaseProp\":\"problem finding animal\",\"reason\":\"the type of animal requested is not available\",\"name\":\"coyote\",\"whatNotFound\":\"AnimalNotFound\"}";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).GetPetByIdAsync(value));
            Assert.AreEqual(404, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task ExpectedNoErrors() => Test(async (host, pipeline) =>
        {
            var value = "tommy";
            var petResponse = await new PetClient(ClientDiagnostics, pipeline, host).GetPetByIdAsync(value);
            Assert.AreEqual(200, petResponse.GetRawResponse().Status);
            Assert.AreEqual("Tommy Tomson", petResponse.Value.Name);
            Assert.AreEqual("Dog", petResponse.Value.AniType);

            value = "stay";
            var petActionResponse = await new PetClient(ClientDiagnostics, pipeline, host).DoSomethingAsync(value);
            Assert.AreEqual(200, petActionResponse.GetRawResponse().Status);
            Assert.IsNull(petActionResponse.Value.ActionResponse);
        });

        [Test]
        public Task ExpectedPetHungryError() => Test((host, pipeline) =>
        {
            var value = "fetch";
            var content = "{\"actionResponse\":\"howl\",\"errorType\":\"PetHungryOrThirstyError\",\"errorMessage\":\"scooby is low\",\"reason\":\"need more everything\",\"hungryOrThirsty\":\"hungry and thirsty\"}";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).DoSomethingAsync(value));
            Assert.AreEqual(404, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task ExpectedPetSadError() => Test((host, pipeline) =>
        {
            var value = "jump";
            var content = "{\"actionResponse\":\"grrrr\",\"errorType\":\"PetSadError\",\"errorMessage\":\"casper aint happy\",\"reason\":\"need more treats\"}";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).DoSomethingAsync(value));
            Assert.AreEqual(500, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task IntError() => Test((host, pipeline) =>
        {
            var value = "alien123";
            var content = "123";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).GetPetByIdAsync(value));
            Assert.AreEqual(501, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task LinkNotFoundError() => Test((host, pipeline) =>
        {
            var value = "weirdAlYankovic";
            var content = "{\"someBaseProp\":\"problem finding pet\",\"reason\":\"link to pet not found\",\"whatSubAddress\":\"pet/yourpet was not found\",\"whatNotFound\":\"InvalidResourceLink\"}";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).GetPetByIdAsync(value));
            Assert.AreEqual(404, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task StringError() => Test((host, pipeline) =>
        {
            var value = "ringo";
            var content = $"\"{value} is missing\"";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).GetPetByIdAsync(value));
            Assert.AreEqual(400, exception.Status);
            Assert.IsTrue(exception.Message.Contains(content));
        });

        [Test]
        public Task SendErrorWithParamNameModels() => Test((host, pipeline) =>
        {
            var content = "{\"actionResponse\":\"grrrr\",\"errorType\":\"PetSadError\",\"errorMessage\":\"casper aint happy\",\"reason\":\"need more treats\"}";
            var exception = Assert.ThrowsAsync<RequestFailedException>(async () => await new PetClient(ClientDiagnostics, pipeline, host).HasModelsParamAsync("value1"));
            Assert.AreEqual(500, exception.Status);
            StringAssert.Contains(content, exception.Message);
        });
    }
}
