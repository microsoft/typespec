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
            builder.AppendPath("api", false);
            builder.AppendPath("v1", false);
            builder.AppendPath("users", false);
            
            // Test query building
            builder.AppendQuery("filter", "active", false);
            builder.AppendQuery("limit", "10", false);
            
            var result = builder.ToUri();
            Assert.AreEqual("https://example.com/apiv1users?filter=active&limit=10", result.ToString());
        }

        [Test]
        public void ValidateIntermixedPathAndQueryOperations()
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri("https://example.com"));
            
            // Intermix path and query operations
            builder.AppendPath("api", false);
            builder.AppendQuery("version", "1", false);
            builder.AppendPath("users", false);
            builder.AppendQuery("format", "json", false);
            
            var result = builder.ToUri();
            Assert.AreEqual("https://example.com/apiusers?version=1&format=json", result.ToString());
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
            Assert.AreEqual("https://example2.com/path2?query2=value2", result2.ToString());
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
        }
    }
}