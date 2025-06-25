// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers
{
    public class ClientUriBuilderTests
    {
        [TestCase("http://localhost", null, "http://localhost/")]
        [TestCase("http://localhost/", null, "http://localhost/")]
        [TestCase("http://localhost:12345", null, "http://localhost:12345/")]
        [TestCase("http://localhost:12345/", null, "http://localhost:12345/")]
        [TestCase("http://localhost/with", null, "http://localhost/with")]
        [TestCase("http://localhost/with/", null, "http://localhost/with/")]
        [TestCase("http://localhost:12345/with", null, "http://localhost:12345/with")]
        [TestCase("http://localhost:12345/with/", null, "http://localhost:12345/with/")]
        [TestCase("http://localhost", "path", "http://localhost/path")]
        [TestCase("http://localhost/", "path", "http://localhost/path")]
        [TestCase("http://localhost:12345", "path", "http://localhost:12345/path")]
        [TestCase("http://localhost:12345/", "path", "http://localhost:12345/path")]
        [TestCase("http://localhost/with", "path", "http://localhost/withpath")]
        [TestCase("http://localhost/with/", "path", "http://localhost/with/path")]
        [TestCase("http://localhost:12345/with", "path", "http://localhost:12345/withpath")]
        [TestCase("http://localhost:12345/with/", "path", "http://localhost:12345/with/path")]
        [TestCase("http://localhost", "/path", "http://localhost/path")]
        [TestCase("http://localhost/", "/path", "http://localhost/path")]
        [TestCase("http://localhost:12345", "/path", "http://localhost:12345/path")]
        [TestCase("http://localhost:12345/", "/path", "http://localhost:12345/path")]
        [TestCase("http://localhost/with", "/path", "http://localhost/with/path")]
        [TestCase("http://localhost/with/", "/path", "http://localhost/with/path")]
        [TestCase("http://localhost:12345/with", "/path", "http://localhost:12345/with/path")]
        [TestCase("http://localhost:12345/with/", "/path", "http://localhost:12345/with/path")]
        [TestCase("http://localhost", "/path/", "http://localhost/path/")]
        [TestCase("http://localhost/", "/path/", "http://localhost/path/")]
        [TestCase("http://localhost:12345", "/path/", "http://localhost:12345/path/")]
        [TestCase("http://localhost:12345/", "/path/", "http://localhost:12345/path/")]
        [TestCase("http://localhost/with", "/path/", "http://localhost/with/path/")]
        [TestCase("http://localhost/with/", "/path/", "http://localhost/with/path/")]
        [TestCase("http://localhost:12345/with", "/path/", "http://localhost:12345/with/path/")]
        [TestCase("http://localhost:12345/with/", "/path/", "http://localhost:12345/with/path/")]
        public void ResetThenAppendPath(string endpoint, string pathPart, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            if (pathPart != null)
            {
                builder.AppendPath(pathPart, false);
            }

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "one|1", "http://localhost/?one=1")]
        [TestCase("http://localhost:12345", "one|1", "http://localhost:12345/?one=1")]
        [TestCase("http://localhost/some", "one|1", "http://localhost/some?one=1")]
        [TestCase("http://localhost:12345/some", "one|1", "http://localhost:12345/some?one=1")]
        [TestCase("http://localhost/", "one|1", "http://localhost/?one=1")]
        [TestCase("http://localhost:12345/", "one|1", "http://localhost:12345/?one=1")]
        [TestCase("http://localhost/some/", "one|1", "http://localhost/some/?one=1")]
        [TestCase("http://localhost:12345/some/", "one|1", "http://localhost:12345/some/?one=1")]
        [TestCase("http://localhost", "one|1|two|2", "http://localhost/?one=1&two=2")]
        [TestCase("http://localhost:12345", "one|1|two|2", "http://localhost:12345/?one=1&two=2")]
        [TestCase("http://localhost/some", "one|1|two|2", "http://localhost/some?one=1&two=2")]
        [TestCase("http://localhost:12345/some", "one|1|two|2", "http://localhost:12345/some?one=1&two=2")]
        [TestCase("http://localhost/", "one|1|two|2", "http://localhost/?one=1&two=2")]
        [TestCase("http://localhost:12345/", "one|1|two|2", "http://localhost:12345/?one=1&two=2")]
        [TestCase("http://localhost/some/", "one|1|two|2", "http://localhost/some/?one=1&two=2")]
        [TestCase("http://localhost:12345/some/", "one|1|two|2", "http://localhost:12345/some/?one=1&two=2")]
        public void ResetThenAppendQuery(string endpoint, string queryPart, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            if (queryPart != null)
            {
                var parts = queryPart.Split('|');
                for (int i = 0; i < parts.Length; i += 2)
                {
                    builder.AppendQuery(parts[i], parts[i + 1], false);
                }
            }

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "some", "one|1", "http://localhost/some?one=1")]
        [TestCase("http://localhost:12345", "some", "one|1", "http://localhost:12345/some?one=1")]
        [TestCase("http://localhost/", "some/", "one|1", "http://localhost/some/?one=1")]
        [TestCase("http://localhost:12345", "some/", "one|1", "http://localhost:12345/some/?one=1")]
        [TestCase("http://localhost/", "/some", "one|1", "http://localhost/some?one=1")]
        [TestCase("http://localhost:12345", "/some", "one|1", "http://localhost:12345/some?one=1")]
        [TestCase("http://localhost/", "/some/", "one|1", "http://localhost/some/?one=1")]
        [TestCase("http://localhost:12345", "/some/", "one|1", "http://localhost:12345/some/?one=1")]
        [TestCase("http://localhost", "/some", "one|1|two|2", "http://localhost/some?one=1&two=2")]
        [TestCase("http://localhost:12345", "/some", "one|1|two|2", "http://localhost:12345/some?one=1&two=2")]
        [TestCase("http://localhost", "some/", "one|1|two|2", "http://localhost/some/?one=1&two=2")]
        [TestCase("http://localhost:12345", "some/", "one|1|two|2", "http://localhost:12345/some/?one=1&two=2")]
        [TestCase("http://localhost", "/some/", "one|1|two|2", "http://localhost/some/?one=1&two=2")]
        [TestCase("http://localhost:12345", "/some/", "one|1|two|2", "http://localhost:12345/some/?one=1&two=2")]
        public void ResetThenAppendPathThenAppendQuery(string endpoint, string pathPart, string queryPart, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            if (pathPart != null)
            {
                builder.AppendPath(pathPart, false);
            }

            if (queryPart != null)
            {
                var parts = queryPart.Split('|');
                for (int i = 0; i < parts.Length; i += 2)
                {
                    builder.AppendQuery(parts[i], parts[i + 1], false);
                }
            }

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "some", "one|1", "http://localhost/some?one=1")]
        [TestCase("http://localhost:12345", "some", "one|1", "http://localhost:12345/some?one=1")]
        [TestCase("http://localhost/", "some/", "one|1", "http://localhost/some/?one=1")]
        [TestCase("http://localhost:12345", "some/", "one|1", "http://localhost:12345/some/?one=1")]
        [TestCase("http://localhost/", "/some", "one|1", "http://localhost/some?one=1")]
        [TestCase("http://localhost:12345", "/some", "one|1", "http://localhost:12345/some?one=1")]
        [TestCase("http://localhost/", "/some/", "one|1", "http://localhost/some/?one=1")]
        [TestCase("http://localhost:12345", "/some/", "one|1", "http://localhost:12345/some/?one=1")]
        [TestCase("http://localhost", "/some", "one|1|two|2", "http://localhost/some?one=1&two=2")]
        [TestCase("http://localhost:12345", "/some", "one|1|two|2", "http://localhost:12345/some?one=1&two=2")]
        [TestCase("http://localhost", "some/", "one|1|two|2", "http://localhost/some/?one=1&two=2")]
        [TestCase("http://localhost:12345", "some/", "one|1|two|2", "http://localhost:12345/some/?one=1&two=2")]
        [TestCase("http://localhost", "/some/", "one|1|two|2", "http://localhost/some/?one=1&two=2")]
        [TestCase("http://localhost:12345", "/some/", "one|1|two|2", "http://localhost:12345/some/?one=1&two=2")]
        public void ResetThenAppendQueryThenAppendPath(string endpoint, string pathPart, string queryPart, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            if (queryPart != null)
            {
                var parts = queryPart.Split('|');
                for (int i = 0; i < parts.Length; i += 2)
                {
                    builder.AppendQuery(parts[i], parts[i + 1], false);
                }
            }

            if (pathPart != null)
            {
                builder.AppendPath(pathPart, false);
            }

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", true, true, "http://localhost/true")]
        [TestCase("http://localhost", true, false, "http://localhost/true")]
        [TestCase("http://localhost", false, true, "http://localhost/false")]
        [TestCase("http://localhost", false, false, "http://localhost/false")]
        public void AppendPath_Bool(string endpoint, bool value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPath(value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 3.14f, true, "http://localhost/3.14")]
        [TestCase("http://localhost", 3.14f, false, "http://localhost/3.14")]
        [TestCase("http://localhost", -3.14f, true, "http://localhost/-3.14")]
        [TestCase("http://localhost", -3.14f, false, "http://localhost/-3.14")]
        public void AppendPath_Float(string endpoint, float value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPath(value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 3.14, true, "http://localhost/3.14")]
        [TestCase("http://localhost", 3.14, false, "http://localhost/3.14")]
        [TestCase("http://localhost", -3.14, true, "http://localhost/-3.14")]
        [TestCase("http://localhost", -3.14, false, "http://localhost/-3.14")]
        public void AppendPath_Double(string endpoint, double value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPath(value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 299792458, true, "http://localhost/299792458")]
        [TestCase("http://localhost", 299792458, false, "http://localhost/299792458")]
        [TestCase("http://localhost", -299792458, true, "http://localhost/-299792458")]
        [TestCase("http://localhost", -299792458, false, "http://localhost/-299792458")]
        public void AppendPath_Int(string endpoint, int value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPath(value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 299792458000000, true, "http://localhost/299792458000000")]
        [TestCase("http://localhost", 299792458000000, false, "http://localhost/299792458000000")]
        [TestCase("http://localhost", -299792458000000, true, "http://localhost/-299792458000000")]
        [TestCase("http://localhost", -299792458000000, false, "http://localhost/-299792458000000")]
        public void AppendPath_Long(string endpoint, long value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPath(value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "U", true, "http://localhost/aGVsbG8")]
        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "D", true, "http://localhost/aGVsbG8%3D")]
        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "U", false, "http://localhost/aGVsbG8")]
        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "D", false, "http://localhost/aGVsbG8=")]
        public void AppendPath_ByteArray(string endpoint, byte[] value, string format, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPath(value, format, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", new[] { "hello", "world" }, ",", true, "http://localhost/hello%2Cworld")]
        [TestCase("http://localhost", new[] { "hello", "world" }, ".", false, "http://localhost/hello.world")]
        public void AppendPathDelimited_StringArray(string endpoint, IEnumerable<string> value, string delimiter, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPathDelimited(value, delimiter, null, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", new[] { 4, 5 }, ",", true, "http://localhost/4%2C5")]
        [TestCase("http://localhost", new[] { 1, 2 }, ".", false, "http://localhost/1.2")]
        public void AppendPathDelimited_IntArray(string endpoint, IEnumerable<int> value, string delimiter, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendPathDelimited(value, delimiter, null, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }


        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "D", true, "http://localhost/1905-06-30")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "U", true, "http://localhost/-2035622760")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "O", true, "http://localhost/1905-06-30T13%3A14%3A00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "o", true, "http://localhost/1905-06-30T13%3A14%3A00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "R", true, "http://localhost/Fri%2C 30 Jun 1905 13%3A14%3A00 GMT")] // TODO -- why spaces are not escaped?
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "D", false, "http://localhost/1905-06-30")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "U", false, "http://localhost/-2035622760")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "O", false, "http://localhost/1905-06-30T13:14:00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "o", false, "http://localhost/1905-06-30T13:14:00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "R", false, "http://localhost/Fri, 30 Jun 1905 13:14:00 GMT")]
        public void AppendPath_DateTimeOffset(string endpoint, string value, string format, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            var dateTimeOffset = DateTimeOffset.Parse(value);
            builder.AppendPath(dateTimeOffset, format, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "02:15:00", "P", true, "http://localhost/PT2H15M")]
        [TestCase("http://localhost", "02:15:00", "", true, "http://localhost/02%3A15%3A00")]
        [TestCase("http://localhost", "02:15:00", null, true, "http://localhost/PT2H15M")]
        [TestCase("http://localhost", "02:15:00", "P", false, "http://localhost/PT2H15M")]
        [TestCase("http://localhost", "02:15:00", "", false, "http://localhost/02:15:00")]
        [TestCase("http://localhost", "02:15:00", null, false, "http://localhost/PT2H15M")]
        public void AppendPath_TimeSpan(string endpoint, string value, string format, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            var timeSpan = TimeSpan.Parse(value);
            builder.AppendPath(timeSpan, format, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "3f2504e0-4f89-11d3-9a0c-0305e82c3301", true, "http://localhost/3f2504e0-4f89-11d3-9a0c-0305e82c3301")]
        [TestCase("http://localhost", "3f2504e0-4f89-11d3-9a0c-0305e82c3301", false, "http://localhost/3f2504e0-4f89-11d3-9a0c-0305e82c3301")]
        public void AppendPath_Guid(string endpoint, string value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            var guid = Guid.Parse(value);
            builder.AppendPath(guid, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", true, true, "http://localhost/?query=true")]
        [TestCase("http://localhost", true, false, "http://localhost/?query=true")]
        [TestCase("http://localhost", false, true, "http://localhost/?query=false")]
        [TestCase("http://localhost", false, false, "http://localhost/?query=false")]
        public void AppendQuery_Bool(string endpoint, bool value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQuery("query", value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 3.14f, true, "http://localhost/?query=3.14")]
        [TestCase("http://localhost", 3.14f, false, "http://localhost/?query=3.14")]
        [TestCase("http://localhost", -3.14f, true, "http://localhost/?query=-3.14")]
        [TestCase("http://localhost", -3.14f, false, "http://localhost/?query=-3.14")]
        public void AppendQuery_Float(string endpoint, float value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQuery("query", value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 3.14, true, "http://localhost/?query=3.14")]
        [TestCase("http://localhost", 3.14, false, "http://localhost/?query=3.14")]
        [TestCase("http://localhost", -3.14, true, "http://localhost/?query=-3.14")]
        [TestCase("http://localhost", -3.14, false, "http://localhost/?query=-3.14")]
        public void AppendQuery_Double(string endpoint, double value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQuery("query", value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 299792458, true, "http://localhost/?query=299792458")]
        [TestCase("http://localhost", 299792458, false, "http://localhost/?query=299792458")]
        [TestCase("http://localhost", -299792458, true, "http://localhost/?query=-299792458")]
        [TestCase("http://localhost", -299792458, false, "http://localhost/?query=-299792458")]
        public void AppendQuery_Int(string endpoint, int value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQuery("query", value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", 299792458000000, true, "http://localhost/?query=299792458000000")]
        [TestCase("http://localhost", 299792458000000, false, "http://localhost/?query=299792458000000")]
        [TestCase("http://localhost", -299792458000000, true, "http://localhost/?query=-299792458000000")]
        [TestCase("http://localhost", -299792458000000, false, "http://localhost/?query=-299792458000000")]
        public void AppendQuery_Long(string endpoint, long value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQuery("query", value, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "U", true, "http://localhost/?query=aGVsbG8")]
        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "D", true, "http://localhost/?query=aGVsbG8%3D")]
        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "U", false, "http://localhost/?query=aGVsbG8")]
        [TestCase("http://localhost", new byte[] { 104, 101, 108, 108, 111 }, "D", false, "http://localhost/?query=aGVsbG8=")]
        public void AppendQuery_ByteArray(string endpoint, byte[] value, string format, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQuery("query", value, format, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "D", true, "http://localhost/?query=1905-06-30")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "U", true, "http://localhost/?query=-2035622760")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "O", true, "http://localhost/?query=1905-06-30T13%3A14%3A00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "o", true, "http://localhost/?query=1905-06-30T13%3A14%3A00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "R", true, "http://localhost/?query=Fri%2C 30 Jun 1905 13%3A14%3A00 GMT")] // TODO -- why spaces are not escaped?
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "D", false, "http://localhost/?query=1905-06-30")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "U", false, "http://localhost/?query=-2035622760")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "O", false, "http://localhost/?query=1905-06-30T13:14:00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "o", false, "http://localhost/?query=1905-06-30T13:14:00.0000000Z")]
        [TestCase("http://localhost", "6/30/1905 1:14:00 PM +00:00", "R", false, "http://localhost/?query=Fri, 30 Jun 1905 13:14:00 GMT")]
        public void AppendQuery_DateTimeOffset(string endpoint, string value, string format, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            var dateTimeOffset = DateTimeOffset.Parse(value);
            builder.AppendQuery("query", dateTimeOffset, format, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "02:15:00", "P", true, "http://localhost/?query=PT2H15M")]
        [TestCase("http://localhost", "02:15:00", "", true, "http://localhost/?query=02%3A15%3A00")]
        [TestCase("http://localhost", "02:15:00", null, true, "http://localhost/?query=PT2H15M")]
        [TestCase("http://localhost", "02:15:00", "P", false, "http://localhost/?query=PT2H15M")]
        [TestCase("http://localhost", "02:15:00", "", false, "http://localhost/?query=02:15:00")]
        [TestCase("http://localhost", "02:15:00", null, false, "http://localhost/?query=PT2H15M")]
        public void AppendQuery_TimeSpan(string endpoint, string value, string format, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            var timeSpan = TimeSpan.Parse(value);
            builder.AppendQuery("query", timeSpan, format, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", "3f2504e0-4f89-11d3-9a0c-0305e82c3301", true, "http://localhost/?query=3f2504e0-4f89-11d3-9a0c-0305e82c3301")]
        [TestCase("http://localhost", "3f2504e0-4f89-11d3-9a0c-0305e82c3301", false, "http://localhost/?query=3f2504e0-4f89-11d3-9a0c-0305e82c3301")]
        public void AppendQuery_Guid(string endpoint, string value, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            var guid = Guid.Parse(value);
            builder.AppendQuery("query", guid, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }

        [TestCase("http://localhost", new[] { "hello", "world" }, ",", true, "http://localhost/?query=hello%2Cworld")]
        [TestCase("http://localhost", new[] { "hello", "world" }, ";", true, "http://localhost/?query=hello%3Bworld")]
        [TestCase("http://localhost", new[] { "hello", "world" }, "|", true, "http://localhost/?query=hello|world")]
        [TestCase("http://localhost", new[] { "hello", "world" }, ",", false, "http://localhost/?query=hello,world")]
        [TestCase("http://localhost", new[] { "hello", "world" }, ";", false, "http://localhost/?query=hello;world")]
        [TestCase("http://localhost", new[] { "hello", "world" }, "|", false, "http://localhost/?query=hello|world")]
        public void AppendQueryDelimited(string endpoint, IEnumerable<string> value, string delimiter, bool escape, string expected)
        {
            var builder = new ClientUriBuilder();
            builder.Reset(new Uri(endpoint));

            builder.AppendQueryDelimited("query", value, delimiter, null, escape);

            Assert.AreEqual(expected, builder.ToUri().ToString());
        }
    }
}
