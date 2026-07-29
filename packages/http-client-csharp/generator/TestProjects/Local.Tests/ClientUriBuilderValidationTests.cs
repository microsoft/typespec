using System;
using System.Collections.Generic;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class ClientUriBuilderValidationTests
    {
        [Test]
        public void ValidateBasicPathAndQueryBuilding()
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri("https://example.com"));
            
            // Test path building
            builder.AppendPath("/api", false);
            builder.AppendPath("/v1", false);
            builder.AppendPath("/users", false);
            
            // Test query building
            builder.AppendQuery("filter", "active", false);
            builder.AppendQuery("limit", "10", false);
            
            var result = builder.ToUri();
            Assert.AreEqual("https://example.com/api/v1/users?filter=active&limit=10", result.ToString());
            Assert.AreEqual("/api/v1/users", result.AbsolutePath);
            Assert.AreEqual("?filter=active&limit=10", result.Query);
        }

        [Test]
        public void ValidateIntermixedPathAndQueryOperations()
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri("https://example.com"));
            
            // Intermix path and query operations
            builder.AppendPath("/api", false);
            builder.AppendQuery("version", "1", false);
            builder.AppendPath("/users", false);
            builder.AppendQuery("format", "json", false);
            
            var result = builder.ToUri();
            Assert.AreEqual("https://example.com/api/users?version=1&format=json", result.ToString());
            Assert.AreEqual("/api/users", result.AbsolutePath);
            Assert.AreEqual("?version=1&format=json", result.Query);
        }

        [Test]
        public void ValidateMultipleResetOperations()
        {
            var builder = new ClientUriBuilder();
            
            // First usage
            builder.Reset(new Uri("https://example1.com"));
            builder.AppendPath("path1", false);
            builder.AppendQuery("query1", "value1", false);
            var result1 = builder.ToUri();
            
            // Reset and reuse
            builder.Reset(new Uri("https://example2.com"));
            builder.AppendPath("path2", false);
            builder.AppendQuery("query2", "value2", false);
            var result2 = builder.ToUri();
            
            Assert.AreEqual("https://example1.com/path1?query1=value1", result1.ToString());
            Assert.AreEqual("/path1", result1.AbsolutePath);
            Assert.AreEqual("?query1=value1", result1.Query);
            Assert.AreEqual("https://example2.com/path2?query2=value2", result2.ToString());
            Assert.AreEqual("/path2", result2.AbsolutePath);
            Assert.AreEqual("?query2=value2", result2.Query);
        }

        [Test]
        public void ValidateTypedParameterConversions()
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri("https://example.com"));
            
            builder.AppendPath(123, false);
            builder.AppendQuery("int", 456, false);
            builder.AppendQuery("bool", true, false);
            builder.AppendQuery("guid", Guid.Parse("12345678-1234-1234-1234-123456789012"), false);
            
            var result = builder.ToUri();
            Assert.That(result.ToString(), Contains.Substring("123"));
            Assert.That(result.ToString(), Contains.Substring("int=456"));
            Assert.That(result.ToString(), Contains.Substring("bool=true"));
            Assert.That(result.ToString(), Contains.Substring("guid=12345678-1234-1234-1234-123456789012"));
            Assert.AreEqual("/123", result.AbsolutePath);
            Assert.That(result.Query, Contains.Substring("int=456"));
            Assert.That(result.Query, Contains.Substring("bool=true"));
            Assert.That(result.Query, Contains.Substring("guid=12345678-1234-1234-1234-123456789012"));
        }

        [Test]
        public void ValidateResetWithQueryParametersPreservesQueryString()
        {
            var builder = new ClientUriBuilder();
            var uriWithQuery = new Uri("https://api.example.com/items?filter=active&pageSize=50");
            
            builder.Reset(uriWithQuery);
            var result = builder.ToUri();
            
            Assert.AreEqual("https://api.example.com/items?filter=active&pageSize=50", result.ToString());
            Assert.AreEqual("?filter=active&pageSize=50", result.Query);
            Assert.AreEqual("/items", result.AbsolutePath);
        }

        [Test]
        public void ValidateNextLinkWithContinuationToken()
        {
            var builder = new ClientUriBuilder();
            // Simulate a nextLink from server response with continuation token embedded
            var nextLinkUri = new Uri("https://api.example.com/items?continuationToken=eyJsYXN0SWQiOjMsInRpbWVzdGFtcCI6MTcwMzI1OTYwMH0=&pageSize=50");
            
            builder.Reset(nextLinkUri);
            var result = builder.ToUri();
            
            // The continuation token and other query parameters should be preserved
            Assert.AreEqual("https://api.example.com/items?continuationToken=eyJsYXN0SWQiOjMsInRpbWVzdGFtcCI6MTcwMzI1OTYwMH0=&pageSize=50", result.ToString());
            Assert.That(result.ToString(), Contains.Substring("continuationToken=eyJsYXN0SWQiOjMsInRpbWVzdGFtcCI6MTcwMzI1OTYwMH0="));
            Assert.AreEqual("?continuationToken=eyJsYXN0SWQiOjMsInRpbWVzdGFtcCI6MTcwMzI1OTYwMH0=&pageSize=50", result.Query);
            Assert.AreEqual("/items", result.AbsolutePath);
        }

        [Test]
        public void ValidateNextLinkWithMultipleQueryParameters()
        {
            var builder = new ClientUriBuilder();
            // Simulate Azure-style nextLink with skiptoken and other params
            var nextLinkUri = new Uri("https://management.azure.com/subscriptions/123/resources?api-version=2021-04-01&$skiptoken=AQ%3D%3D&$top=100");
            
            builder.Reset(nextLinkUri);
            var result = builder.ToUri();
            
            Assert.AreEqual("https://management.azure.com/subscriptions/123/resources?api-version=2021-04-01&$skiptoken=AQ%3D%3D&$top=100", result.ToString());
            Assert.AreEqual("/subscriptions/123/resources", result.AbsolutePath);
            Assert.AreEqual("?api-version=2021-04-01&$skiptoken=AQ%3D%3D&$top=100", result.Query);
        }

        [Test]
        public void ValidateResetWithComplexPathAndQuery()
        {
            var builder = new ClientUriBuilder();
            // Simulate a complex nextLink with path segments and query parameters
            var complexUri = new Uri("https://api.example.com/v1/databases/myDb/collections/myColl/documents?marker=AAAAAA&maxresults=100&partition=us-east");
            
            builder.Reset(complexUri);
            var result = builder.ToUri();
            
            Assert.AreEqual("https://api.example.com/v1/databases/myDb/collections/myColl/documents?marker=AAAAAA&maxresults=100&partition=us-east", result.ToString());
            Assert.AreEqual("/v1/databases/myDb/collections/myColl/documents", result.AbsolutePath);
            Assert.AreEqual("?marker=AAAAAA&maxresults=100&partition=us-east", result.Query);
        }

        [Test]
        public void ValidateResetPreservesQueryThenAllowsAppending()
        {
            var builder = new ClientUriBuilder();
            var uriWithQuery = new Uri("https://api.example.com/items?existingParam=value1");
            
            builder.Reset(uriWithQuery);
            builder.AppendQuery("newParam", "value2", false);
            var result = builder.ToUri();
            
            // Both the original query parameter and the newly appended one should be present
            Assert.That(result.ToString(), Contains.Substring("existingParam=value1"));
            Assert.That(result.ToString(), Contains.Substring("newParam=value2"));
            Assert.AreEqual("/items", result.AbsolutePath);
            Assert.AreEqual("?existingParam=value1&newParam=value2", result.Query);
        }

        [Test]
        public void ValidateResetWithPathAndQueryThenAppendBoth()
        {
            var builder = new ClientUriBuilder();
            // Start with a URI that already has both path and query parameters
            var uriWithPathAndQuery = new Uri("https://api.example.com/v1/items?filter=active&pageSize=20");
            
            builder.Reset(uriWithPathAndQuery);
            // Append additional path segments
            builder.AppendPath("/documents", false);
            builder.AppendPath("/123", false);
            // Append additional query parameters
            builder.AppendQuery("include", "metadata", false);
            builder.AppendQuery("format", "json", false);
            
            var result = builder.ToUri();
            
            // Should preserve original path and query, plus append new ones
            Assert.AreEqual("https://api.example.com/v1/items/documents/123?filter=active&pageSize=20&include=metadata&format=json", result.ToString());
            Assert.AreEqual("/v1/items/documents/123", result.AbsolutePath);
            Assert.AreEqual("?filter=active&pageSize=20&include=metadata&format=json", result.Query);

            // call reset and re-validate that original uri is restored
            builder.Reset(uriWithPathAndQuery);
            var resetResult = builder.ToUri();
            Assert.AreEqual(uriWithPathAndQuery.ToString(), resetResult.ToString());
        }
    }
}
