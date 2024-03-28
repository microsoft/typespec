using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using extensible_enums_swagger;
using extensible_enums_swagger.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class ExtensibleEnumTests : TestServerTestBase
    {
        [Test]
        public Task RoundTripEnum() => TestStatus(async (host, pipeline) =>
        {
            var response = await new PetClient(ClientDiagnostics, pipeline, host).AddPetAsync( new Pet(IntEnum.Two)
            {
                Name = "Retriever",
                DaysOfWeek = DaysOfWeekExtensibleEnum.Friday
            });

            Assert.AreEqual("Retriever", response.Value.Name);
            Assert.AreEqual(IntEnum.Two, response.Value.IntEnum);
            Assert.AreEqual(DaysOfWeekExtensibleEnum.Friday, response.Value.DaysOfWeek);

            return response.GetRawResponse();
        });

        [Test]
        public Task RoundTripEnum_Custom() => TestStatus(async (host, pipeline) =>
        {
            var response = await new PetClient(ClientDiagnostics, pipeline, host).AddPetAsync( new Pet("77")
            {
                Name = "Retriever",
                DaysOfWeek = "WED"
            });

            Assert.AreEqual("Retriever", response.Value.Name);
            Assert.AreEqual("77", response.Value.IntEnum.ToString());
            Assert.AreEqual("WED", response.Value.DaysOfWeek.Value.ToString());

            return response.GetRawResponse();
        });

        [Test]
        public Task RoundTripEnum_Null() => TestStatus(async (host, pipeline) =>
        {
            var response = await new PetClient(ClientDiagnostics, pipeline, host).AddPetAsync( new Pet("77")
            {
                Name = "Retriever",
                DaysOfWeek = null
            });

            Assert.AreEqual("Retriever", response.Value.Name);
            Assert.AreEqual("77", response.Value.IntEnum.ToString());
            Assert.Null(response.Value.DaysOfWeek);

            return response.GetRawResponse();
        });

        [Test]
        public Task AllowedValueEnum() => TestStatus(async (host, pipeline) =>
        {
            var response = await new PetClient(ClientDiagnostics, pipeline, host).GetByPetIdAsync( "scooby");

            Assert.AreEqual("Scooby Scarface", response.Value.Name);
            Assert.AreEqual("2.1", response.Value.IntEnum.ToString());
            Assert.AreEqual(DaysOfWeekExtensibleEnum.Thursday, response.Value.DaysOfWeek);

            return response.GetRawResponse();
        });

        [Test]
        public Task ExpectedEnum() => TestStatus(async (host, pipeline) =>
        {
            var response = await new PetClient(ClientDiagnostics, pipeline, host).GetByPetIdAsync( "tommy");

            Assert.AreEqual("Tommy Tomson", response.Value.Name);
            Assert.AreEqual(IntEnum.One, response.Value.IntEnum);
            Assert.AreEqual(DaysOfWeekExtensibleEnum.Monday, response.Value.DaysOfWeek);

            return response.GetRawResponse();
        });

        [Test]
        public Task UnexpectedEnum() => TestStatus(async (host, pipeline) =>
        {
            var response = await new PetClient(ClientDiagnostics, pipeline, host).GetByPetIdAsync( "casper");

            Assert.AreEqual("Casper Ghosty", response.Value.Name);
            Assert.AreEqual(IntEnum.Two, response.Value.IntEnum);
            Assert.AreEqual("Weekend", response.Value.DaysOfWeek.Value.ToString());

            return response.GetRawResponse();
        });
    }
}
