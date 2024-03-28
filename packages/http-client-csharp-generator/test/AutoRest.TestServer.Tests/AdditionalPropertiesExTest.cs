// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using additionalProperties;
using additionalProperties.Models;
using AdditionalPropertiesEx.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class AdditionalPropertiesExTest
    {
        [Test]
        public void CanCreateStructWithAdditionalProperties()
        {
            var s = new InputAdditionalPropertiesModelStruct(123, new Dictionary<string, object>()
            {
                {"a", "b"},
                {"c", 2}
            });

            Assert.AreEqual(123, s.Id);
            Assert.AreEqual("b", s.AdditionalProperties["a"]);
            Assert.AreEqual(2, s.AdditionalProperties["c"]);
        }
    }
}
