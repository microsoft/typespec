// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.Tests.Providers
{
    public class OptionalTests
    {
        [Test]
        public void List_Undefined_ReturnsFalse()
        {
            var list = new ChangeTrackingList<int>();
            Assert.IsFalse(Optional.IsCollectionDefined(list));
        }

        [Test]
        public void List_Defined_ReturnsTrue()
        {
            IList<int> innerList = new List<int> { 1, 2, 3 };
            var list = new ChangeTrackingList<int>(innerList);
            Assert.IsTrue(Optional.IsCollectionDefined(list));
        }

        [Test]
        public void Dict_Undefined_ReturnsFalse()
        {
            var dict = new ChangeTrackingDictionary<int, string>();
            Assert.IsFalse(Optional.IsCollectionDefined((IDictionary<int, string>)dict));
        }

        [Test]
        public void Dict_Defined_ReturnsTrue()
        {
            IDictionary<int, string> innerDict = new Dictionary<int, string> { { 1, "one" }, { 2, "two" } };
            var dict = new ChangeTrackingDictionary<int, string>(innerDict);
            Assert.IsTrue(Optional.IsCollectionDefined((IDictionary<int, string>)dict));
        }

        [Test]
        public void ReadOnlyDict_Undefined_ReturnsFalse()
        {
            var dict = new ChangeTrackingDictionary<int, string>();
            IReadOnlyDictionary<int, string> readOnlyDict = dict;
            Assert.IsFalse(Optional.IsCollectionDefined(readOnlyDict));
        }

        [Test]
        public void ReadOnlyDict_Defined_ReturnsTrue()
        {
            IReadOnlyDictionary<int, string> innerDict = new Dictionary<int, string> { { 1, "one" }, { 2, "two" } };
            var dict = new ChangeTrackingDictionary<int, string>(innerDict);
            IReadOnlyDictionary<int, string> readOnlyDict = dict;
            Assert.IsTrue(Optional.IsCollectionDefined(readOnlyDict));
        }

        [Test]
        public void Nullable_HasValue_ReturnsTrue()
        {
            int? value = 5;
            Assert.IsTrue(Optional.IsDefined(value));
        }

        [Test]
        public void Nullable_NoValue_ReturnsFalse()
        {
            int? value = null;
            Assert.IsFalse(Optional.IsDefined(value));
        }

        [Test]
        public void Obj_NotNull_ReturnsTrue()
        {
            var value = new object();
            Assert.IsTrue(Optional.IsDefined(value));
        }


        [Test]
        public void Json_Defined_ReturnsTrue()
        {
            var value = JsonDocument.Parse("{}").RootElement;
            Assert.IsTrue(Optional.IsDefined(value));
        }

        [Test]
        public void Json_Undefined_ReturnsFalse()
        {
            var value = new JsonElement();
            Assert.IsFalse(Optional.IsDefined(value));
        }

        [Test]
        public void Str_NotNull_ReturnsTrue()
        {
            string value = "test";
            Assert.IsTrue(Optional.IsDefined(value));
        }
    }
}
