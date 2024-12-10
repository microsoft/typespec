// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.OutputTypes
{
    internal class ScmKnownParametersTests
    {
        [TestCase]
        public void TestMatchConditionsParameter()
        {
            MockHelpers.LoadMockPlugin(matchConditionsType: () => typeof(int));

            var result = ClientModelPlugin.Instance.TypeFactory.MatchConditionsType;
            Assert.IsNotNull(result);
            Assert.AreEqual(new CSharpType(typeof(int)), result);
        }
    }
}
