// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using NUnit.Framework;
using paging;
using paging.Models;
using CustomPagingClient = custom_baseUrl_paging.PagingClient;

namespace AutoRest.TestServer.Tests
{
    public class PagingTests : TestServerTestBase
    {
        [Test]
        public Task PagingCustomUrlPartialNextLink() => Test(async (endpoint, pipeline) =>
        {
            var id = 1;
            var product = "Product";

            // host is not a full hostname for CustomPagingOperations; it is a partial host
            var host = endpoint.ToString().Replace("http://", String.Empty);
            var linkPart = "/paging/customurl/partialnextlink/page/";
            var result = await new CustomPagingClient(ClientDiagnostics, pipeline, host).RestClient.GetPagesPartialUrlAsync(string.Empty);
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new CustomPagingClient(ClientDiagnostics, pipeline, host).RestClient.GetPagesPartialUrlNextPageAsync(resultPage.ContinuationToken, string.Empty);
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            }
            Assert.AreEqual(2, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            var pageableAsync = new CustomPagingClient(ClientDiagnostics, pipeline, host).GetPagesPartialUrlAsync(string.Empty);
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
            }
            Assert.AreEqual(2, id);

            id = 1;
            var pageable = new CustomPagingClient(ClientDiagnostics, pipeline, host).GetPagesPartialUrl(string.Empty);
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
            }
            Assert.AreEqual(2, id);
        });

        [Test]
        public Task PagingCustomUrlPartialOperationNextLink() => Test(async (endpoint, pipeline) =>
        {
            var id = 1;
            var accountName = "";
            var product = "Product";
            // host is not a full hostname for CustomPagingOperations; it is a partial host
            var host = endpoint.ToString().Replace("http://", String.Empty);
            var linkPart = "partialnextlinkop/page/";
            var result = await new CustomPagingClient(ClientDiagnostics, pipeline, host).RestClient.GetPagesPartialUrlOperationAsync(accountName);
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new CustomPagingClient(ClientDiagnostics, pipeline, host).RestClient.GetPagesPartialUrlOperationNextAsync(accountName, resultPage.ContinuationToken);
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            }
            Assert.AreEqual(2, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            var pageableAsync = new CustomPagingClient(ClientDiagnostics, pipeline, host).GetPagesPartialUrlOperationAsync(accountName);
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
            }
            Assert.AreEqual(2, id);

            id = 1;
            var pageable = new CustomPagingClient(ClientDiagnostics, pipeline, host).GetPagesPartialUrlOperation(accountName);
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
            }
            Assert.AreEqual(2, id);
        });

        [Test]
        public Task PagingFragment() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "product";
            var tenant = "test_user";
            var linkPart = "next?page=";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesFragmentNextLinkAsync("1.6", tenant);
            var resultPage = Page.FromValues(result.Value.Values, result.Value.OdataNextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.NextFragmentAsync("1.6", tenant, resultPage.ContinuationToken);
                resultPage = Page.FromValues(result.Value.Values, result.Value.OdataNextLink, result.GetRawResponse());
            }
            Assert.AreEqual(10, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesFragmentNextLinkAsync("1.6", tenant);
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);

            id = 1;
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesFragmentNextLink("1.6", tenant);
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);
        });

        [Test]
        public Task PagingMultiple_Continuation() => Test(async (host, pipeline) =>
        {
            var client = new PagingClient(ClientDiagnostics, pipeline, host);
            var pages = client.GetMultiplePages().AsPages().ToArray();

            for (int i = 1; i < pages.Length; i++)
            {
                var expectedPages = pages.Skip(i).ToArray();
                var actualPages = client.GetMultiplePages().AsPages(pages[i - 1].ContinuationToken).ToArray();

                Assert.That(expectedPages, Is.EquivalentTo(actualPages).Using<Page<Product>>((p1, p2)=>
                    p1.Values.Count == p2.Values.Count && p1.ContinuationToken == p2.ContinuationToken));
            }

            for (int i = 1; i < pages.Length; i++)
            {
                var expectedPages = pages.Skip(i).ToArray();
                var actualPages = new List<Page<Product>>();
                await foreach (var page in client.GetMultiplePagesAsync().AsPages(pages[i - 1].ContinuationToken))
                {
                    actualPages.Add(page);
                }

                Assert.That(expectedPages, Is.EquivalentTo(actualPages).Using<Page<Product>>((p1, p2)=>
                    p1.Values.Count == p2.Values.Count && p1.ContinuationToken == p2.ContinuationToken));
            }
        }, ignoreScenario: true);

        [Test]
        public Task PagingMultiple() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/page/";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesAsync(null);
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesNextPageAsync(resultPage.ContinuationToken, null);
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
                product = "product";
            }
            Assert.AreEqual(10, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            product = "Product";
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesAsync(null);
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);

            id = 1;
            product = "Product";
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePages(null);
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);
        });

        [Test]
        public Task PagingMultipleWithQueryParameters() => Test(async (host, pipeline) =>
        {
            var value = 100;
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/nextOperationWithQueryParams";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetWithQueryParamsAsync(value);
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id++, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith(linkPart, resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.NextOperationWithQueryParamsAsync();
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            }
            Assert.AreEqual(2, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetWithQueryParamsAsync(value);
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith(linkPart, page.ContinuationToken);
                    id++;
                }
            }
            Assert.AreEqual(2, id);

            id = 1;
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetWithQueryParams(value);
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith(linkPart, page.ContinuationToken);
                    id++;
                }
            }
            Assert.AreEqual(2, id);
        });

        [Test]
        public Task PagingMultipleFailure() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/failure/page/";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesFailureAsync();
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());

            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
            StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
            Assert.ThrowsAsync<RequestFailedException>(async () => await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesFailureNextPageAsync(resultPage.ContinuationToken));
            Assert.AreEqual(2, id);

            id = 1;
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesFailureAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                await foreach (var page in pageableAsync.AsPages())
                {
                    Assert.AreEqual(id, page.Values.First().Properties.Id);
                    Assert.AreEqual(product, page.Values.First().Properties.Name);
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
            });
            Assert.AreEqual(2, id);

            id = 1;
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesFailure();
            Assert.Throws<RequestFailedException>(() =>
            {
                foreach (var page in pageable.AsPages())
                {
                    Assert.AreEqual(id, page.Values.First().Properties.Id);
                    Assert.AreEqual(product, page.Values.First().Properties.Name);
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
            });
            Assert.AreEqual(2, id);
        }, useSimplePipeline: true);

        [Test]
        public Task PagingMultipleFailureUri() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesFailureUriAsync();
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());

            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
            Assert.AreEqual("*&*#&$", resultPage.ContinuationToken);
            Assert.ThrowsAsync<RequestFailedException>(async () => await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesFailureNextPageAsync(resultPage.ContinuationToken));

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesFailureUriAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () =>
            {
                await foreach (var page in pageableAsync.AsPages())
                {
                    Assert.AreEqual(id, page.Values.First().Properties.Id);
                    Assert.AreEqual(product, page.Values.First().Properties.Name);
                    Assert.AreEqual("*&*#&$", page.ContinuationToken);
                    id++;
                }
            });
            Assert.AreEqual(2, id);

            id = 1;
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesFailureUri();
            Assert.Throws<RequestFailedException>(() =>
            {
                foreach (var page in pageable.AsPages())
                {
                    Assert.AreEqual(id, page.Values.First().Properties.Id);
                    Assert.AreEqual(product, page.Values.First().Properties.Name);
                    Assert.AreEqual("*&*#&$", page.ContinuationToken);
                    id++;
                }
            });
            Assert.AreEqual(2, id);
        });

        [Test]
        public Task PagingMultipleLRO() => Test(async (host, pipeline) =>
        {
            var lro = await new PagingClient(ClientDiagnostics, pipeline, host).StartGetMultiplePagesLROAsync(new PagingGetMultiplePagesLroOptions());

            AsyncPageable<Product> pageable = await lro.WaitForCompletionAsync();

            var product = "Product";
            int id = 1;
            await foreach (var item in pageable)
            {
                Assert.AreEqual(id, item.Properties.Id);
                Assert.AreEqual(product, item.Properties.Name);

                if (product == "Product")
                {
                    product = "product";
                }
                id += 1;
            }
        });

        [Test]
        public Task PagingMultiplePath() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var pageNumber = 1;
            var product = "Product";
            var offset = 100;
            var linkPart = $"/paging/multiple/withpath/page/{offset}/";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesWithOffsetAsync(new PagingGetMultiplePagesWithOffsetOptions(offset));
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++pageNumber}", resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesWithOffsetNextPageAsync(resultPage.ContinuationToken, new PagingGetMultiplePagesWithOffsetOptions(offset));
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
                if (product == "Product")
                {
                    id += offset;
                    product = "product";
                }

                id++;
            }
            Assert.AreEqual(10, pageNumber);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            pageNumber = 1;
            product = "Product";
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesWithOffsetAsync(new PagingGetMultiplePagesWithOffsetOptions(offset));
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (pageNumber == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++pageNumber}", page.ContinuationToken);
                }
                if (product == "Product")
                {
                    id += offset;
                    product = "product";
                }

                id++;
            }
            Assert.AreEqual(10, pageNumber);

            id = 1;
            pageNumber = 1;
            product = "Product";
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesWithOffset(new PagingGetMultiplePagesWithOffsetOptions(offset));
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (pageNumber == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++pageNumber}", page.ContinuationToken);
                }
                if (product == "Product")
                {
                    id += offset;
                    product = "product";
                }

                id++;
            }
            Assert.AreEqual(10, pageNumber);
        });

        [Test]
        public Task PagingMultipleRetryFirst() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/page/";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesRetryFirstAsync();
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesRetryFirstNextPageAsync(resultPage.ContinuationToken);
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
                product = "product";
            }
            Assert.AreEqual(10, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            product = "Product";
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesRetryFirstAsync();
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);

            id = 1;
            product = "Product";
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesRetryFirst();
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);
        });

        [Test]
        public Task PagingMultipleRetrySecond() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/retrysecond/page/";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesRetrySecondAsync();
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                var tempId = id == 2 ? 1 : id;
                Assert.AreEqual(tempId, resultPage.Values.First().Properties.Id);
                var tempProduct = id == 2 ? "Product" : product;
                Assert.AreEqual(tempProduct, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetMultiplePagesRetrySecondNextPageAsync(resultPage.ContinuationToken);
                resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
                product = "product";
            }
            Assert.AreEqual(10, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            product = "Product";
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesRetrySecondAsync();
            await foreach (var page in pageableAsync.AsPages())
            {
                var tempId = id == 2 ? 1 : id;
                Assert.AreEqual(tempId, page.Values.First().Properties.Id);
                var tempProduct = id == 2 ? "Product" : product;
                Assert.AreEqual(tempProduct, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);

            id = 1;
            product = "Product";
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetMultiplePagesRetrySecond();
            foreach (var page in pageable.AsPages())
            {
                var tempId = id == 2 ? 1 : id;
                Assert.AreEqual(tempId, page.Values.First().Properties.Id);
                var tempProduct = id == 2 ? "Product" : product;
                Assert.AreEqual(tempProduct, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);
        });

        [Test]
        public Task PagingNextLinkNameNull() => Test(async (host, pipeline) =>
        {
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetNullNextLinkNamePagesAsync();
            var resultPage = Page.FromValues(result.Value.Values, null, result.GetRawResponse());
            Assert.AreEqual(1, resultPage.Values.First().Properties.Id);
            Assert.AreEqual("Product", resultPage.Values.First().Properties.Name);
            Assert.IsNull(resultPage.ContinuationToken);

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetNullNextLinkNamePagesAsync();
            var pagesCount = 0;
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                pagesCount++;
            }
            Assert.AreEqual(1, pagesCount);

            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetNullNextLinkNamePages();
            pagesCount = 0;
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                pagesCount++;
            }
            Assert.AreEqual(1, pagesCount);
        });

        [Test]
        public Task PagingNoItemName() => Test(async (host, pipeline) =>
        {
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetNoItemNamePagesAsync();
            var resultPage = Page.FromValues(result.Value.Value, result.Value.NextLink, result.GetRawResponse());
            Assert.AreEqual(1, resultPage.Values.First().Properties.Id);
            Assert.AreEqual("Product", resultPage.Values.First().Properties.Name);
            Assert.IsNull(resultPage.ContinuationToken);

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetNoItemNamePagesAsync();
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                Assert.IsNull(page.ContinuationToken);
            }

            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetNoItemNamePages();
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                Assert.IsNull(page.ContinuationToken);
            }
        });

        [Test]
        public Task PagingReturnModelWithXMSClientName() => Test(async (host, pipeline) =>
        {
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetPagingModelWithItemNameWithXMSClientNameAsync();
            var resultPage = Page.FromValues(result.Value.Indexes, result.Value.NextLink, result.GetRawResponse());
            Assert.AreEqual(1, resultPage.Values.First().Properties.Id);
            Assert.AreEqual("Product", resultPage.Values.First().Properties.Name);
            Assert.IsNull(resultPage.ContinuationToken);

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetPagingModelWithItemNameWithXMSClientNameAsync();
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                Assert.IsNull(page.ContinuationToken);
            }

            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetPagingModelWithItemNameWithXMSClientName();
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                Assert.IsNull(page.ContinuationToken);
            }
        });

        [Test]
        public Task PagingOdataMultiple() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/odata/page/";
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetOdataMultiplePagesAsync(null);
            var resultPage = Page.FromValues(result.Value.Values, result.Value.OdataNextLink, result.GetRawResponse());
            while (resultPage.ContinuationToken != null)
            {
                Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
                Assert.AreEqual(product, resultPage.Values.First().Properties.Name);
                StringAssert.EndsWith($"{linkPart}{++id}", resultPage.ContinuationToken);
                result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetOdataMultiplePagesNextPageAsync(resultPage.ContinuationToken, null);
                resultPage = Page.FromValues(result.Value.Values, result.Value.OdataNextLink, result.GetRawResponse());
                product = "product";
            }
            Assert.AreEqual(10, id);
            Assert.AreEqual(id, resultPage.Values.First().Properties.Id);
            Assert.AreEqual(product, resultPage.Values.First().Properties.Name);

            id = 1;
            product = "Product";
            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetOdataMultiplePagesAsync(null);
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);

            id = 1;
            product = "Product";
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetOdataMultiplePages(null);
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(id, page.Values.First().Properties.Id);
                Assert.AreEqual(product, page.Values.First().Properties.Name);
                if (id == 10)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    StringAssert.EndsWith($"{linkPart}{++id}", page.ContinuationToken);
                }
                product = "product";
            }
            Assert.AreEqual(10, id);
        });

        [Test]
        public Task PagingSingle() => Test(async (host, pipeline) =>
        {
            var result = await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetSinglePagesAsync();
            var resultPage = Page.FromValues(result.Value.Values, result.Value.NextLink, result.GetRawResponse());
            Assert.AreEqual(1, resultPage.Values.First().Properties.Id);
            Assert.AreEqual("Product", resultPage.Values.First().Properties.Name);
            Assert.IsNull(resultPage.ContinuationToken);

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetSinglePagesAsync();
            await foreach (var page in pageableAsync.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                Assert.IsNull(page.ContinuationToken);
            }

            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetSinglePages();
            foreach (var page in pageable.AsPages())
            {
                Assert.AreEqual(1, page.Values.First().Properties.Id);
                Assert.AreEqual("Product", page.Values.First().Properties.Name);
                Assert.IsNull(page.ContinuationToken);
            }
        });

        [Test]
        public Task PagingSingleFailure() => Test((host, pipeline) =>
        {
            Assert.ThrowsAsync<RequestFailedException>(async () => await new PagingClient(ClientDiagnostics, pipeline, host).RestClient.GetSinglePagesFailureAsync());

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).GetSinglePagesFailureAsync();
            Assert.ThrowsAsync<RequestFailedException>(async () => { await foreach (var page in pageableAsync.AsPages()) { } });

            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).GetSinglePagesFailure();
            Assert.Throws<RequestFailedException>(() => { foreach (var page in pageable.AsPages()) { } });
        });

        [Test]
        public Task PagingDuplicateParameters() => Test(async (host, pipeline) =>
        {
            var id = 1;
            var product = "Product";
            var linkPart = "/paging/multiple/duplicateParams/2?%24filter=serviceReturned&%24skiptoken=bar";

            var pageableAsync = new PagingClient(ClientDiagnostics, pipeline, host).DuplicateParamsAsync("foo");
            await foreach (var page in pageableAsync.AsPages())
            {
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    Assert.AreEqual(id, page.Values.Single().Properties.Id);
                    Assert.AreEqual(product, page.Values.Single().Properties.Name);
                    StringAssert.EndsWith(linkPart, page.ContinuationToken);
                    id++;
                }
            }
            Assert.AreEqual(2, id);

            id = 1;
            var pageable = new PagingClient(ClientDiagnostics, pipeline, host).DuplicateParams("foo");
            foreach (var page in pageable.AsPages())
            {
                if (id == 2)
                {
                    Assert.IsNull(page.ContinuationToken);
                }
                else
                {
                    Assert.AreEqual(id, page.Values.Single().Properties.Id);
                    Assert.AreEqual(product, page.Values.Single().Properties.Name);
                    StringAssert.EndsWith(linkPart, page.ContinuationToken);
                    id++;
                }
            }
            Assert.AreEqual(2, id);
        });

        [Test]
        public Task PagingFirstResponseEmpty() => Test(async (host, pipeline) =>
        {
            var result = new PagingClient(ClientDiagnostics, pipeline, host).FirstResponseEmptyAsync();
            int count = 0;
            await foreach (var product in result)
            {
                count++;
                Assert.AreEqual(1, product.Properties.Id);
                Assert.AreEqual("Product", product.Properties.Name);
            }
            Assert.AreEqual(1, count);
        });

        [Test]
        public void PagingModelsAreHidden()
        {
            Assert.IsFalse(typeof(ProductResult).IsPublic);
        }

        [Test]
        public void RestClientDroppedMethods()
        {
            var client = typeof(PagingRestClient);
            Assert.IsNull(client.GetMethod ("CreateNextFragmentNextPageRequest", BindingFlags.Instance | BindingFlags.NonPublic), "CreateNextFragmentNextPageRequest should not be generated");
            Assert.IsNull(client.GetMethod ("NextFragmentNextPageAsync", BindingFlags.Instance | BindingFlags.NonPublic), "NextFragmentNextPageAsync should not be generated");
            Assert.IsNull(client.GetMethod ("NextFragmentNextPage", BindingFlags.Instance | BindingFlags.NonPublic), "NextFragmentNextPage should not be generated");
        }

        [Test]
        public void ClientDroppedMethods()
        {
            var client = typeof(PagingClient);
            Assert.IsNull(client.GetMethod ("NextFragmentAsync", BindingFlags.Instance | BindingFlags.NonPublic), "NextFragmentAsync should not be generated");
            Assert.IsNull(client.GetMethod ("NextFragment", BindingFlags.Instance | BindingFlags.NonPublic), "NextFragment should not be generated");
        }
    }
}
