// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System;
using System.Linq;
using System.Threading.Tasks;
using Versioning.RenamedFrom.V2;
using Versioning.RenamedFrom.V2.Models;

namespace TestProjects.CadlRanch.Tests.Http.Versioning.RenamedFrom.V2
{
    public class VersioningRenamedFromTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public void TestRenamedMembers()
        {
            /* check the renamed model from `OldModel` to `NewModel` */
            Assert.IsNull(Type.GetType("Versioning.RenamedFrom.V2.Models.OldModel"));
            Assert.IsNotNull(Type.GetType("Versioning.RenamedFrom.V2.Models.NewModel"));

            /* check the renamed property of model */
            var properties = typeof(NewModel).GetProperties();
            Assert.IsNotNull(properties);
            Assert.AreEqual(3, properties.Length);
            Assert.IsNull(typeof(NewModel).GetProperty("OldProp"));
            Assert.IsNotNull(typeof(NewModel).GetProperty("NewProp"));

            /* check the renamed enum from `OldEnum` to `NewEnum` */
            Assert.IsNull(Type.GetType("Versioning.RenamedFrom.V2.Models.OldEnum"));
            Assert.IsNotNull(Type.GetType("Versioning.RenamedFrom.V2.Models.NewEnum"));

            /* check the renamed enum value */
            var enumValues = typeof(NewEnum).GetEnumNames();
            Assert.IsNotNull(enumValues);
            Assert.AreEqual(1, enumValues.Length);
            Assert.IsFalse(enumValues.Contains("OldEnumMember"));
            Assert.IsTrue(enumValues.Contains("NewEnumMember"));

            /* check the renamed operation */
            var oldMethods = typeof(RenamedFromClient).GetMethods().Where(m => m.Name == "OldOp" || m.Name == "OldOpAsync");
            Assert.AreEqual(0, oldMethods.Count());
            var newMethods = typeof(RenamedFromClient).GetMethods().Where(m => m.Name == "NewOp" || m.Name == "NewOpAsync");
            Assert.AreEqual(4, newMethods.Count());

            /* check the renamed interface */
            Assert.IsNull(Type.GetType("Versioning.RenamedFrom.V2.OldInterface"));
            Assert.IsNotNull(Type.GetType("Versioning.RenamedFrom.V2.NewInterface"));
        }

        [CadlRanchTest]
        public Task Versioning_RenamedFrom_NewOp() => Test(async (host) =>
        {
            NewModel body = new NewModel("foo", NewEnum.NewEnumMember, BinaryData.FromObjectAsJson(10));
            var response = await new RenamedFromClient(host).NewOpAsync("bar", body);
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.NewProp);
            Assert.AreEqual(NewEnum.NewEnumMember, response.Value.EnumProp);
            Assert.AreEqual(10, response.Value.UnionProp.ToObjectFromJson<int>());
        });

        [CadlRanchTest]
        public Task Versioning_RenamedFrom_NewInterface() => Test(async (host) =>
        {
            NewModel body = new NewModel("foo", NewEnum.NewEnumMember, BinaryData.FromObjectAsJson(10));
            var response = await new RenamedFromClient(host).GetNewInterfaceClient().NewOpInNewInterfaceAsync(body);
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("foo", response.Value.NewProp);
            Assert.AreEqual(NewEnum.NewEnumMember, response.Value.EnumProp);
            Assert.AreEqual(10, response.Value.UnionProp.ToObjectFromJson<int>());
        });
    }
}
