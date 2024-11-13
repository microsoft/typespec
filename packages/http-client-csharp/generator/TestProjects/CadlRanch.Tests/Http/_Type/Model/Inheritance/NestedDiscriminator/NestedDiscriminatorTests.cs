// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Inheritance.NestedDiscriminator;
using _Type.Model.Inheritance.NestedDiscriminator.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Model.Inheritance.NestedDiscriminator
{
    public class NestedDiscriminatorTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task GetMissingDiscriminator() => Test(async (host) =>
        {
            var result = await new NestedDiscriminatorClient(host, null).GetMissingDiscriminatorAsync();
            Assert.IsNotNull(result.Value);
            Assert.AreEqual(1, result.Value.Age);
        });

        [CadlRanchTest]
        public Task GetModel() => Test(async (host) =>
        {
            var result = await new NestedDiscriminatorClient(host, null).GetModelAsync();
            Assert.IsInstanceOf<GoblinShark>(result.Value);
            Assert.AreEqual(1, result.Value.Age);
        });

        [CadlRanchTest]
        public Task GetRecursiveModel() => Test(async (host) =>
        {
            var result = await new NestedDiscriminatorClient(host, null).GetRecursiveModelAsync();
            Assert.IsInstanceOf<Salmon>(result.Value);

            var salmon = (Salmon)result.Value;
            Assert.AreEqual(1, salmon.Age);
            Assert.IsTrue(salmon.Partner is Shark);

            var shark = (Shark)salmon.Partner;
            Assert.AreEqual("saw", shark.Sharktype);
            Assert.IsInstanceOf<SawShark>(shark);
            Assert.AreEqual(2, salmon.Friends.Count);
            Assert.IsInstanceOf<Salmon>(salmon.Friends[0]);

            var salmonFriend = (Salmon)salmon.Friends[0];
            Assert.AreEqual(2, salmonFriend.Age);
            Assert.AreEqual(2, salmonFriend.Hate.Count);
            Assert.IsTrue(salmon.Hate.ContainsKey("key3"));
            Assert.IsInstanceOf<SawShark>(salmon.Hate["key3"]);
            Assert.IsTrue(salmon.Hate.ContainsKey("key4"));
            Assert.IsInstanceOf<Salmon>(salmon.Hate["key4"]);
        });

        [CadlRanchTest]
        public Task GetWrongDiscriminator() => Test(async (host) =>
        {
            var result = await new NestedDiscriminatorClient(host, null).GetWrongDiscriminatorAsync();
            Assert.IsInstanceOf<UnknownFish>(result.Value);
            Assert.AreEqual(1, result.Value.Age);
            Assert.AreEqual("wrongKind", result.Value.Kind);
        });

        [CadlRanchTest]
        public Task PutModel() => Test(async (host) =>
        {
            var body = new GoblinShark(1);
            var response = await new NestedDiscriminatorClient(host, null).PutModelAsync(body);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task PutRecursiveModel() => Test(async (host) =>
        {
            var body = new Salmon(1)
            {
                Partner = new SawShark(2),
                Friends =
                {
                    new Salmon(2)
                    {
                        Partner = new Salmon(3),
                        Hate = { { "key1", new Salmon(4) }, { "key2", new GoblinShark(2) } }
                    },
                    new GoblinShark(3)
                },
                Hate =
                {
                    { "key3", new SawShark(3) },
                    { "key4", new Salmon(2) { Friends = { new Salmon(1), new GoblinShark(4) } } }
                }
            };
            var response = await new NestedDiscriminatorClient(host, null).PutRecursiveModelAsync(body);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
