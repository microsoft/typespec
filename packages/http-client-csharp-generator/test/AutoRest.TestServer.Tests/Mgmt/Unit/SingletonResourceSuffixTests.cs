// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Mgmt.Unit
{
    public class SingletonResourceSuffixTests
    {
        [TestCase("test/default", @"Id.AppendChildResource(""test"", ""default"")")]
        [TestCase("providers/Microsoft.Compute/test/default", @"Id.AppendProviderResource(""Microsoft.Compute"", ""test"", ""default"")")]
        [TestCase("providers/Microsoft.Compute/test1/name/test2/default", @"Id.AppendProviderResource(""Microsoft.Compute"", ""test1"", ""name"").AppendChildResource(""test2"", ""default"")")]
        [TestCase("providers/Microsoft.Compute/test1/name/test2/name2/test3/default", @"Id.AppendProviderResource(""Microsoft.Compute"", ""test1"", ""name"").AppendChildResource(""test2"", ""name2"").AppendChildResource(""test3"", ""default"")")]
        public void ValidateBuildResourceIdentifier(string suffixString, string expected)
        {
            var segments = suffixString.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var suffix = SingletonResourceSuffix.Parse(segments);
            var result = suffix.BuildResourceIdentifier(new FormattableStringToExpression($"Id"));
            var writer = new CodeWriter();
            writer.WriteValueExpression(result);
            Assert.AreEqual(expected, writer.ToString(false).Trim());
        }
    }
}
