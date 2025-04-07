// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using SampleTypeSpec;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class CustomizationAttributeTests
    {
        [Test]
        public void CodeGenMemberAttributeEmitted()
        {
            var codeGenMemberAttribute = new CodeGenMemberAttribute("PropertyName");
            Assert.AreEqual("PropertyName", codeGenMemberAttribute.OriginalName);
        }

        [Test]
        public void CodeGenSerializationAttributeEmitted()
        {
            var codeGenMemberAttribute = new CodeGenSerializationAttribute("PropertyName")
            {
                SerializationValueHook = "Foo",
                DeserializationValueHook = "Bar",
                PropertySerializationName = "Baz",
            };
            Assert.AreEqual("PropertyName", codeGenMemberAttribute.PropertyName);
            Assert.AreEqual("Foo", codeGenMemberAttribute.SerializationValueHook);
            Assert.AreEqual("Bar", codeGenMemberAttribute.DeserializationValueHook);
            Assert.AreEqual("Baz", codeGenMemberAttribute.PropertySerializationName);
        }

        [Test]
        public void CodeGenSuppressAttributeEmitted()
        {
            var codeGenSuppressAttribute = new CodeGenSuppressAttribute("PropertyName", typeof(string), typeof(int));
            Assert.AreEqual("PropertyName", codeGenSuppressAttribute.Member);
            Assert.AreEqual(new[] { typeof(string), typeof(int) }, codeGenSuppressAttribute.Parameters);
        }

        [Test]
        public void CodeGenTypeAttributeEmitted()
        {
            var codeGenTypeAttribute = new CodeGenTypeAttribute("PropertyName");
            Assert.AreEqual("PropertyName", codeGenTypeAttribute.OriginalName);
        }
    }
}
