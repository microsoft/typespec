// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using xml_service;
using xml_service.Models;

namespace AutoRest.TestServer.Tests
{
    public class XmlTests : TestServerTestBase
    {
        [Test]
        public Task JsonInputInXMLSwagger() => TestStatus(async (host, pipeline) =>
        {
            return await new XmlClient(ClientDiagnostics, pipeline, host).JsonInputAsync(new JsonInput()
            {
                Id = 42
            });
        });

        [Test]
        public Task JsonOutputInXMLSwagger() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).JsonOutputAsync();
            Assert.AreEqual(42, result.Value.Id);
        });

        [Test]
        public Task GetWithXMsText() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetXMsTextAsync();
            Assert.AreEqual("I am text", result.Value.Content);
            Assert.AreEqual("english", result.Value.Language);
        });

        [Test]
        public Task PutSimpleXML() => TestStatus(async (host, pipeline) =>
        {
            var slideshow = new Slideshow
            {
                Author = "Yours Truly",
                Date = "Date of publication",
                Title = "Sample Slide Show",
                Slides =
                {
                    new Slide()
                    {
                        Title = "Wake up to WonderWidgets!",
                        Type = "all"
                    },
                    new Slide()
                    {
                        Title = "Overview",
                        Type = "all",
                        Items =
                        {
                            "Why WonderWidgets are great",
                            "",
                            "Who buys WonderWidgets"
                        }
                    }
                }
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutSimpleAsync(slideshow);
        });

        [Test]
        public Task GetSimpleXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetSimpleAsync();
            var value = result.Value;

            Assert.AreEqual("Yours Truly", value.Author);
            Assert.AreEqual("Date of publication", value.Date);
            Assert.AreEqual("Sample Slide Show", value.Title);

            var slides = value.Slides.ToArray();
            Assert.AreEqual(2, slides.Length);

            Assert.AreEqual("Wake up to WonderWidgets!", slides[0].Title);
            Assert.AreEqual("all", slides[0].Type);
            Assert.AreEqual(0, slides[0].Items.Count);

            Assert.AreEqual("Overview", slides[1].Title);
            Assert.AreEqual("all", slides[1].Type);

            var items = slides[1].Items.ToArray();
            Assert.AreEqual("Why WonderWidgets are great", items[0]);
            Assert.AreEqual("", items[1]);
            Assert.AreEqual("Who buys WonderWidgets", items[2]);
        });


        [Test]
        public Task PutRootWithRefAndNoMetaXML() => TestStatus(async (host, pipeline) =>
        {
            var root = new RootWithRefAndNoMeta
            {
                Something = "else",
                RefToModel = new ComplexTypeNoMeta()
                {
                    ID = "myid"
                }
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutComplexTypeRefNoMetaAsync(root);
        });


        [Test]
        public Task PutRootWithRefAndNoMetaXML_Sync() => TestStatus((host, pipeline) =>
        {
            var root = new RootWithRefAndNoMeta
            {
                Something = "else",
                RefToModel = new ComplexTypeNoMeta()
                {
                    ID = "myid"
                }
            };

            return new XmlClient(ClientDiagnostics, pipeline, host).PutComplexTypeRefNoMeta(root);
        });

        [Test]
        public Task GetRootWithRefAndNoMetaXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetComplexTypeRefNoMetaAsync();
            var value = result.Value;

            Assert.AreEqual("else", value.Something);
            Assert.AreEqual("myid", value.RefToModel.ID);
        });

        [Test]
        public Task GetRootWithRefAndNoMetaXML_Sync() => Test((host, pipeline) =>
        {
            var result = new XmlClient(ClientDiagnostics, pipeline, host).GetComplexTypeRefNoMeta();
            var value = result.Value;

            Assert.AreEqual("else", value.Something);
            Assert.AreEqual("myid", value.RefToModel.ID);
        });

        [Test]
        public Task PutRootWithRefAndMetaXML() => TestStatus(async (host, pipeline) =>
        {
            var root = new RootWithRefAndMeta()
            {
                Something = "else",
                RefToModel = new ComplexTypeWithMeta()
                {
                    ID = "myid"
                }
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutComplexTypeRefWithMetaAsync(root);
        });

        [Test]
        public Task GetRootWithRefAndMetaXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetComplexTypeRefWithMetaAsync();
            var value = result.Value;

            Assert.AreEqual("else", value.Something);
            Assert.AreEqual("myid", value.RefToModel.ID);
        });

        [Test]
        public Task PutXMLListAtRootSingle() => TestStatus(async (host, pipeline) =>
        {
            var root = new[]
            {
                new Banana()
                {
                    Name = "Cavendish",
                    Flavor = "Sweet",
                    Expiration = DateTimeOffset.Parse("2018-02-28T00:40:00.123Z")
                }
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutRootListSingleItemAsync(root);
        });

        [Test]
        public Task GetXMLListAtRootSingle() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetRootListSingleItemAsync();
            var value = result.Value;
            var item = value.Single();

            Assert.AreEqual("Cavendish", item.Name);
            Assert.AreEqual("Sweet", item.Flavor);
            Assert.AreEqual(DateTimeOffset.Parse("2018-02-28T00:40:00.123Z"), item.Expiration);
        });

        [Test]
        public Task PutEmptyXMLList() => TestStatus(async (host, pipeline) =>
        {
            var root = new Slideshow
            {
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutEmptyListAsync(root);
        });

        [Test]
        public Task GetEmptyXMLList() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetEmptyListAsync();
            var value = result.Value;

            Assert.AreEqual(0, value.Slides.Count);
            Assert.Null(value.Date);
            Assert.Null(value.Author);
            Assert.Null(value.Title);
        });

        [Test]
        public Task PutXMLEmptyNode() => TestStatus(async (host, pipeline) =>
        {
            var root = new Banana()
            {
                Name = "Unknown Banana",
                Flavor = "",
                Expiration = DateTimeOffset.Parse("2012-02-24T00:53:52.789Z")
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutEmptyChildElementAsync(root);
        });

        [Test]
        public Task GetXMLEmptyNode() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetEmptyChildElementAsync();
            var value = result.Value;

            Assert.AreEqual("Unknown Banana", value.Name);
            Assert.AreEqual("", value.Flavor);
            Assert.AreEqual(DateTimeOffset.Parse("2012-02-24T00:53:52.789Z"), value.Expiration);
        });

        [Test]
        public Task PutWrappedXMLList() => TestStatus(async (host, pipeline) =>
        {
            var root = new AppleBarrel()
            {
                BadApples = { "Red Delicious" },
                GoodApples = { "Fuji", "Gala" }
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutWrappedListsAsync(root);
        });

        [Test]
        public Task GetWrappedXMLList() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetWrappedListsAsync();
            var value = result.Value;

            CollectionAssert.AreEqual(new[] { "Red Delicious" }, value.BadApples);
            CollectionAssert.AreEqual(new[] { "Fuji", "Gala" }, value.GoodApples);
        });

        [Test]
        public Task PutEmptyWrappedXMLList() => TestStatus(async (host, pipeline) =>
        {
            var root = new AppleBarrel();
            root.GoodApples.Clear();
            root.BadApples.Clear();

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutEmptyWrappedListsAsync(root);
        });

        [Test]
        public Task GetEmptyWrappedXMLList() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetEmptyWrappedListsAsync();
            var value = result.Value;

            CollectionAssert.AreEqual(Enumerable.Empty<string>(), value.BadApples);
            CollectionAssert.AreEqual(Enumerable.Empty<string>(), value.GoodApples);
        });

        [Test]
        public Task StoragePutContainerACLXML() => TestStatus(async (host, pipeline) =>
        {
            var root = new List<SignedIdentifier>()
            {
                new SignedIdentifier(
                    "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=",
                    new AccessPolicy(
                        DateTimeOffset.Parse("2009-09-28T08:49:37.123Z"),
                        DateTimeOffset.Parse("2009-09-29T08:49:37.123Z"),
                        "rwd"))
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutAclsAsync(root);
        });

        [Test]
        public Task StorageGetContainerACLXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetAclsAsync();
            var value = result.Value;

            Assert.AreEqual(1, value.Count);

            var acl = value.Single();

            Assert.AreEqual("MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=", acl.Id);
            Assert.AreEqual(DateTimeOffset.Parse("2009-09-28T08:49:37.123Z"), acl.AccessPolicy.Start);
            Assert.AreEqual("rwd", acl.AccessPolicy.Permission);
            Assert.AreEqual(DateTimeOffset.Parse("2009-09-29T08:49:37.123Z"), acl.AccessPolicy.Expiry);
        });

        [Test]
        public Task PutXMLListAtRoot() => TestStatus(async (host, pipeline) =>
        {
            var root = new List<Banana>()
            {
                new Banana()
                {
                    Name = "Cavendish",
                    Flavor = "Sweet",
                    Expiration = DateTimeOffset.Parse("2018-02-28T00:40:00.123Z")
                },
                new Banana()
                {
                    Name = "Plantain",
                    Flavor = "Savory",
                    Expiration = DateTimeOffset.Parse("2018-02-28T00:40:00.123Z")
                }
            };

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutRootListAsync(root);
        });

        [Test]
        public Task GetXMLListAtRoot() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetRootListAsync();
            var values = result.Value.ToArray();

            Assert.AreEqual(2, values.Length);

            Assert.AreEqual("Cavendish", values[0].Name);
            Assert.AreEqual("Sweet", values[0].Flavor);
            Assert.AreEqual(DateTimeOffset.Parse("2018-02-28T00:40:00.123Z"), values[0].Expiration);

            Assert.AreEqual("Plantain", values[1].Name);
            Assert.AreEqual("Savory", values[1].Flavor);
            Assert.AreEqual(DateTimeOffset.Parse("2018-02-28T00:40:00.123Z"), values[1].Expiration);
        });

        [Test]
        public Task PutEmptyXMLListAtRoot() => TestStatus(async (host, pipeline) =>
        {
            var root = new List<Banana>();

            return await new XmlClient(ClientDiagnostics, pipeline, host).PutEmptyRootListAsync(root);
        });

        [Test]
        public Task GetEmptyXMLListAtRoot() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetEmptyRootListAsync();
            var values = result.Value.ToArray();

            Assert.AreEqual(0, values.Length);
        });

        [Test]
        public Task StorageListContainersXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).ListContainersAsync();
            var value = result.Value;

            Assert.AreEqual("video", value.NextMarker);
            Assert.AreEqual("https://myaccount.blob.core.windows.net/", value.ServiceEndpoint);
            Assert.AreEqual(3, value.MaxResults);

            var containers = value.Containers.ToArray();

            Assert.AreEqual("audio", containers[0].Name);
            Assert.AreEqual("0x8CACB9BD7C6B1B2", containers[0].Properties.Etag);
            Assert.AreEqual(PublicAccessType.Container, containers[0].Properties.PublicAccess);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 26 Oct 2016 20:39:39 GMT"), containers[0].Properties.LastModified);

            Assert.AreEqual("images", containers[1].Name);
            Assert.AreEqual("0x8CACB9BD7C1EEEC", containers[1].Properties.Etag);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 26 Oct 2016 20:39:39 GMT"), containers[1].Properties.LastModified);

            Assert.AreEqual("textfiles", containers[2].Name);
            Assert.AreEqual("0x8CACB9BD7BACAC3", containers[2].Properties.Etag);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 26 Oct 2016 20:39:39 GMT"), containers[2].Properties.LastModified);
        });

        [Test]
        public Task GetHeadersAsync() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).RestClient.GetHeadersAsync();
            var value = result.Headers;

            Assert.AreEqual("custom-value", value.CustomHeader);
        }, true);

        [Test]
        public Task StorageListBlobsXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).ListBlobsAsync();
            var value = result.Value;

            Assert.AreEqual("https://myaccount.blob.core.windows.net/mycontainer", value.ContainerName);

            var blobs = value.Blobs.Blob.ToArray();

            Assert.AreEqual(5, blobs.Length);

            Assert.AreEqual("blob1.txt", blobs[0].Name);
            Assert.AreEqual(false, blobs[0].Deleted);

            Assert.AreEqual("0x8CBFF45D8A29A19", blobs[0].Properties.Etag);
            Assert.AreEqual("en-US", blobs[0].Properties.ContentLanguage);
            Assert.AreEqual(LeaseStatusType.Unlocked, blobs[0].Properties.LeaseStatus);
            Assert.AreEqual(BlobType.BlockBlob, blobs[0].Properties.BlobType);
            Assert.AreEqual("no-cache", blobs[0].Properties.CacheControl);
            Assert.AreEqual("text/html", blobs[0].Properties.ContentType);
            Assert.AreEqual(100, blobs[0].Properties.ContentLength);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 09 Sep 2009 09:20:02 GMT"), blobs[0].Properties.LastModified);


            Assert.AreEqual("blob2.txt", blobs[1].Name);
            Assert.AreEqual("2009-09-09T09:20:03.0427659Z", blobs[1].Snapshot);
            Assert.AreEqual(false, blobs[1].Deleted);

            Assert.AreEqual("0x8CBFF45D8B4C212", blobs[1].Properties.Etag);
            Assert.AreEqual("gzip", blobs[1].Properties.ContentEncoding);
            Assert.AreEqual(BlobType.BlockBlob, blobs[1].Properties.BlobType);
            Assert.AreEqual("application/octet-stream", blobs[1].Properties.ContentType);
            Assert.AreEqual(5000, blobs[1].Properties.ContentLength);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 09 Sep 2009 09:20:02 GMT"), blobs[1].Properties.LastModified);

            Assert.AreEqual("green", blobs[1].Metadata["Color"]);
            Assert.AreEqual("02", blobs[1].Metadata["BlobNumber"]);
            Assert.AreEqual("SomeMetadataValue", blobs[1].Metadata["SomeMetadataName"]);
            Assert.AreEqual("nasdf$@#$$", blobs[1].Metadata["x-ms-invalid-name"]);

            Assert.AreEqual("blob2.txt", blobs[2].Name);
            Assert.AreEqual("2009-09-09T09:20:03.1587543Z", blobs[2].Snapshot);
            Assert.AreEqual(false, blobs[2].Deleted);

            Assert.AreEqual("0x8CBFF45D8B4C212", blobs[2].Properties.Etag);
            Assert.AreEqual("gzip", blobs[2].Properties.ContentEncoding);
            Assert.AreEqual(BlobType.BlockBlob, blobs[2].Properties.BlobType);
            Assert.AreEqual("application/octet-stream", blobs[2].Properties.ContentType);
            Assert.AreEqual(5000, blobs[2].Properties.ContentLength);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 09 Sep 2009 09:20:02 GMT"), blobs[2].Properties.LastModified);

            Assert.AreEqual("green", blobs[2].Metadata["Color"]);
            Assert.AreEqual("02", blobs[2].Metadata["BlobNumber"]);
            Assert.AreEqual("SomeMetadataValue", blobs[2].Metadata["SomeMetadataName"]);


            Assert.AreEqual("blob2.txt", blobs[3].Name);
            Assert.AreEqual(false, blobs[3].Deleted);

            Assert.AreEqual("0x8CBFF45D8B4C212", blobs[3].Properties.Etag);
            Assert.AreEqual("gzip", blobs[3].Properties.ContentEncoding);
            Assert.AreEqual(BlobType.BlockBlob, blobs[3].Properties.BlobType);
            Assert.AreEqual("application/octet-stream", blobs[3].Properties.ContentType);
            Assert.AreEqual(5000, blobs[3].Properties.ContentLength);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 09 Sep 2009 09:20:02 GMT"), blobs[3].Properties.LastModified);

            Assert.AreEqual("green", blobs[3].Metadata["Color"]);
            Assert.AreEqual("02", blobs[3].Metadata["BlobNumber"]);
            Assert.AreEqual("SomeMetadataValue", blobs[3].Metadata["SomeMetadataName"]);

            Assert.AreEqual("blob3.txt", blobs[4].Name);
            Assert.AreEqual(false, blobs[4].Deleted);

            Assert.AreEqual("0x8CBFF45D911FADF", blobs[4].Properties.Etag);
            Assert.AreEqual(BlobType.PageBlob, blobs[4].Properties.BlobType);
            Assert.AreEqual("image/jpeg", blobs[4].Properties.ContentType);
            Assert.AreEqual(16384, blobs[4].Properties.ContentLength);
            Assert.AreEqual(LeaseStatusType.Locked, blobs[4].Properties.LeaseStatus);
            Assert.AreEqual(3, blobs[4].Properties.BlobSequenceNumber);
            Assert.AreEqual(DateTimeOffset.Parse("Wed, 09 Sep 2009 09:20:03 GMT"), blobs[4].Properties.LastModified);

            Assert.AreEqual("yellow", blobs[4].Metadata["Color"]);
            Assert.AreEqual("03", blobs[4].Metadata["BlobNumber"]);
            Assert.AreEqual("SomeMetadataValue", blobs[4].Metadata["SomeMetadataName"]);
        });

        [Test]
        public Task StoragePutServicePropertiesXML() => TestStatus(async (host, pipeline) =>
        {
            var properties = new StorageServiceProperties()
            {
                Logging = new Logging("1.0", true, false, true, new RetentionPolicy(true) { Days = 7 }),
                HourMetrics = new Metrics(true)
                {
                    Version = "1.0",
                    IncludeAPIs = false,
                    RetentionPolicy = new RetentionPolicy(true)
                    {
                        Days = 7,
                    }
                },
                MinuteMetrics = new Metrics(true)
                {
                    Version = "1.0",
                    IncludeAPIs = true,
                    RetentionPolicy = new RetentionPolicy(true)
                    {
                        Days = 7,
                    }
                }
            };
            return await new XmlClient(ClientDiagnostics, pipeline, host).PutServicePropertiesAsync(properties);
        });

        [Test]
        public Task StorageGetServicePropertiesXML() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetServicePropertiesAsync();
            var value = result.Value;

            Assert.AreEqual("1.0", value.Logging.Version);
            Assert.AreEqual(true, value.Logging.Delete);
            Assert.AreEqual(false, value.Logging.Read);
            Assert.AreEqual(true, value.Logging.Write);
            Assert.AreEqual(7, value.Logging.RetentionPolicy.Days);
            Assert.AreEqual(true, value.Logging.RetentionPolicy.Enabled);

            Assert.AreEqual("1.0", value.HourMetrics.Version);
            Assert.AreEqual(true, value.HourMetrics.Enabled);
            Assert.AreEqual(false, value.HourMetrics.IncludeAPIs);
            Assert.AreEqual(7, value.HourMetrics.RetentionPolicy.Days);
            Assert.AreEqual(true, value.HourMetrics.RetentionPolicy.Enabled);

            Assert.AreEqual("1.0", value.MinuteMetrics.Version);
            Assert.AreEqual(true, value.MinuteMetrics.Enabled);
            Assert.AreEqual(true, value.MinuteMetrics.IncludeAPIs);
            Assert.AreEqual(7, value.MinuteMetrics.RetentionPolicy.Days);
            Assert.AreEqual(true, value.MinuteMetrics.RetentionPolicy.Enabled);
        });

        [Test]
        public Task XmlGetBytes() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetBytesAsync();
            Assert.AreEqual(Encoding.UTF8.GetBytes("Hello world"), result.Value.Bytes);
        });

        [Test]
        public Task XmlPutBytes() => TestStatus(async (host, pipeline) =>
            await new XmlClient(ClientDiagnostics, pipeline, host).PutBinaryAsync(new ModelWithByteProperty()
            {
                Bytes = Encoding.UTF8.GetBytes("Hello world")
            }));

        [Test]
        public Task XmlGetUrl() => Test(async (host, pipeline) =>
        {
            var result = await new XmlClient(ClientDiagnostics, pipeline, host).GetUriAsync();
            Assert.AreEqual("https://myaccount.blob.core.windows.net/", result.Value.Url.ToString());
        });

        [Test]
        public Task XmlPutUrl() => TestStatus(async (host, pipeline) =>
            await new XmlClient(ClientDiagnostics, pipeline, host).PutUriAsync(new ModelWithUrlProperty()
            {
                Url = new Uri("https://myaccount.blob.core.windows.net/")
            }));
    }
}
