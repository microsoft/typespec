// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.OutputTypes
{
    internal class ScmKnownParametersTests
    {
        [TestCase]
        public void TestMatchConditionsParameter()
        {
            MockHelpers.LoadMockGenerator(matchConditionsType: () => typeof(int));

            var result = ScmCodeModelGenerator.Instance.TypeFactory.MatchConditionsType;
            Assert.IsNotNull(result);
            Assert.AreEqual(new CSharpType(typeof(int)), result);
        }
    }
}
