// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelProviders
{
    public class NestedSinglePropertyTests
    {
        [SetUp]
        public void Setup()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void TestNestedSinglePropertyConvenienceProperty()
        {
            // Create the nested model structure from the issue:
            // model Child { third: string; }
            // model Parent { second: Child; }
            // model GrandParent { first: Parent; }
            
            var childModel = InputFactory.Model("Child", properties: [
                InputFactory.Property("third", InputPrimitiveType.String)
            ]);
            
            var parentModel = InputFactory.Model("Parent", properties: [
                InputFactory.Property("second", childModel)
            ]);
            
            var grandParentModel = InputFactory.Model("GrandParent", properties: [
                InputFactory.Property("first", parentModel)
            ]);

            MockHelpers.LoadMockGenerator(inputModelTypes: [childModel, parentModel, grandParentModel]);

            var childProvider = new ModelProvider(childModel);
            var parentProvider = new ModelProvider(parentModel);
            var grandParentProvider = new ModelProvider(grandParentModel);

            // Check if any convenience properties are generated
            var grandParentProperties = grandParentProvider.Properties;
            var parentProperties = parentProvider.Properties;
            var childProperties = childProvider.Properties;

            Console.WriteLine($"GrandParent properties: {string.Join(", ", grandParentProperties.Select(p => p.Name))}");
            Console.WriteLine($"Parent properties: {string.Join(", ", parentProperties.Select(p => p.Name))}");
            Console.WriteLine($"Child properties: {string.Join(", ", childProperties.Select(p => p.Name))}");

            // Look for the convenience property mentioned in the issue
            var secondThirdProperty = grandParentProperties.FirstOrDefault(p => p.Name.Contains("SecondThird"));
            if (secondThirdProperty != null)
            {
                Console.WriteLine($"Found SecondThird property on GrandParent");
                if (secondThirdProperty.Body is AutoPropertyBody apb && apb.HasSetter)
                {
                    Console.WriteLine($"SecondThird has setter");
                }
            }
        }
    }
}