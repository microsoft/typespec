// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Text.Json;
using AutoRest.TestServer.Tests.Infrastructure;
using ModelsTypeSpec.Models;
using NUnit.Framework;

namespace AutoRest.LowLevel.Tests
{
    public class ModelsTypeSpecTests
    {
        private static readonly DateTimeOffset PlainDateData = new DateTimeOffset(2022, 12, 12, 0, 0, 0, 0, new TimeSpan());
        private static readonly TimeSpan PlainTimeData = new TimeSpan(13, 06, 12);

        [Test]
        public void PlainDateTime()
        {
            var input = new RoundTripOptionalModel();
            input.OptionalPlainDate = PlainDateData;

            JsonAsserts.AssertWireSerialization("{\"optionalPlainDate\":\"2022-12-12\"}", input);

            using var document = JsonDocument.Parse("{\"optionalPlainDate\":\"2022-12-12\"}");
            var output = RoundTripOptionalModel.DeserializeRoundTripOptionalModel(document.RootElement);
            Assert.AreEqual(PlainDateData, output.OptionalPlainDate);
        }

        [Test]
        public void PlainDateTimeOmittingTime()
        {
            var input = new RoundTripOptionalModel();
            input.OptionalPlainDate = new DateTimeOffset(2022, 12, 12, 13, 06, 0, 0, new TimeSpan());

            JsonAsserts.AssertWireSerialization("{\"optionalPlainDate\":\"2022-12-12\"}", input);

            using var document = JsonDocument.Parse("{\"optionalPlainDate\":\"2022-12-12T13:06:00\"}");
            var output = RoundTripOptionalModel.DeserializeRoundTripOptionalModel(document.RootElement);
            var plainDate = output.OptionalPlainDate;
            Assert.IsNotNull(plainDate.Value);
            Assert.AreEqual(2022, plainDate.Value.Year);
            Assert.AreEqual(12, plainDate.Value.Month);
            Assert.AreEqual(12, plainDate.Value.Day);
            Assert.AreEqual(13, plainDate.Value.Hour);
            Assert.AreEqual(06, plainDate.Value.Minute);
            Assert.AreEqual(0, plainDate.Value.Millisecond);
        }

        [Test]
        public void PlainTime()
        {
            var input = new RoundTripOptionalModel();
            input.OptionalPlainTime = PlainTimeData;

            JsonAsserts.AssertWireSerialization("{\"optionalPlainTime\":\"13:06:12\"}", input);

            using var document = JsonDocument.Parse("{\"optionalPlainTime\":\"13:06:12\"}");
            var output = RoundTripOptionalModel.DeserializeRoundTripOptionalModel(document.RootElement);
            Assert.AreEqual(PlainTimeData, output.OptionalPlainTime);
        }
    }
}
