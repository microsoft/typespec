// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.Expressions;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class SystemModelSnippetsTests
    {
        // This test validates the json model serialization method is built correctly
        [Test]
        public void TestBuildJsonModelSerializationMethod()
        {
            var jsonInterface = new CSharpType(typeof(IJsonModel<object>));
            var snippets = new SystemExtensibleSnippets.SystemModelSnippets();
            var method = snippets.BuildJsonModelSerializationMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(CSharpMethodKinds.JsonModelSerialization, method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);
        }

        // This test validates the json model deserialization method is built correctly
        [Test]
        public void TestBuildJsonModelDeerializationMethod()
        {
            var jsonInterface = new CSharpType(typeof(IJsonModel<object>));
            var snippets = new SystemExtensibleSnippets.SystemModelSnippets();
            var method = snippets.BuildJsonModelDeserializationMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(CSharpMethodKinds.JsonModelDeserialization, method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = jsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model serialization method is built correctly
        [Test]
        public void TestBuildIModelSerializationMethod()
        {
            var jsonInterface = new CSharpType(typeof(IPersistableModel<object>));
            var snippets = new SystemExtensibleSnippets.SystemModelSnippets();
            var method = snippets.BuildIModelSerializationMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(CSharpMethodKinds.IModelSerialization, method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(BinaryData));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model deserialization method is built correctly
        [Test]
        public void TestBuildIModelDeserializationMethod()
        {
            var jsonInterface = new CSharpType(typeof(IPersistableModel<object>));
            var snippets = new SystemExtensibleSnippets.SystemModelSnippets();
            var method = snippets.BuildIModelDeserializationMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(CSharpMethodKinds.IModelDeserialization, method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = jsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model get format method is built correctly
        [Test]
        public void TestBuildIModelGetFormatMethod()
        {
            var jsonInterface = new CSharpType(typeof(IPersistableModel<object>));
            var wireFormat = Snippets.Literal("W");
            var snippets = new SystemExtensibleSnippets.SystemModelSnippets();
            var method = snippets.BuildIModelGetFormatMethod(jsonInterface, wireFormat);

            Assert.IsNotNull(method);
            Assert.AreEqual(CSharpMethodKinds.IModelGetFormat, method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("GetFormatFromOptions", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(string));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }
    }
}
