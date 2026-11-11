// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using _Type.Model.Visibility;
using NUnit.Framework;

namespace TestProjects.Spector.Tests.Http._Type.Model.Visibility
{
    public class TypeModelVisibilityTests : SpectorTestBase
    {
        [SpectorTest]
        public Task GetModel() => Test(async (host) =>
        {
            var response = await new VisibilityClient(host, null).GetModelAsync(new VisibilityModel
            {
                QueryProp = 123
            });
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("abc", response.Value.ReadProp);
        });

        [SpectorTest]
        public Task HeadModel() => Test(async (host) =>
        {
            var response = await new VisibilityClient(host, null).HeadModelAsync(new VisibilityModel
            {
                QueryProp = 123
            });
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task PatchModel() => Test(async (host) =>
        {
            using var content = BinaryContent.Create(BinaryData.FromObjectAsJson(new
            {
                updateProp = new[] { 1, 2 }
            }));
            var response = await new VisibilityClient(host, null).PatchModelAsync(content);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public void SharedModelAllowsPartialConstruction()
        {
            var model = new VisibilityModel
            {
                QueryProp = 123,
                DeleteProp = true
            };
            model.CreateProp.Add("foo");
            model.UpdateProp.Add(1);

            Assert.AreEqual(123, model.QueryProp);
            Assert.IsTrue(model.DeleteProp);
            CollectionAssert.AreEqual(new[] { "foo" }, model.CreateProp);
            CollectionAssert.AreEqual(new[] { 1 }, model.UpdateProp);
        }

        [SpectorTest]
        public Task Models_ReadOnlyRoundTrip() => Test(async (host) =>
        {
            var response = await new VisibilityClient(host, null).PutReadOnlyModelAsync(new ReadOnlyModel());
            Assert.AreEqual(3, response.Value.OptionalNullableIntList.Count);
            Assert.AreEqual(1, response.Value.OptionalNullableIntList[0]);
            Assert.AreEqual(2, response.Value.OptionalNullableIntList[1]);
            Assert.AreEqual(3, response.Value.OptionalNullableIntList[2]);
            Assert.AreEqual("value1", response.Value.OptionalStringRecord["k1"]);
            Assert.AreEqual("value2", response.Value.OptionalStringRecord["k2"]);
        });

        [SpectorTest]
        public void ReadOnlyPropertiesAreReadOnly()
        {
            var property = HasProperty(typeof(VisibilityModel), "ReadProp", BindingFlags.Public | BindingFlags.Instance);
            var listProperty = HasProperty(typeof(ReadOnlyModel), "OptionalNullableIntList", BindingFlags.Public | BindingFlags.Instance);

            Assert.Null(property.SetMethod);
            Assert.Null(listProperty.SetMethod);
            Assert.AreEqual(typeof(IReadOnlyList<int>), listProperty.PropertyType);
        }

        [SpectorTest]
        public void RequiredListsAreNotSettable()
        {
            var requiredStringList = HasProperty(typeof(VisibilityModel), nameof(VisibilityModel.ReadProp), BindingFlags.Public | BindingFlags.Instance);
            var requiredIntList = HasProperty(typeof(ReadOnlyModel), nameof(ReadOnlyModel.OptionalNullableIntList), BindingFlags.Public | BindingFlags.Instance);

            Assert.Null(requiredIntList.SetMethod);
            Assert.Null(requiredStringList.SetMethod);
        }

        [SpectorTest]
        public void ReadOnlyPropertiesAreDeserialized()
        {
            var model = ModelReaderWriter.Read<VisibilityModel>(BinaryData.FromString("{\"readProp\":\"abc\"}"));
            Assert.AreEqual("abc", model!.ReadProp);
        }

        private static PropertyInfo HasProperty(Type type, string name, BindingFlags bindingFlags)
        {
            var parameterInfo = type.GetProperties(bindingFlags).FirstOrDefault(p => p.Name == name);
            Assert.NotNull(parameterInfo, $"Property '{name}' is not found");
            return parameterInfo!;
        }
    }
}
