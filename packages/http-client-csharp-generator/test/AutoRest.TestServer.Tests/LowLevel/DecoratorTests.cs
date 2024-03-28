// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Reflection;
using ModelsTypeSpec;
using ModelsTypeSpec.Models;
using NUnit.Framework;

namespace AutoRest.LowLevel.Tests
{
    public class DecoratorTests
    {
        [Test]
#pragma warning disable CS0618
        public void DeprecateDataTypes([Values(
            typeof(RoundTripOptionalModel),
            typeof(FixedIntEnum),
            typeof(ExtensibleEnum)
            )] Type type)
#pragma warning restore CS0618
        {
            var attribute = type.GetCustomAttribute(typeof(ObsoleteAttribute));
            Assert.IsNotNull(attribute);
            Assert.AreEqual("deprecated for test", ((ObsoleteAttribute)attribute).Message);
        }

        [TestCase(typeof(ModelsTypeSpecClient), "InputToRoundTripReadOnly")]
        public void DeprecatedOperations(Type client, string operationBaseName)
        {
            var methods = client.GetMethods(BindingFlags.Public | BindingFlags.Instance);
            Assert.AreEqual(4, methods.Where(m =>
            {
                if (m.Name == operationBaseName || m.Name == (operationBaseName + "Async"))
                {

                    var attribute = m.GetCustomAttribute(typeof(ObsoleteAttribute));
                    if (attribute is ObsoleteAttribute obsoleteAttribute)
                    {
                        if (obsoleteAttribute.Message == "deprecated for test")
                        {
                            return true;
                        }
                    };
                }
                return false;
            }).Count());
        }
    }
}
