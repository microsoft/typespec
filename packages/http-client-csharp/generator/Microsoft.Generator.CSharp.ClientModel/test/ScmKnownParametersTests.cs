// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Primitives;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    public class ScmKnownParametersTests
    {
        [Test]
        public void BinaryDataParametersHasValidation()
        {
            MockHelpers.LoadMockPlugin();
            var parameter = ScmKnownParameters.BinaryContent;
            Assert.AreEqual(ParameterValidationType.AssertNotNull, parameter.Validation);
        }
    }
}
