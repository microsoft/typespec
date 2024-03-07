// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using ParameterSequence_LowLevel;
using NUnit.Framework;

namespace AutoRest.LowLevel.Tests
{
    public class ParameterSequenceTests
    {
        [TestCase("GetItem", new string[] { "itemName", "origin", "version", "context" })]
        [TestCase("SelectItem", new string[] { "itemName", "origin", "version", "context" })]
        public void OptionalParameterAtEnd(string methodName, string[] parameterNames)
        {
            var method = typeof(ParameterSequenceClient).GetMethod(methodName);
            Assert.AreEqual(parameterNames, method.GetParameters().Select(p => p.Name).ToArray());
        }
    }
}
