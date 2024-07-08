// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using NUnit.Framework;
using UnbrandedTypeSpec.Models;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.ModelReaderWriterValidation
{
    public class ModelOperatorsTests
    {
        [Test]
        public async Task TestBinaryContent_Friend()
        {
            var model = new Friend("John Doe");
            using BinaryContent binaryContent = model;

            Assert.IsNotNull(binaryContent);

            using MemoryStream stream = new MemoryStream();
            await binaryContent.WriteToAsync(stream, CancellationToken.None);
            BinaryData serializedContent = ((IPersistableModel<object>)model).Write(ModelReaderWriterOptions.Json);

            Assert.AreEqual(serializedContent.ToArray(), stream.ToArray());
        }

        [Test]
        public void TestClientResult_Friend()
        {
            var responseContent = "{\"name\":\"John Doe\"}";
            var responseWithBody = new MockPipelineResponse(200);
            responseWithBody.SetContent(responseContent);
            ClientResult result = ClientResult.FromResponse(responseWithBody);

            Friend friend = (Friend)result;

            Assert.IsNotNull(friend);
            Assert.AreEqual("John Doe", friend.Name);
        }

        [Test]
        public async Task TestBinaryContent_ModelWithRequiredNullableProperties()
        {
            // Arrange
            int? requiredNullablePrimitive = 42;
            StringExtensibleEnum? requiredExtensibleEnum = new StringExtensibleEnum("Value1");
            StringFixedEnum? requiredFixedEnum = StringFixedEnum.One;
            ModelWithRequiredNullableProperties model = new(requiredNullablePrimitive, requiredExtensibleEnum, requiredFixedEnum);

            using BinaryContent binaryContent = model;

            Assert.IsNotNull(binaryContent);

            using MemoryStream stream = new MemoryStream();
            await binaryContent.WriteToAsync(stream, CancellationToken.None);
            BinaryData serializedContent = ((IPersistableModel<object>)model).Write(ModelReaderWriterOptions.Json);

            Assert.AreEqual(serializedContent.ToArray(), stream.ToArray());
        }

        [Test]
        public void TestClientResult_ModelWithRequiredNullableProperties()
        {
            string responseContent = "{\"requiredNullablePrimitive\": 42, \"requiredExtensibleEnum\": \"Value1\", \"requiredFixedEnum\": \"1\"}";
            var responseWithBody = new MockPipelineResponse(200);
            responseWithBody.SetContent(responseContent);
            ClientResult result = ClientResult.FromResponse(responseWithBody);

            // Act
            ModelWithRequiredNullableProperties model = (ModelWithRequiredNullableProperties)result;

            // Assert
            Assert.IsNotNull(model);
            Assert.AreEqual(42, model.RequiredNullablePrimitive);
            Assert.AreEqual(new StringExtensibleEnum("Value1"), model.RequiredExtensibleEnum);
            Assert.AreEqual(StringFixedEnum.One, model.RequiredFixedEnum);
        }
    }
}
