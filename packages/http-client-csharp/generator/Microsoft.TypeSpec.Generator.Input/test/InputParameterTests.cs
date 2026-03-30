// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Input.Tests
{
    public class InputParameterTests
    {
        [Test]
        public void OriginalNameIsSetFromConstructor()
        {
            var parameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32);

            Assert.AreEqual("top", parameter.OriginalName);
        }

        [Test]
        public void OriginalNameIsPreservedAfterUpdate()
        {
            var parameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32);
            parameter.Update(name: "maxCount");

            Assert.AreEqual("maxCount", parameter.Name);
            Assert.AreEqual("top", parameter.OriginalName);
        }

        [Test]
        public void OriginalNameIsPreservedAfterMultipleUpdates()
        {
            var parameter = InputFactory.QueryParameter("top", InputPrimitiveType.Int32);
            parameter.Update(name: "maxCount");
            parameter.Update(name: "anotherName");

            Assert.AreEqual("anotherName", parameter.Name);
            Assert.AreEqual("top", parameter.OriginalName);
        }

        [Test]
        public void OriginalNameFallsBackToNameWhenConstructedWithNull()
        {
            // This simulates the deserialization pattern where converters pass null! to the
            // constructor and then set Name via the internal setter afterward.
            var parameter = new InputQueryParameter(
                name: null!,
                summary: null,
                doc: null,
                type: InputPrimitiveType.Int32,
                isRequired: false,
                isReadOnly: false,
                access: null,
                serializedName: "top",
                collectionFormat: null,
                explode: false,
                isApiVersion: false,
                defaultValue: null,
                scope: InputParameterScope.Method,
                arraySerializationDelimiter: null);

            // Simulate what the JSON converter does: set Name after construction
            parameter.Name = "top";

            Assert.AreEqual("top", parameter.OriginalName);
        }

        [Test]
        public void OriginalNameCapturedBeforeFirstMutationForDeserializedParameter()
        {
            // Simulates deserialization followed by a rename mutation
            var parameter = new InputQueryParameter(
                name: null!,
                summary: null,
                doc: null,
                type: InputPrimitiveType.Int32,
                isRequired: false,
                isReadOnly: false,
                access: null,
                serializedName: "top",
                collectionFormat: null,
                explode: false,
                isApiVersion: false,
                defaultValue: null,
                scope: InputParameterScope.Method,
                arraySerializationDelimiter: null);

            // Simulate what the JSON converter does: set Name after construction
            parameter.Name = "top";

            // Simulate the rename that happens in GetMethodParameters
            parameter.Update(name: "maxCount");

            Assert.AreEqual("maxCount", parameter.Name);
            Assert.AreEqual("top", parameter.OriginalName);
        }

        [Test]
        public void OriginalNameMatchesNameWhenNoUpdateOccurs()
        {
            var parameter = InputFactory.QueryParameter("filter", InputPrimitiveType.String);

            Assert.AreEqual("filter", parameter.Name);
            Assert.AreEqual("filter", parameter.OriginalName);
        }

        [Test]
        public void ParamAliasIsSetFromFactory()
        {
            var parameter = InputFactory.MethodParameter("blobName", InputPrimitiveType.String, paramAlias: "name");

            Assert.AreEqual("blobName", parameter.Name);
            Assert.AreEqual("name", parameter.ParamAlias);
        }

        [Test]
        public void ParamAliasIsNullByDefault()
        {
            var parameter = InputFactory.MethodParameter("blobName", InputPrimitiveType.String);

            Assert.AreEqual("blobName", parameter.Name);
            Assert.IsNull(parameter.ParamAlias);
        }
    }
}
