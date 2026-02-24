// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    internal class InputDecoratorInfoExtensionsTests
    {
        [Test]
        public void GetClientOption_ReturnsBoolValue()
        {
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientOption",
                    new Dictionary<string, BinaryData>
                    {
                        { "name", BinaryData.FromString("\"enableFeatureFoo\"") },
                        { "value", BinaryData.FromString("true") },
                    })
            };

            var result = decorators.GetClientOption<bool>("enableFeatureFoo");

            Assert.IsTrue(result);
        }

        [Test]
        public void GetClientOption_ReturnsStringValue()
        {
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientOption",
                    new Dictionary<string, BinaryData>
                    {
                        { "name", BinaryData.FromString("\"myOption\"") },
                        { "value", BinaryData.FromString("\"someValue\"") },
                    })
            };

            var result = decorators.GetClientOption<string>("myOption");

            Assert.AreEqual("someValue", result);
        }

        [Test]
        public void GetClientOption_ReturnsIntValue()
        {
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientOption",
                    new Dictionary<string, BinaryData>
                    {
                        { "name", BinaryData.FromString("\"maxRetries\"") },
                        { "value", BinaryData.FromString("3") },
                    })
            };

            var result = decorators.GetClientOption<int>("maxRetries");

            Assert.AreEqual(3, result);
        }

        [Test]
        public void GetClientOption_ReturnsDefaultWhenKeyNotFound()
        {
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientOption",
                    new Dictionary<string, BinaryData>
                    {
                        { "name", BinaryData.FromString("\"otherOption\"") },
                        { "value", BinaryData.FromString("true") },
                    })
            };

            var result = decorators.GetClientOption<bool>("nonExistentOption");

            Assert.IsFalse(result);
        }

        [Test]
        public void GetClientOption_ReturnsDefaultWhenNoClientOptionDecorators()
        {
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientName",
                    new Dictionary<string, BinaryData>
                    {
                        { "rename", BinaryData.FromString("\"MyClient\"") },
                    })
            };

            var result = decorators.GetClientOption<bool>("enableFeatureFoo");

            Assert.IsFalse(result);
        }

        [Test]
        public void GetClientOption_ReturnsDefaultWhenDecoratorListIsEmpty()
        {
            var decorators = new List<InputDecoratorInfo>();

            var result = decorators.GetClientOption<bool>("enableFeatureFoo");

            Assert.IsFalse(result);
        }

        [Test]
        public void GetClientOption_ReturnsFirstMatchingKeyWhenMultipleClientOptions()
        {
            var decorators = new List<InputDecoratorInfo>
            {
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientOption",
                    new Dictionary<string, BinaryData>
                    {
                        { "name", BinaryData.FromString("\"optionA\"") },
                        { "value", BinaryData.FromString("\"valueA\"") },
                    }),
                new InputDecoratorInfo(
                    "Azure.ClientGenerator.Core.@clientOption",
                    new Dictionary<string, BinaryData>
                    {
                        { "name", BinaryData.FromString("\"optionB\"") },
                        { "value", BinaryData.FromString("42") },
                    }),
            };

            var resultA = decorators.GetClientOption<string>("optionA");
            var resultB = decorators.GetClientOption<int>("optionB");

            Assert.AreEqual("valueA", resultA);
            Assert.AreEqual(42, resultB);
        }

        [Test]
        public void GetClientOption_NullableReturnType_ReturnsNullWhenKeyNotFound()
        {
            var decorators = new List<InputDecoratorInfo>();

            var result = decorators.GetClientOption<string?>("missingOption");

            Assert.IsNull(result);
        }
    }
}
