// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class IntegerCollectionTests
    {
        [Test]
        public Task Int16Collections(
            [Values("nested", "record-of-arrays", "array", "record", "nullable-array", "nullable-record")] string shape,
            [Values(false, true)] bool isAsync)
        {
            var handler = new CollectionHandler();
            var client = new Int16Collections(CreatePipeline(handler), new Uri("https://example.com"));
            return VerifyCollections<short>(handler, shape, [short.MinValue, 0, short.MaxValue], "-32768,0,32767", "32768",
                body => isAsync ? client.SendNestedAsync(body) : Task.FromResult(client.SendNested(body)),
                body => isAsync ? client.SendRecordAsync(body) : Task.FromResult(client.SendRecord(body)),
                () => isAsync ? client.GetArrayAsync() : Task.FromResult(client.GetArray()),
                () => isAsync ? client.GetRecordAsync() : Task.FromResult(client.GetRecord()),
                () => isAsync ? client.GetNullableArrayAsync() : Task.FromResult(client.GetNullableArray()),
                () => isAsync ? client.GetNullableRecordAsync() : Task.FromResult(client.GetNullableRecord()));
        }

        [Test]
        public Task UInt16Collections(
            [Values("nested", "record-of-arrays", "array", "record", "nullable-array", "nullable-record")] string shape,
            [Values(false, true)] bool isAsync)
        {
            var handler = new CollectionHandler();
            var client = new UInt16Collections(CreatePipeline(handler), new Uri("https://example.com"));
            return VerifyCollections<ushort>(handler, shape, [0, 1, ushort.MaxValue], "0,1,65535", "-1",
                body => isAsync ? client.SendNestedAsync(body) : Task.FromResult(client.SendNested(body)),
                body => isAsync ? client.SendRecordAsync(body) : Task.FromResult(client.SendRecord(body)),
                () => isAsync ? client.GetArrayAsync() : Task.FromResult(client.GetArray()),
                () => isAsync ? client.GetRecordAsync() : Task.FromResult(client.GetRecord()),
                () => isAsync ? client.GetNullableArrayAsync() : Task.FromResult(client.GetNullableArray()),
                () => isAsync ? client.GetNullableRecordAsync() : Task.FromResult(client.GetNullableRecord()));
        }

        [Test]
        public Task UInt32Collections(
            [Values("nested", "record-of-arrays", "array", "record", "nullable-array", "nullable-record")] string shape,
            [Values(false, true)] bool isAsync)
        {
            var handler = new CollectionHandler();
            var client = new UInt32Collections(CreatePipeline(handler), new Uri("https://example.com"));
            return VerifyCollections<uint>(handler, shape, [0, 1, uint.MaxValue], "0,1,4294967295", "-1",
                body => isAsync ? client.SendNestedAsync(body) : Task.FromResult(client.SendNested(body)),
                body => isAsync ? client.SendRecordAsync(body) : Task.FromResult(client.SendRecord(body)),
                () => isAsync ? client.GetArrayAsync() : Task.FromResult(client.GetArray()),
                () => isAsync ? client.GetRecordAsync() : Task.FromResult(client.GetRecord()),
                () => isAsync ? client.GetNullableArrayAsync() : Task.FromResult(client.GetNullableArray()),
                () => isAsync ? client.GetNullableRecordAsync() : Task.FromResult(client.GetNullableRecord()));
        }

        [Test]
        public Task UInt64Collections(
            [Values("nested", "record-of-arrays", "array", "record", "nullable-array", "nullable-record")] string shape,
            [Values(false, true)] bool isAsync)
        {
            var handler = new CollectionHandler();
            var client = new UInt64Collections(CreatePipeline(handler), new Uri("https://example.com"));
            return VerifyCollections<ulong>(handler, shape, [0, 1, ulong.MaxValue], "0,1,18446744073709551615", "-1",
                body => isAsync ? client.SendNestedAsync(body) : Task.FromResult(client.SendNested(body)),
                body => isAsync ? client.SendRecordAsync(body) : Task.FromResult(client.SendRecord(body)),
                () => isAsync ? client.GetArrayAsync() : Task.FromResult(client.GetArray()),
                () => isAsync ? client.GetRecordAsync() : Task.FromResult(client.GetRecord()),
                () => isAsync ? client.GetNullableArrayAsync() : Task.FromResult(client.GetNullableArray()),
                () => isAsync ? client.GetNullableRecordAsync() : Task.FromResult(client.GetNullableRecord()));
        }

        private static async Task VerifyCollections<T>(
            CollectionHandler handler, string shape, T[] values, string numbers, string invalidNumber,
            Func<IEnumerable<IList<T>>, Task<ClientResult>> sendNested,
            Func<IDictionary<string, IList<T>>, Task<ClientResult>> sendRecord,
            Func<Task<ClientResult<IReadOnlyList<T>>>> getArray,
            Func<Task<ClientResult<IReadOnlyDictionary<string, T>>>> getRecord,
            Func<Task<ClientResult<IReadOnlyList<T?>>>> getNullableArray,
            Func<Task<ClientResult<IReadOnlyDictionary<string, T?>>>> getNullableRecord) where T : struct
        {
            using (handler)
            {
                switch (shape)
                {
                    case "nested":
                        await sendNested([new List<T>(values), Array.Empty<T>()]);
                        Assert.AreEqual($"[[{numbers}],[]]", handler.RequestBody);
                        break;
                    case "record-of-arrays":
                        await sendRecord(new Dictionary<string, IList<T>> { ["numbers"] = values, ["empty"] = new List<T>() });
                        Assert.AreEqual($"{{\"numbers\":[{numbers}],\"empty\":[]}}", handler.RequestBody);
                        break;
                    case "array":
                        handler.ResponseBody = $"[{numbers}]";
                        CollectionAssert.AreEqual(values, (await getArray()).Value);
                        handler.ResponseBody = "[]";
                        Assert.IsEmpty((await getArray()).Value);
                        handler.ResponseBody = $"[{invalidNumber}]";
                        Assert.ThrowsAsync<FormatException>(async () => await getArray());
                        break;
                    case "record":
                        handler.ResponseBody = $"{{\"first\":{numbers.Split(',')[0]},\"last\":{numbers.Split(',')[2]}}}";
                        var record = (await getRecord()).Value;
                        Assert.AreEqual(2, record.Count);
                        Assert.AreEqual(values[0], record["first"]);
                        Assert.AreEqual(values[2], record["last"]);
                        handler.ResponseBody = "{}";
                        Assert.IsEmpty((await getRecord()).Value);
                        handler.ResponseBody = $"{{\"invalid\":{invalidNumber}}}";
                        Assert.ThrowsAsync<FormatException>(async () => await getRecord());
                        break;
                    case "nullable-array":
                        handler.ResponseBody = $"[null,{numbers},null]";
                        CollectionAssert.AreEqual(new T?[] { null }.Concat(values.Select(v => (T?)v)).Append(null), (await getNullableArray()).Value);
                        break;
                    case "nullable-record":
                        handler.ResponseBody = $"{{\"first\":{numbers.Split(',')[0]},\"missing\":null,\"last\":{numbers.Split(',')[2]}}}";
                        var nullableRecord = (await getNullableRecord()).Value;
                        Assert.AreEqual(3, nullableRecord.Count);
                        Assert.AreEqual(values[0], nullableRecord["first"]);
                        Assert.IsNull(nullableRecord["missing"]);
                        Assert.AreEqual(values[2], nullableRecord["last"]);
                        break;
                    default:
                        Assert.Fail($"Unexpected collection shape: {shape}");
                        break;
                }
            }
        }

        private static ClientPipeline CreatePipeline(CollectionHandler handler)
            => ClientPipeline.Create(new ClientPipelineOptions { Transport = new HttpClientPipelineTransport(new HttpClient(handler)) });

        private sealed class CollectionHandler : HttpMessageHandler
        {
            public string? RequestBody { get; private set; }
            public string ResponseBody { get; set; } = "{}";

            protected override HttpResponseMessage Send(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                RequestBody = request.Content?.ReadAsStringAsync(cancellationToken).GetAwaiter().GetResult();
                return new HttpResponseMessage(request.Method == HttpMethod.Post ? HttpStatusCode.NoContent : HttpStatusCode.OK)
                {
                    Content = new StringContent(ResponseBody, Encoding.UTF8, "application/json")
                };
            }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
                => Task.FromResult(Send(request, cancellationToken));
        }
    }
}
