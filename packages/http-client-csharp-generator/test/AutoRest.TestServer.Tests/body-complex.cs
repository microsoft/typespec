// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using System.Xml;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure.Core;
using Azure.Core.Pipeline;
using body_complex;
using body_complex.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyComplexTest: TestServerTestBase
    {
        [Test]
        public Task GetComplexBasicValid() => Test(async (host, pipeline) =>
        {
            var result = await new BasicClient(ClientDiagnostics, pipeline, host).GetValidAsync();
            Assert.AreEqual("abc", result.Value.Name);
            Assert.AreEqual(2, result.Value.Id);
            Assert.AreEqual(CMYKColors.Yellow, result.Value.Color);
        });

        [Test]
        public Task PutComplexBasicValid() => TestStatus(async (host, pipeline) =>
        {
            var value = new Basic
            {
                Name = "abc",
                Id = 2,
                Color = CMYKColors.Magenta
            };
            return await new BasicClient(ClientDiagnostics, pipeline, host).PutValidAsync(value);
        });

        [Test]
        public Task GetComplexBasicEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new BasicClient(ClientDiagnostics, pipeline, host).GetEmptyAsync();
            Assert.AreEqual(null, result.Value.Name);
            Assert.AreEqual(null, result.Value.Id);
            Assert.AreEqual(null, result.Value.Color);
        });

        [Test]
        public Task GetComplexBasicNotProvided() => Test((host, pipeline) =>
        {
            // Empty response body
            Assert.ThrowsAsync(Is.InstanceOf<JsonException>(), async () => await new BasicClient(ClientDiagnostics, pipeline, host).GetNotProvidedAsync());
        });

        [Test]
        public void ThrowsIfApiVersionIsNull()
        {
            Assert.Throws<ArgumentNullException>(() => new BasicClient(ClientDiagnostics, HttpPipelineBuilder.Build(new TestOptions()), new Uri("http://test"), null));
        }

        [Test]
        public Task GetComplexBasicNull() => Test(async (host, pipeline) =>
        {
            var result = await new BasicClient(ClientDiagnostics, pipeline, host).GetNullAsync();
            Assert.AreEqual(null, result.Value.Name);
            Assert.AreEqual(null, result.Value.Id);
            Assert.AreEqual(null, result.Value.Color);
        });

        [Test]
        public Task GetComplexBasicInvalid() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync(typeof(InvalidOperationException), async () => await new BasicClient(ClientDiagnostics, pipeline, host).GetInvalidAsync());
        });

        [Test]
        public void CheckComplexPrimitiveInteger()
        {
            var properties = typeof(IntWrapper).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(int?), properties.First(p => p.Name == "Field1").PropertyType);
            Assert.AreEqual(typeof(int?), properties.First(p => p.Name == "Field2").PropertyType);
        }

        [Test]
        public Task GetComplexPrimitiveInteger() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetIntAsync();
            Assert.AreEqual(-1, result.Value.Field1);
            Assert.AreEqual(2, result.Value.Field2);
        });

        [Test]
        public Task PutComplexPrimitiveInteger() => TestStatus(async (host, pipeline) =>
        {
            var value = new IntWrapper
            {
                Field1 = -1,
                Field2 = 2
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutIntAsync( value);
        });

        [Test]
        public void CheckComplexPrimitiveLong()
        {
            var properties = typeof(LongWrapper).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(long?), properties.First(p => p.Name == "Field1").PropertyType);
            Assert.AreEqual(typeof(long?), properties.First(p => p.Name == "Field2").PropertyType);
        }

        [Test]
        public Task GetComplexPrimitiveLong() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetLongAsync();
            Assert.AreEqual(1099511627775L, result.Value.Field1);
            Assert.AreEqual(-999511627788L, result.Value.Field2);
        });

        [Test]
        public Task PutComplexPrimitiveLong() => TestStatus(async (host, pipeline) =>
        {
            var value = new LongWrapper
            {
                Field1 = 1099511627775L,
                Field2 = -999511627788L
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutLongAsync( value);
        });

        [Test]
        public void CheckComplexPrimitiveFloat()
        {
            var properties = typeof(FloatWrapper).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(float?), properties.First(p => p.Name == "Field1").PropertyType);
            Assert.AreEqual(typeof(float?), properties.First(p => p.Name == "Field2").PropertyType);
        }

        [Test]
        public Task GetComplexPrimitiveFloat() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetFloatAsync();
            Assert.AreEqual(1.05F, result.Value.Field1);
            Assert.AreEqual(-0.003F, result.Value.Field2);
        });

        [Test]
        public Task PutComplexPrimitiveFloat() => TestStatus(async (host, pipeline) =>
        {
            var value = new FloatWrapper
            {
                Field1 = 1.05F,
                Field2 = -0.003F
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutFloatAsync( value);
        });

        [Test]
        public void CheckComplexPrimitiveDouble()
        {
            var properties = typeof(DoubleWrapper).GetProperties(BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(typeof(double?), properties.First(p => p.Name == "Field1").PropertyType);
            Assert.AreEqual(typeof(double?), properties.First(p => p.Name == "Field56ZerosAfterTheDotAndNegativeZeroBeforeDotAndThisIsALongFieldNameOnPurpose").PropertyType);
        }

        [Test]
        public Task GetComplexPrimitiveDouble() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetDoubleAsync();
            Assert.AreEqual(3e-100D, result.Value.Field1);
            Assert.AreEqual(-0.000000000000000000000000000000000000000000000000000000005D, result.Value.Field56ZerosAfterTheDotAndNegativeZeroBeforeDotAndThisIsALongFieldNameOnPurpose);
        });

        [Test]
        public Task PutComplexPrimitiveDouble() => TestStatus(async (host, pipeline) =>
        {
            var value = new DoubleWrapper
            {
                Field1 = 3e-100D,
                Field56ZerosAfterTheDotAndNegativeZeroBeforeDotAndThisIsALongFieldNameOnPurpose = -0.000000000000000000000000000000000000000000000000000000005D
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutDoubleAsync( value);
        });

        [Test]
        public Task GetComplexPrimitiveBool() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetBoolAsync();
            Assert.AreEqual(true, result.Value.FieldTrue);
            Assert.AreEqual(false, result.Value.FieldFalse);
        });

        [Test]
        public Task PutComplexPrimitiveBool() => TestStatus(async (host, pipeline) =>
        {
            var value = new BooleanWrapper
            {
                FieldTrue = true,
                FieldFalse = false
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutBoolAsync( value);
        });

        [Test]
        public Task GetComplexPrimitiveString() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetStringAsync();
            Assert.AreEqual("goodrequest", result.Value.Field);
            Assert.AreEqual(string.Empty, result.Value.Empty);
            Assert.AreEqual(null, result.Value.NullProperty);
        });

        [Test]
        public Task PutComplexPrimitiveString() => TestStatus(async (host, pipeline) =>
        {
            var value = new StringWrapper
            {
                Field = "goodrequest",
                Empty = string.Empty,
                NullProperty = null
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutStringAsync( value);
        });

        [Test]
        public Task GetComplexPrimitiveDate() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetDateAsync();
            Assert.AreEqual(DateTimeOffset.MinValue, result.Value.Field);
            Assert.AreEqual(DateTimeOffset.Parse("2016-02-29", styles: DateTimeStyles.AssumeUniversal), result.Value.Leap);
        });

        [Test]
        public Task PutComplexPrimitiveDate() => TestStatus(async (host, pipeline) =>
        {
            var value = new DateWrapper
            {
                Field = DateTimeOffset.MinValue,
                Leap = DateTimeOffset.Parse("2016-02-29", styles: DateTimeStyles.AssumeUniversal)
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutDateAsync( value);
        });

        [Test]
        public Task GetComplexPrimitiveDateTime() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetDateTimeAsync();
            Assert.AreEqual(DateTimeOffset.Parse("0001-01-01T00:00:00Z"), result.Value.Field);
            Assert.AreEqual(DateTimeOffset.Parse("2015-05-18T18:38:00Z"), result.Value.Now);
        });

        [Test]
        public Task PutComplexPrimitiveDateTime() => TestStatus(async (host, pipeline) =>
        {
            var value = new DatetimeWrapper
            {
                Field = DateTimeOffset.Parse("0001-01-01T00:00:00Z"),
                Now = DateTimeOffset.Parse("2015-05-18T18:38:00Z")
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutDateTimeAsync( value);
        });

        [Test]
        public Task GetComplexPrimitiveDateTimeRfc1123() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetDateTimeRfc1123Async();
            Assert.AreEqual(DateTimeOffset.Parse("Mon, 01 Jan 0001 00:00:00 GMT"), result.Value.Field);
            Assert.AreEqual(DateTimeOffset.Parse("Mon, 18 May 2015 11:38:00 GMT"), result.Value.Now);
        });

        [Test]
        public Task PutComplexPrimitiveDateTimeRfc1123() => TestStatus(async (host, pipeline) =>
        {
            var value = new Datetimerfc1123Wrapper
            {
                Field = DateTimeOffset.Parse("Mon, 01 Jan 0001 00:00:00 GMT"),
                Now = DateTimeOffset.Parse("Mon, 18 May 2015 11:38:00 GMT")
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutDateTimeRfc1123Async( value);
        });

        [Test]
        public Task GetComplexPrimitiveDuration() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetDurationAsync();
            Assert.AreEqual(XmlConvert.ToTimeSpan("P123DT22H14M12.011S"), result.Value.Field);
        });

        [Test]
        public Task PutComplexPrimitiveDuration() => TestStatus(async (host, pipeline) =>
        {
            var value = new DurationWrapper
            {
                Field = XmlConvert.ToTimeSpan("P123DT22H14M12.011S")
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutDurationAsync( value);
        });

        [Test]
        public Task GetComplexPrimitiveByte() => Test(async (host, pipeline) =>
        {
            var result = await new PrimitiveClient(ClientDiagnostics, pipeline, host).GetByteAsync();
            var content = new byte[] { 0xFF, 0xFE, 0xFD, 0xFC, 0x00, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6 };
            Assert.AreEqual(content, result.Value.Field);
        });

        [Test]
        public Task PutComplexPrimitiveByte() => TestStatus(async (host, pipeline) =>
        {
            var content = new byte[] { 0xFF, 0xFE, 0xFD, 0xFC, 0x00, 0xFA, 0xF9, 0xF8, 0xF7, 0xF6 };
            var value = new ByteWrapper
            {
                Field = content
            };
            return await new PrimitiveClient(ClientDiagnostics, pipeline, host).PutByteAsync( value);
        });

        [Test]
        public Task GetComplexArrayValid() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetValidAsync();
            var content = new[] { "1, 2, 3, 4", string.Empty, null, "&S#$(*Y", "The quick brown fox jumps over the lazy dog" };
            Assert.AreEqual(content, result.Value.Array);
        });

        [Test]
        public Task PutComplexArrayValid() => TestStatus(async (host, pipeline) =>
        {
            var value = new ArrayWrapper()
            {
                Array = { "1, 2, 3, 4", string.Empty, null, "&S#$(*Y", "The quick brown fox jumps over the lazy dog" }
            };
            return await new ArrayClient(ClientDiagnostics, pipeline, host).PutValidAsync( value);
        });

        [Test]
        public Task GetComplexArrayEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetEmptyAsync();
            Assert.AreEqual(Array.Empty<string>(), result.Value.Array);
        });

        [Test]
        public Task PutComplexArrayEmpty() => TestStatus(async (host, pipeline) =>
        {
            var value = new ArrayWrapper();
            value.Array.Clear();
            return await new ArrayClient(ClientDiagnostics, pipeline, host).PutEmptyAsync( value);
        });

        [Test]
        public Task GetComplexArrayNotProvided() => Test(async (host, pipeline) =>
        {
            var result = await new ArrayClient(ClientDiagnostics, pipeline, host).GetNotProvidedAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.NotNull(result.Value.Array);
        });

        [Test]
        public Task GetComplexDictionaryValid() => Test(async (host, pipeline) =>
        {
            var result = await new DictionaryClient(ClientDiagnostics, pipeline, host).GetValidAsync();
            var content = new Dictionary<string, string?>
            {
                { "txt", "notepad" },
                { "bmp", "mspaint" },
                { "xls", "excel" },
                { "exe", string.Empty },
                { string.Empty, null }
            };
            Assert.AreEqual(content, result.Value.DefaultProgram);
        });

        [Test]
        public Task PutComplexDictionaryValid() => TestStatus(async (host, pipeline) =>
        {
            var value = new DictionaryWrapper()
            {
                DefaultProgram =
                {
                    { "txt", "notepad" },
                    { "bmp", "mspaint" },
                    { "xls", "excel" },
                    { "exe", string.Empty },
                    { string.Empty, null }
                }
            };
            return await new DictionaryClient(ClientDiagnostics, pipeline, host).PutValidAsync( value);
        });

        [Test]
        public Task GetComplexDictionaryEmpty() => Test(async (host, pipeline) =>
        {
            var result = await new DictionaryClient(ClientDiagnostics, pipeline, host).GetEmptyAsync();
            Assert.AreEqual(new Dictionary<string, string?>(), result.Value.DefaultProgram);
        });

        [Test]
        public Task PutComplexDictionaryEmpty() => TestStatus(async (host, pipeline) =>
        {
            var value = new DictionaryWrapper();
            value.DefaultProgram.Clear();

            return await new DictionaryClient(ClientDiagnostics, pipeline, host).PutEmptyAsync( value);
        });

        [Test]
        public Task GetComplexDictionaryNull() => Test(async (host, pipeline) =>
        {
            var result = await new DictionaryClient(ClientDiagnostics, pipeline, host).GetNullAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            // the DefaultProgram should be undefined here
            Assert.IsNotNull(result.Value.DefaultProgram);
            Assert.IsFalse(!(result.Value.DefaultProgram is ChangeTrackingDictionary<string, string> changeTrackingDictionary && changeTrackingDictionary.IsUndefined));
        });

        [Test]
        public Task GetComplexDictionaryNotProvided() => Test(async (host, pipeline) =>
        {
            var result = await new DictionaryClient(ClientDiagnostics, pipeline, host).GetNotProvidedAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            CollectionAssert.IsEmpty(result.Value.DefaultProgram);
        });

        [Test]
        public Task GetComplexInheritanceValid() => Test(async (host, pipeline) =>
        {
            var result = await new InheritanceClient(ClientDiagnostics, pipeline, host).GetValidAsync();
            Assert.AreEqual("persian", result.Value.Breed);
            Assert.AreEqual("green", result.Value.Color);
            var hates = result.Value.Hates.ToArray();

            Assert.AreEqual("tomato", hates[0].Food);
            Assert.AreEqual(1, hates[0].Id);
            Assert.AreEqual("Potato", hates[0].Name);

            Assert.AreEqual("french fries", hates[1].Food);
            Assert.AreEqual(-1, hates[1].Id);
            Assert.AreEqual("Tomato", hates[1].Name);

            Assert.AreEqual(2, result.Value.Id);
            Assert.AreEqual("Siameeee", result.Value.Name);
        });

        [Test]
        public Task PutComplexInheritanceValid() => TestStatus(async (host, pipeline) =>
        {
            var value = new Siamese
            {
                Breed = "persian",
                Color = "green",
                Hates =
                {
                    new Dog()
                    {
                        Food = "tomato",
                        Id = 1,
                        Name = "Potato"
                    },
                    new Dog()
                    {
                        Food = "french fries",
                        Id = -1,
                        Name = "Tomato"
                    },
                },
                Id = 2,
                Name = "Siameeee"
            };
            return await new InheritanceClient(ClientDiagnostics, pipeline, host).PutValidAsync( value);
        });

        [Test]
        public Task PutComplexInheritanceValid_Sync() => TestStatus((host, pipeline) =>
        {
            var value = new Siamese
            {
                Breed = "persian",
                Color = "green",
                Hates =
                {
                    new Dog()
                    {
                        Food = "tomato",
                        Id = 1,
                        Name = "Potato"
                    },
                    new Dog()
                    {
                        Food = "french fries",
                        Id = -1,
                        Name = "Tomato"
                    },
                },
                Id = 2,
                Name = "Siameeee"
            };
            return new InheritanceClient(ClientDiagnostics, pipeline, host).PutValid(value);
        });

        [Test]
        public Task GetComplexPolymorphismValid() => Test(async (host, pipeline) =>
        {
            var result = await new PolymorphismClient(ClientDiagnostics, pipeline, host).GetValidAsync();

            var value = (Salmon)result.Value;
            Assert.AreEqual("salmon", value.Fishtype);
            Assert.AreEqual("alaska", value.Location);
            Assert.AreEqual("king", value.Species);
            Assert.AreEqual(true, value.Iswild);
            Assert.AreEqual(1, value.Length);

            var siblings = value.Siblings.ToArray();

            var shark = (Shark)siblings[0];
            Assert.AreEqual("shark", shark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2012-01-05T01:00:00Z"), shark.Birthday);
            Assert.AreEqual("predator", shark.Species);
            Assert.AreEqual(6, shark.Age);
            Assert.AreEqual(20, shark.Length);

            var sawshark = (Sawshark)siblings[1];
            Assert.AreEqual("sawshark", sawshark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("1900-01-05T01:00:00Z"), sawshark.Birthday);
            Assert.AreEqual("dangerous", sawshark.Species);
            Assert.AreEqual(105, sawshark.Age);
            Assert.AreEqual(10, sawshark.Length);

            var goblin = (Goblinshark)siblings[2];
            Assert.AreEqual("goblin", goblin.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2015-08-08T00:00:00Z"), goblin.Birthday);
            Assert.AreEqual("scary", goblin.Species);
            Assert.AreEqual(1, goblin.Age);
            Assert.AreEqual(30, goblin.Length);
            Assert.AreEqual(5, goblin.Jawsize);
            Assert.AreEqual("pinkish-gray", goblin.Color.ToString());
        });

        [Test]
        public Task PutComplexPolymorphismValid() => TestStatus(async (host, pipeline) =>
        {
            var value = new Salmon(1)
            {
                Location = "alaska",
                Iswild = true,
                Species = "king",
                Siblings =
                {
                    new Shark(20, DateTimeOffset.Parse("2012-01-05T01:00:00Z"))
                    {
                        Age = 6,
                        Species = "predator"
                    },
                    new Sawshark(10, DateTimeOffset.Parse("1900-01-05T01:00:00Z"))
                    {
                        Age = 105,
                        Picture = new byte[] {255, 255, 255, 255, 254},
                        Species = "dangerous"
                    },
                    new Goblinshark(30, DateTimeOffset.Parse("2015-08-08T00:00:00Z"))
                    {
                        Age = 1,
                        Species = "scary",
                        Jawsize = 5,
                        Color = "pinkish-gray"
                    }
                }
            };
            return await new PolymorphismClient(ClientDiagnostics, pipeline, host).PutValidAsync( value);
        });

        [Test]
        public Task GetComplexPolymorphismComplicated() => Test(async (host, pipeline) =>
        {
            var result = await new PolymorphismClient(ClientDiagnostics, pipeline, host).GetComplicatedAsync();

            var value = (SmartSalmon)result.Value;
            Assert.AreEqual("smart_salmon", value.Fishtype);
            Assert.AreEqual("alaska", value.Location);
            Assert.AreEqual("king", value.Species);
            Assert.AreEqual(true, value.Iswild);
            Assert.AreEqual(1, value.Length);

            var siblings = value.Siblings.ToArray();

            var shark = (Shark)siblings[0];
            Assert.AreEqual("shark", shark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2012-01-05T01:00:00Z"), shark.Birthday);
            Assert.AreEqual("predator", shark.Species);
            Assert.AreEqual(6, shark.Age);
            Assert.AreEqual(20, shark.Length);

            var sawshark = (Sawshark)siblings[1];
            Assert.AreEqual("sawshark", sawshark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("1900-01-05T01:00:00Z"), sawshark.Birthday);
            Assert.AreEqual("dangerous", sawshark.Species);
            Assert.AreEqual(105, sawshark.Age);
            Assert.AreEqual(10, sawshark.Length);

            var goblin = (Goblinshark)siblings[2];
            Assert.AreEqual("goblin", goblin.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2015-08-08T00:00:00Z"), goblin.Birthday);
            Assert.AreEqual("scary", goblin.Species);
            Assert.AreEqual(1, goblin.Age);
            Assert.AreEqual(30, goblin.Length);
            Assert.AreEqual(5, goblin.Jawsize);
            Assert.AreEqual("pinkish-gray", goblin.Color.ToString());

            Assert.AreEqual(1, value.AdditionalProperties["additionalProperty1"]);
            Assert.AreEqual(false, value.AdditionalProperties["additionalProperty2"]);
            Assert.AreEqual("hello", value.AdditionalProperties["additionalProperty3"]);
            Assert.AreEqual(new Dictionary<string, object>()
            {
                {"a", 1},
                {"b", 2 }
            }, value.AdditionalProperties["additionalProperty4"]);

            Assert.AreEqual(new object[] { 1, 3 }, value.AdditionalProperties["additionalProperty5"]);
        });

        [Test]
        public Task PutComplexPolymorphismComplicated() => TestStatus(async (host, pipeline) =>
        {
            var value = new SmartSalmon(1)
            {
                Location = "alaska",
                Iswild = true,
                Species = "king",
                Siblings =
                {
                    new Shark(20, DateTimeOffset.Parse("2012-01-05T01:00:00Z"))
                    {
                        Age = 6,
                        Species = "predator"
                    },
                    new Sawshark(10, DateTimeOffset.Parse("1900-01-05T01:00:00Z"))
                    {
                        Age = 105,
                        Picture = new byte[] {255, 255, 255, 255, 254},
                        Species = "dangerous"
                    },
                    new Goblinshark(30, DateTimeOffset.Parse("2015-08-08T00:00:00Z"))
                    {
                        Age = 1,
                        Species = "scary",
                        Jawsize = 5,
                        Color = "pinkish-gray"
                    }
                }
            };
            value.AdditionalProperties["additionalProperty1"] = 1;
            value.AdditionalProperties["additionalProperty2"] = false;
            value.AdditionalProperties["additionalProperty3"] = "hello";
            value.AdditionalProperties["additionalProperty4"] = new Dictionary<string, object>() {{"a", 1}, {"b", 2}};
            value.AdditionalProperties["additionalProperty5"] = new object[] {1, 3};

            return await new PolymorphismClient(ClientDiagnostics, pipeline, host).PutComplicatedAsync( value);
        });

        [Test]
        public Task PutComplexPolymorphismNoDiscriminator() => TestStatus(async (host, pipeline) =>
        {
            var value = new Salmon(1)
            {
                Location = "alaska",
                Iswild = true,
                Species = "king",
                Siblings =
                {
                    new Shark(20, DateTimeOffset.Parse("2012-01-05T01:00:00Z"))
                    {
                        Age = 6,
                        Species = "predator"
                    },
                    new Sawshark(10, DateTimeOffset.Parse("1900-01-05T01:00:00Z"))
                    {
                        Age = 105,
                        Picture = new byte[] {255, 255, 255, 255, 254},
                        Species = "dangerous"
                    },
                    new Goblinshark(30, DateTimeOffset.Parse("2015-08-08T00:00:00Z"))
                    {
                        Age = 1,
                        Species = "scary",
                        Jawsize = 5,
                        Color = "pinkish-gray"
                    }
                }
            };

            var result = await new PolymorphismClient(ClientDiagnostics, pipeline, host).PutMissingDiscriminatorAsync( value);

            value = result.Value;
            Assert.AreEqual("salmon", value.Fishtype);
            Assert.AreEqual("alaska", value.Location);
            Assert.AreEqual("king", value.Species);
            Assert.AreEqual(true, value.Iswild);
            Assert.AreEqual(1, value.Length);

            var siblings = value.Siblings.ToArray();

            var shark = (Shark)siblings[0];
            Assert.AreEqual("shark", shark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2012-01-05T01:00:00Z"), shark.Birthday);
            Assert.AreEqual("predator", shark.Species);
            Assert.AreEqual(6, shark.Age);
            Assert.AreEqual(20, shark.Length);
            CollectionAssert.IsEmpty(shark.Siblings);

            var sawshark = (Sawshark)siblings[1];
            Assert.AreEqual("sawshark", sawshark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("1900-01-05T01:00:00Z"), sawshark.Birthday);
            Assert.AreEqual("dangerous", sawshark.Species);
            Assert.AreEqual(105, sawshark.Age);
            Assert.AreEqual(10, sawshark.Length);
            CollectionAssert.IsEmpty(sawshark.Siblings);

            var goblin = (Goblinshark)siblings[2];
            Assert.AreEqual("goblin", goblin.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2015-08-08T00:00:00Z"), goblin.Birthday);
            Assert.AreEqual("scary", goblin.Species);
            Assert.AreEqual(1, goblin.Age);
            Assert.AreEqual(30, goblin.Length);
            Assert.AreEqual(5, goblin.Jawsize);
            Assert.AreEqual("pinkish-gray", goblin.Color.ToString());
            CollectionAssert.IsEmpty(goblin.Siblings);

            return result.GetRawResponse();
        });

        [Test]
        public Task GetComplexPolymorphismDotSyntax() => Test(async (host, pipeline) =>
        {
            var result = await new PolymorphismClient(ClientDiagnostics, pipeline, host).GetDotSyntaxAsync();

            var dotSalmon = (DotSalmon)result.Value;
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("sweden", dotSalmon.Location);
            Assert.AreEqual(true, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);
        });

        [Test]
        public Task GetComplexPolymorphismDotSyntax_Sync() => Test((host, pipeline) =>
        {
            var result = new PolymorphismClient(ClientDiagnostics, pipeline, host).GetDotSyntax();

            var dotSalmon = (DotSalmon)result.Value;
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("sweden", dotSalmon.Location);
            Assert.AreEqual(true, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);
        });

        [Test]
        public Task GetComposedWithDiscriminator() => Test(async (host, pipeline) =>
        {
            var result = await new PolymorphismClient(ClientDiagnostics, pipeline, host).GetComposedWithDiscriminatorAsync();

            var dotSalmon = result.Value.SampleSalmon;
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("sweden", dotSalmon.Location);
            Assert.AreEqual(false, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            var salmons = result.Value.Salmons.ToArray();

            dotSalmon = salmons[0];
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("sweden", dotSalmon.Location);
            Assert.AreEqual(false, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            dotSalmon = salmons[1];
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("atlantic", dotSalmon.Location);
            Assert.AreEqual(true, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            dotSalmon = (DotSalmon) result.Value.SampleFish;
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("australia", dotSalmon.Location);
            Assert.AreEqual(false, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            var fishes = result.Value.Fishes.ToArray();

            dotSalmon = (DotSalmon) fishes[0];
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("australia", dotSalmon.Location);
            Assert.AreEqual(false, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            dotSalmon = (DotSalmon) fishes[1];
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("canada", dotSalmon.Location);
            Assert.AreEqual(true, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);
        });

        [Test]
        public Task GetComposedWithoutDiscriminator() => Test(async (host, pipeline) =>
        {
            var result = await new PolymorphismClient(ClientDiagnostics, pipeline, host).GetComposedWithoutDiscriminatorAsync();

            var dotSalmon = result.Value.SampleSalmon;
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("sweden", dotSalmon.Location);
            Assert.AreEqual(false, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            var salmons = result.Value.Salmons.ToArray();

            dotSalmon = salmons[0];
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("sweden", dotSalmon.Location);
            Assert.AreEqual(false, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            dotSalmon = salmons[1];
            Assert.AreEqual("DotSalmon", dotSalmon.FishType);
            Assert.AreEqual("atlantic", dotSalmon.Location);
            Assert.AreEqual(true, dotSalmon.Iswild);
            Assert.AreEqual("king", dotSalmon.Species);

            var dotFish = result.Value.SampleFish;
            Assert.AreEqual("Unknown", dotFish.FishType);
            Assert.AreEqual("king", dotFish.Species);

            var fishes = result.Value.Fishes.ToArray();

            dotFish = fishes[0];
            Assert.AreEqual("Unknown", dotFish.FishType);
            Assert.AreEqual("king", dotFish.Species);

            dotFish = fishes[1];
            Assert.AreEqual("Unknown", dotFish.FishType);
            Assert.AreEqual("king", dotFish.Species);
        });

        [Test]
        public Task GetComplexPolymorphicRecursiveValid() => Test(async (host, pipeline) =>
        {
            var result = await new PolymorphicrecursiveClient(ClientDiagnostics, pipeline, host).GetValidAsync();
            var value = (Salmon)result.Value;
            Assert.AreEqual("salmon", value.Fishtype);
            Assert.AreEqual("alaska", value.Location);
            Assert.AreEqual("king", value.Species);
            Assert.AreEqual(true, value.Iswild);
            Assert.AreEqual(1, value.Length);

            var siblings = value.Siblings.ToArray();

            var shark = (Shark)siblings[0];
            Assert.AreEqual("shark", shark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2012-01-05T01:00:00Z"), shark.Birthday);
            Assert.AreEqual("predator", shark.Species);
            Assert.AreEqual(6, shark.Age);
            Assert.AreEqual(20, shark.Length);

            var sharkSiblings = shark.Siblings.ToArray();

            var innerSalmon = (Salmon)sharkSiblings[0];
            Assert.AreEqual("salmon", innerSalmon.Fishtype);
            Assert.AreEqual("atlantic", innerSalmon.Location);
            Assert.AreEqual("coho", innerSalmon.Species);
            Assert.AreEqual(true, innerSalmon.Iswild);
            Assert.AreEqual(2, innerSalmon.Length);

            var innerSalmonSiblings = innerSalmon.Siblings.ToArray();

            var innerInnerShark = (Shark)innerSalmonSiblings[0];
            Assert.AreEqual("shark", innerInnerShark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("2012-01-05T01:00:00Z"), innerInnerShark.Birthday);
            Assert.AreEqual("predator", innerInnerShark.Species);
            Assert.AreEqual(6, innerInnerShark.Age);
            Assert.AreEqual(20, innerInnerShark.Length);
            CollectionAssert.IsEmpty(innerInnerShark.Siblings);

            var innerInnerSawshark = (Sawshark)innerSalmonSiblings[1];
            Assert.AreEqual("sawshark", innerInnerSawshark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("1900-01-05T01:00:00Z"), innerInnerSawshark.Birthday);
            Assert.AreEqual("dangerous", innerInnerSawshark.Species);
            Assert.AreEqual(105, innerInnerSawshark.Age);
            Assert.AreEqual(10, innerInnerSawshark.Length);
            CollectionAssert.IsEmpty(innerInnerSawshark.Siblings);


            var innerSawshark = (Sawshark)sharkSiblings[1];
            Assert.AreEqual("sawshark", innerSawshark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("1900-01-05T01:00:00Z"), innerSawshark.Birthday);
            Assert.AreEqual("dangerous", innerSawshark.Species);
            Assert.AreEqual(105, innerSawshark.Age);
            Assert.AreEqual(10, innerSawshark.Length);
            CollectionAssert.IsEmpty(innerSawshark.Siblings);

            var sawshark = (Sawshark)siblings[1];
            Assert.AreEqual("sawshark", sawshark.Fishtype);
            Assert.AreEqual(DateTimeOffset.Parse("1900-01-05T01:00:00Z"), sawshark.Birthday);
            Assert.AreEqual("dangerous", sawshark.Species);
            Assert.AreEqual(105, sawshark.Age);
            Assert.AreEqual(10, sawshark.Length);
            CollectionAssert.IsEmpty(sawshark.Siblings);
        });

        [Test]
        public Task PutComplexPolymorphicRecursiveValid() => TestStatus(async (host, pipeline) =>
        {
            var sawshark = new Sawshark(10, DateTimeOffset.Parse("1900-01-05T01:00:00Z"))
            {
                Age = 105,
                Picture = new byte[] {255, 255, 255, 255, 254},
                Species = "dangerous"
            };
            sawshark.Siblings.Clear();

            var value = new Salmon(1)
            {
                Location = "alaska",
                Iswild = true,
                Species = "king",
                Siblings =
                {
                    new Shark(20, DateTimeOffset.Parse("2012-01-05T01:00:00Z"))
                    {
                        Age = 6,
                        Species = "predator",
                        Siblings =
                        {
                            new Salmon(2)
                            {
                                Location = "atlantic",
                                Iswild = true,
                                Species = "coho",
                                Siblings =
                                {
                                    new Shark(20, DateTimeOffset.Parse("2012-01-05T01:00:00Z"))
                                    {
                                        Age = 6,
                                        Species = "predator",
                                    },
                                    new Sawshark(10, DateTimeOffset.Parse("1900-01-05T01:00:00Z"))
                                    {
                                        Age = 105,
                                        Picture = new byte[] {255, 255, 255, 255, 254},
                                        Species = "dangerous"
                                    }
                                }
                            },

                            sawshark
                        }
                    },
                    sawshark,
                }
            };
            return await new PolymorphicrecursiveClient(ClientDiagnostics, pipeline, host).PutValidAsync( value);
        });

        [Test]
        public Task GetComplexReadOnlyPropertyValid() => Test(async (host, pipeline) =>
        {
            var result = await new ReadonlypropertyClient(ClientDiagnostics, pipeline, host).GetValidAsync();
            Assert.AreEqual("1234", result.Value.Id);
            Assert.AreEqual(2, result.Value.Size);
        }, true);

        [Test]
        public Task PutComplexReadOnlyPropertyValid() => TestStatus(async (host, pipeline) =>
        {
            var value = new ReadonlyObj();
            return await new ReadonlypropertyClient(ClientDiagnostics, pipeline, host).PutValidAsync( value);
        });

        [Test]
        public void EnumGeneratedAsExtensibleWithCorrectName()
        {
            // Name directive
            Assert.AreEqual("CMYKColors", typeof(CMYKColors).Name);
            // modelAsString
            Assert.True(typeof(CMYKColors).IsValueType);
            Assert.False(typeof(CMYKColors).IsEnum);
        }

        [Test]
        public void OptionalCollectionsAreNotNullByDefault()
        {
            var arrayWrapper = new ArrayWrapper();
            Assert.NotNull(arrayWrapper.Array);
        }

        [Test]
        public void OptionalDictionariesAreNotNullByDefault()
        {
            var dictionaryWrapper = new DictionaryWrapper();
            Assert.NotNull(dictionaryWrapper.DefaultProgram);
        }

        [Test]
        public void ReadonlyPropertiesAreGetOnly()
        {
            Assert.Null(typeof(ReadonlyObj).GetProperty(nameof(ReadonlyObj.Id)).SetMethod);
        }

        [Test]
        public void PolymorphicModelsDiscriminatorValueSet()
        {
            var shark = new Shark(default, default);
            Assert.AreEqual("shark" ,shark.Fishtype);
        }

        [Test]
        public void DiscriminatorPropertiesAreInternal()
        {
            var prop = TypeAsserts.HasProperty(typeof(Shark), nameof(Shark.Fishtype), BindingFlags.Instance | BindingFlags.NonPublic);
            Assert.NotNull(prop.SetMethod);
        }

        [Test]
        public void OutputSchemaPropertiesReadonly()
        {
            Assert.Null(typeof(DotSalmon).GetProperty(nameof(DotSalmon.Species)).SetMethod);
        }

        [Test]
        public void InputSchemaCtorIsPublic()
        {
            Assert.NotNull(typeof(Shark)
                .GetConstructors(BindingFlags.Instance | BindingFlags.Public)
                .SingleOrDefault(c => c.GetParameters().Length == 2));
        }

        [Test]
        public void InputSchemasHaveOneCtor()
        {
            Assert.AreEqual(1, typeof(Shark)
                .GetConstructors(BindingFlags.Instance | BindingFlags.Public)
                .Length);
        }

        [Test]
        public void OutputSchemaCtorIsInternal()
        {
            Assert.NotNull(typeof(DotSalmon)
                .GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)
                .SingleOrDefault(c => c.GetParameters().Length == 0));
        }

        //https://stackoverflow.com/questions/4971213/how-to-use-reflection-to-determine-if-a-class-is-internal/
        private static bool IsInternal(Type t) => !t.IsVisible
           && !t.IsPublic
           && t.IsNotPublic
           && !t.IsNested
           && !t.IsNestedPublic
           && !t.IsNestedFamily
           && !t.IsNestedPrivate
           && !t.IsNestedAssembly
           && !t.IsNestedFamORAssem
           && !t.IsNestedFamANDAssem;

        [Test]
        public void ExceptionSchemaIsInternal()
        {
            Assert.True(IsInternal(typeof(Error)));
        }

        [Test]
        public void ExceptionSchemaPropertiesReadonly()
        {
            Assert.Null(typeof(Error).GetProperty(nameof(Error.Message)).SetMethod);
        }

        [Test]
        public void ExceptionSchemaHasDeserializer()
        {
            Assert.NotNull(typeof(Error).GetMethods(BindingFlags.Static | BindingFlags.NonPublic).Single(mi => mi.Name == "DeserializeError"));
        }

        [Test]
        public void InitializeAdditionalPropertiesDuringDeserialization()
        {
            SmartSalmon model = SmartSalmon.DeserializeSmartSalmon(JsonDocument.Parse("{}").RootElement);
            Assert.AreEqual(new Dictionary<string, object>(), model.AdditionalProperties);
        }
    }
}
