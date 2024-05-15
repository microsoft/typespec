// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using System;
using System.ClientModel.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal class SystemModelSerializationTypeProviderTests
    {
        // This test validates the json model serialization write method is built correctly
        [Test]
        public void TestBuildJsonModelWriteMethod()
        {
            var jsonModelInterfaceType = new CSharpType(typeof(IJsonModel<object>));
            var method = SystemModelSerializationTypeProvider.BuildJsonModelWriteMethod(jsonModelInterfaceType);

            Assert.IsNotNull(method);
            Assert.AreEqual(new CSharpMethodKinds(SystemCSharpMethodKinds.JsonModelSerializationWrite), method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(jsonModelInterfaceType, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            Assert.IsNull(methodSignature?.ReturnType);
        }

        // This test validates the json model deserialization create method is built correctly
        [Test]
        public void TestBuildJsonModelCreateMethod()
        {
            var jsonInterface = new CSharpType(typeof(IJsonModel<object>));
            var method = SystemModelSerializationTypeProvider.BuildJsonModelCreateMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(new CSharpMethodKinds(SystemCSharpMethodKinds.JsonModelDeserializationCreate), method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Create", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(2, methodSignature?.Parameters.Count);
            var expectedReturnType = jsonInterface.Arguments[0];
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model serialization write method is built correctly
        [Test]
        public void TestBuildIModelWriteMethodMethod()
        {
            var jsonInterface = new CSharpType(typeof(IPersistableModel<object>));
            var method = SystemModelSerializationTypeProvider.BuildIModelWriteMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(new CSharpMethodKinds(SystemCSharpMethodKinds.IModelSerializationWrite), method?.Kind);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("Write", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(BinaryData));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);
        }

        // This test validates the I model deserialization create method is built correctly
        [Test]
        public void TestBuildIModelDeserializationMethod()
        {
            var jsonInterface = new CSharpType(typeof(IPersistableModel<object>));
            var method = SystemModelSerializationTypeProvider.BuildIModelCreateMethod(jsonInterface);

            Assert.IsNotNull(method);
            Assert.AreEqual(new CSharpMethodKinds(SystemCSharpMethodKinds.IModelDeserializationCreate), method?.Kind);

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
            var method = SystemModelSerializationTypeProvider.BuildIModelGetFormatFromOptionsMethod(jsonInterface);

            Assert.IsNotNull(method);

            var methodSignature = method?.Signature as MethodSignature;
            Assert.IsNotNull(methodSignature);
            Assert.AreEqual("GetFormatFromOptions", methodSignature?.Name);
            Assert.AreEqual(jsonInterface, methodSignature?.ExplicitInterface);
            Assert.AreEqual(1, methodSignature?.Parameters.Count);
            var expectedReturnType = new CSharpType(typeof(string));
            Assert.AreEqual(expectedReturnType, methodSignature?.ReturnType);

            var methodBody = method?.BodyExpression;
            Assert.IsNotNull(methodBody);
        }
    }
}
