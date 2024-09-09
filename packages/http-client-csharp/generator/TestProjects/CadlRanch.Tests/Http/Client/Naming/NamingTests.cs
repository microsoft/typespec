// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using Client.Naming;
using Client.Naming.Models;
using NUnit.Framework;
using ClientModel = Client.Naming.Models.ClientModel;

namespace TestProjects.CadlRanch.Tests.Http.Client.Naming
{
    public class ClientNamingTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task Client() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ClientAsync(new ClientNameModel(true));
            Assert.AreEqual(204, response.GetRawResponse().Status);

            Assert.NotNull(typeof(ClientNameModel).GetProperty("ClientName"));
            Assert.IsNull(typeof(ClientNameModel).GetProperty("DefaultName"));
        });

        [CadlRanchTest]
        public Task Language() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).LanguageAsync(new LanguageClientNameModel(true));
            Assert.AreEqual(204, response.GetRawResponse().Status);

            Assert.NotNull(typeof(LanguageClientNameModel).GetProperty("CSName"));
            Assert.IsNull(typeof(LanguageClientNameModel).GetProperty("DefaultName"));
        });

        [CadlRanchTest]
        public Task CompatibleWithEncodedName() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).CompatibleWithEncodedNameAsync(new ClientNameAndJsonEncodedNameModel(true));
            Assert.AreEqual(204, response.GetRawResponse().Status);

            Assert.NotNull(typeof(ClientNameModel).GetProperty("ClientName"));
            Assert.IsNull(typeof(ClientNameModel).GetProperty("DefaultName"));
        });

        [CadlRanchTest]
        public Task Operation() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ClientNameAsync();
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Parameter() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ParameterAsync(clientName: "true");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Request() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).RequestAsync(clientName: "true");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Response() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ResponseAsync();
            Assert.IsTrue(response.GetRawResponse().Headers.TryGetValue("default-name", out _));
            foreach (var header in response.GetRawResponse().Headers)
            {
                var key = header.Key;
                if (key == "default-name")
                {
                    var value = header.Value;
                    Assert.AreEqual("true", value);
                }
            }
        });

        [CadlRanchTest]
        public Task ModelClient() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).GetClientModelClient().ClientAsync(new ClientModel(true));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task ModelLanguage() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).GetClientModelClient().LanguageAsync(new CSModel(true));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task UnionEnumName() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).GetUnionEnumClient().UnionEnumNameAsync(ClientExtensibleEnum.EnumValue1);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task UnionEnumMemberName() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).GetUnionEnumClient().UnionEnumMemberNameAsync(ExtensibleEnum.ClientEnumValue1);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
