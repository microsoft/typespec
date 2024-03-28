// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using NUnit.Framework;
using AutoRest.CSharp.Utilities;

namespace AutoRest.TestServer.Tests
{
    public class CachedDictionaryTests
    {
        [Test]
        public void IsReadOnly()
        {
            var d = new CachedDictionary<int, int> (() => new Dictionary<int, int>());
            Assert.Throws(Is.InstanceOf<NotSupportedException>(), () =>
            {
                ((IDictionary<int, int>)d).Add(42, 0);
                Assert.Fail($"Returned instead of throwing");
            });
        }

        [Test]
        public void CallsGenerateOnFirstRead()
        {
            bool isCreated = false;
            var d = new CachedDictionary<int, int> (() => {
                isCreated = true;
                return new Dictionary<int, int>() { { 0, 42 } };
            });
            Assert.AreEqual(42, d[0]);
            Assert.True (isCreated);
        }
    }
}
