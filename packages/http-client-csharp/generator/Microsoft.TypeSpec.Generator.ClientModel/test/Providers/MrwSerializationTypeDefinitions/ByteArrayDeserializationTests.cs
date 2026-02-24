// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Input.InputPrimitiveTypeKind;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class ByteArrayDeserializationTests
    {
        [SetUp]
        public void SetUp()
        {
            // Simulate a custom type factory that maps bytes type to byte[] instead of BinaryData,
            // as some generators (e.g., Azure SDK) do.
            MockHelpers.LoadMockGenerator(
                createSerializationsCore: (inputType, typeProvider)
                    => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)] : [],
                createCSharpTypeCore: (inputType) => inputType is InputPrimitiveType { Kind: InputPrimitiveTypeKind.Bytes }
                    ? new CSharpType(typeof(byte[]))
                    : null!,
                createCSharpTypeCoreFallback: (inputType) => inputType is InputPrimitiveType { Kind: InputPrimitiveTypeKind.Bytes });
        }

        private class MockMrwProvider : MrwSerializationTypeDefinition
        {
            public MockMrwProvider(InputModelType inputModel, ModelProvider modelProvider)
                : base(inputModel, modelProvider)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods().Where(m => m.Signature.Name.StartsWith("Deserialize"))];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
        }

        [Test]
        public void TestDeserializationOfByteArrayPropertyUsesGetBytesFromBase64()
        {
            var inputModel = InputFactory.Model("TestModel", properties:
                [InputFactory.Property("data", InputPrimitiveType.Base64)]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(mrwProvider);

            var deserializationMethod = mrwProvider!.Methods.Where(m => m.Signature.Name.StartsWith("Deserialize")).FirstOrDefault();
            Assert.IsNotNull(deserializationMethod);

            var methodBody = deserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("GetBytesFromBase64(\"D\")"),
                $"byte[] property with Base64 format should use GetBytesFromBase64(\"D\"). Actual:\n{methodBody}");
            Assert.IsFalse(methodBody.Contains("EnumerateArray"),
                $"byte[] property should not use array enumeration. Actual:\n{methodBody}");
        }

        [Test]
        public void TestDeserializationOfBase64UrlByteArrayPropertyUsesGetBytesFromBase64()
        {
            var inputModel = InputFactory.Model("TestModel", properties:
                [InputFactory.Property("data", InputPrimitiveType.Base64Url)]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(mrwProvider);

            var deserializationMethod = mrwProvider!.Methods.Where(m => m.Signature.Name.StartsWith("Deserialize")).FirstOrDefault();
            Assert.IsNotNull(deserializationMethod);

            var methodBody = deserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("GetBytesFromBase64(\"U\")"),
                $"byte[] property with Base64Url format should use GetBytesFromBase64(\"U\"). Actual:\n{methodBody}");
            Assert.IsFalse(methodBody.Contains("EnumerateArray"),
                $"byte[] property should not use array enumeration. Actual:\n{methodBody}");
        }

        [Test]
        public void TestDeserializationOfNonBase64ByteArrayPropertyUsesGetRawText()
        {
            // A bytes type with no encoding falls through to the JSON-object fallback
            var bytesNoEncoding = new InputPrimitiveType(Bytes, "bytes", "TypeSpec.bytes");
            var inputModel = InputFactory.Model("TestModel", properties:
                [InputFactory.Property("data", bytesNoEncoding)]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.FirstOrDefault();
            Assert.IsNotNull(mrwProvider);

            var deserializationMethod = mrwProvider!.Methods.Where(m => m.Signature.Name.StartsWith("Deserialize")).FirstOrDefault();
            Assert.IsNotNull(deserializationMethod);

            var methodBody = deserializationMethod!.BodyStatements!.ToDisplayString();

            Assert.IsTrue(methodBody.Contains("GetRawText"),
                $"byte[] property with no encoding should use GetRawText() fallback. Actual:\n{methodBody}");
            Assert.IsTrue(methodBody.Contains("ToArray"),
                $"byte[] property with no encoding should call ToArray(). Actual:\n{methodBody}");
            Assert.IsFalse(methodBody.Contains("EnumerateArray"),
                $"byte[] property should not use array enumeration. Actual:\n{methodBody}");
        }
    }
}
