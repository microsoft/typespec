// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Azure.Core;
using NUnit.Framework;
using ServiceVersionOverride_LowLevel;
using static ServiceVersionOverride_LowLevel.ServiceVersionOverrideClientOptions;

namespace AutoRest.TestServer.Tests
{
    public class ServiceVersionsOverrideTest
    {
        [Test]
        public void OverrideServiceVersions_ClientOptionsHasRequiredVersions()
        {
            var expected = GetVersionsOverride();
            var actual = Enum.GetValues(typeof(ServiceVersion))
                .Cast<ServiceVersion>()
                .Select(i => new ServiceVersionOverrideClientOptions(i).Version)
                .ToList();

            CollectionAssert.AreEqual(expected, actual);
        }

        [Test]
        public void OverrideServiceVersions_LastVersionIsTheLatest()
        {
            var expected = GetVersionsOverride().Last();
            var actual = new ServiceVersionOverrideClientOptions().Version;

            Assert.AreEqual(expected, actual);
        }

        private static IEnumerable<string> GetVersionsOverride()
            => GetOverrideServiceVersionsConstructorArgument()
                .Select(a => a.Value)
                .OfType<string>();

        private static IEnumerable<CustomAttributeTypedArgument> GetOverrideServiceVersionsConstructorArgument()
            => (IEnumerable<CustomAttributeTypedArgument>)typeof(ServiceVersionOverrideClientOptions).Assembly.CustomAttributes
                .Single(cad => cad.AttributeType == typeof(CodeGenOverrideServiceVersionsAttribute))
                .ConstructorArguments[0].Value!;
    }
}
