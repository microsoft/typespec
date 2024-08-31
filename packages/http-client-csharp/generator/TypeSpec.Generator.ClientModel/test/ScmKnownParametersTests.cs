// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using TypeSpec.Generator.ClientModel.Primitives;
using TypeSpec.Generator.Primitives;
using NUnit.Framework;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Tests
{
    public class ScmKnownParametersTests
    {
        [OneTimeSetUp]
        public void Setup()
        {
            MockHelpers.LoadMockPlugin();

        }

        [Test]
        public void BinaryDataParameterHasValidation()
        {
            var parameter = ScmKnownParameters.BinaryContent;
            Assert.AreEqual(ParameterValidationType.AssertNotNull, parameter.Validation);
        }

        [Test]
        public void RepeatabilityRequestIdParamHasDefaultValue()
        {
            var parameter = ScmKnownParameters.RepeatabilityRequestId;
            var expectedDefaultValue = Static(typeof(Guid)).Invoke(nameof(Guid.NewGuid)).Invoke(nameof(string.ToString));
            Assert.AreEqual(expectedDefaultValue, parameter.DefaultValue);
        }

        [Test]
        public void RepeatabilityFirstSentParamHasDefaultValue()
        {
            var parameter = ScmKnownParameters.RepeatabilityFirstSent;
            var expectedDefaultValue = Static(typeof(DateTimeOffset)).Property(nameof(DateTimeOffset.Now));
            Assert.AreEqual(expectedDefaultValue, parameter.DefaultValue);
        }
    }
}
