// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Linq;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Tests;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class ModelSerializationExtensionsDefinitionTests
    {
        [Test]
        public void ValidateModelSerializationExtensionsIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();

            Assert.IsNotNull(definition);
            Assert.AreEqual("ModelSerializationExtensions", definition.Name);
            Assert.IsNotNull(definition.DeclarationModifiers);
            Assert.IsTrue(definition.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));
            Assert.IsTrue(definition.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Static));
        }

        [Test]
        public void ValidateWireOptionsFieldIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var fields = definition.Fields;

            Assert.IsNotNull(fields);
            var wireOptionsField = fields.SingleOrDefault(f => f.Name == "WireOptions");
            Assert.IsNotNull(wireOptionsField, "WireOptions field should be generated");
            Assert.AreEqual(typeof(ModelReaderWriterOptions), wireOptionsField!.Type.FrameworkType);
            Assert.IsTrue(wireOptionsField.Modifiers.HasFlag(FieldModifiers.Internal));
            Assert.IsTrue(wireOptionsField.Modifiers.HasFlag(FieldModifiers.Static));
            Assert.IsTrue(wireOptionsField.Modifiers.HasFlag(FieldModifiers.ReadOnly));
            Assert.IsNotNull(wireOptionsField.InitializationValue);
        }

        [Test]
        public void ValidateJsonDocumentOptionsFieldIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var fields = definition.Fields;

            Assert.IsNotNull(fields);
            var jsonDocumentOptionsField = fields.SingleOrDefault(f => f.Name == "JsonDocumentOptions");
            Assert.IsNotNull(jsonDocumentOptionsField, "JsonDocumentOptions field should be generated");
            Assert.AreEqual(typeof(JsonDocumentOptions), jsonDocumentOptionsField!.Type.FrameworkType);
            Assert.IsTrue(jsonDocumentOptionsField.Modifiers.HasFlag(FieldModifiers.Internal));
            Assert.IsTrue(jsonDocumentOptionsField.Modifiers.HasFlag(FieldModifiers.Static));
            Assert.IsTrue(jsonDocumentOptionsField.Modifiers.HasFlag(FieldModifiers.ReadOnly));
            Assert.IsNotNull(jsonDocumentOptionsField.InitializationValue);
        }

        [Test]
        public void ValidateGetObjectMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var getObjectMethod = methods.SingleOrDefault(m => m.Signature.Name == "GetObject");
            Assert.IsNotNull(getObjectMethod, "GetObject method should be generated");
            Assert.AreEqual(typeof(object), getObjectMethod!.Signature.ReturnType?.FrameworkType);
            Assert.IsTrue(getObjectMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(getObjectMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(getObjectMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(1, getObjectMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonElement), getObjectMethod.Signature.Parameters[0].Type.FrameworkType);
        }

        [Test]
        public void ValidateGetBytesFromBase64MethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var getBytesMethod = methods.SingleOrDefault(m => m.Signature.Name == "GetBytesFromBase64");
            Assert.IsNotNull(getBytesMethod, "GetBytesFromBase64 method should be generated");
            Assert.AreEqual(typeof(byte[]), getBytesMethod!.Signature.ReturnType?.FrameworkType);
            Assert.IsTrue(getBytesMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(getBytesMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(getBytesMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(2, getBytesMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonElement), getBytesMethod.Signature.Parameters[0].Type.FrameworkType);
            Assert.AreEqual(typeof(string), getBytesMethod.Signature.Parameters[1].Type.FrameworkType);
        }

        [Test]
        public void ValidateGetDateTimeOffsetMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var getDateTimeOffsetMethod = methods.SingleOrDefault(m => m.Signature.Name == "GetDateTimeOffset");
            Assert.IsNotNull(getDateTimeOffsetMethod, "GetDateTimeOffset method should be generated");
            Assert.AreEqual(typeof(DateTimeOffset), getDateTimeOffsetMethod!.Signature.ReturnType?.FrameworkType);
            Assert.IsTrue(getDateTimeOffsetMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(getDateTimeOffsetMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(getDateTimeOffsetMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(2, getDateTimeOffsetMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonElement), getDateTimeOffsetMethod.Signature.Parameters[0].Type.FrameworkType);
            Assert.AreEqual(typeof(string), getDateTimeOffsetMethod.Signature.Parameters[1].Type.FrameworkType);
        }

        [Test]
        public void ValidateGetTimeSpanMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var getTimeSpanMethod = methods.SingleOrDefault(m => m.Signature.Name == "GetTimeSpan");
            Assert.IsNotNull(getTimeSpanMethod, "GetTimeSpan method should be generated");
            Assert.AreEqual(typeof(TimeSpan), getTimeSpanMethod!.Signature.ReturnType?.FrameworkType);
            Assert.IsTrue(getTimeSpanMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(getTimeSpanMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(getTimeSpanMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(2, getTimeSpanMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonElement), getTimeSpanMethod.Signature.Parameters[0].Type.FrameworkType);
            Assert.AreEqual(typeof(string), getTimeSpanMethod.Signature.Parameters[1].Type.FrameworkType);
        }

        [Test]
        public void ValidateGetCharMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var getCharMethod = methods.SingleOrDefault(m => m.Signature.Name == "GetChar");
            Assert.IsNotNull(getCharMethod, "GetChar method should be generated");
            Assert.AreEqual(typeof(char), getCharMethod!.Signature.ReturnType?.FrameworkType);
            Assert.IsTrue(getCharMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(getCharMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(getCharMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(1, getCharMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonElement), getCharMethod.Signature.Parameters[0].Type.FrameworkType);
        }

        [Test]
        public void ValidateThrowNonNullablePropertyIsNullMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var throwMethod = methods.SingleOrDefault(m => m.Signature.Name == "ThrowNonNullablePropertyIsNull");
            Assert.IsNotNull(throwMethod, "ThrowNonNullablePropertyIsNull method should be generated");
            Assert.IsNull(throwMethod!.Signature.ReturnType);
            Assert.IsTrue(throwMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(throwMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(throwMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(1, throwMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonProperty), throwMethod.Signature.Parameters[0].Type.FrameworkType);
        }

        [Test]
        public void ValidateGetRequiredStringMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var getRequiredStringMethod = methods.SingleOrDefault(m => m.Signature.Name == "GetRequiredString");
            Assert.IsNotNull(getRequiredStringMethod, "GetRequiredString method should be generated");
            Assert.AreEqual(typeof(string), getRequiredStringMethod!.Signature.ReturnType?.FrameworkType);
            Assert.IsTrue(getRequiredStringMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(getRequiredStringMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(getRequiredStringMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(1, getRequiredStringMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(JsonElement), getRequiredStringMethod.Signature.Parameters[0].Type.FrameworkType);
        }

        [Test]
        public void ValidateWriteStringValueMethodsAreGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var writeStringValueMethods = methods.Where(m => m.Signature.Name == "WriteStringValue").ToList();
            Assert.IsTrue(writeStringValueMethods.Count >= 4, "Multiple WriteStringValue methods should be generated");

            // Check DateTimeOffset version
            var dateTimeOffsetMethod = writeStringValueMethods.SingleOrDefault(m =>
                m.Signature.Parameters.Count == 3 &&
                m.Signature.Parameters[1].Type.FrameworkType == typeof(DateTimeOffset));
            Assert.IsNotNull(dateTimeOffsetMethod, "WriteStringValue for DateTimeOffset should be generated");

            // Check DateTime version
            var dateTimeMethod = writeStringValueMethods.SingleOrDefault(m =>
                m.Signature.Parameters.Count == 3 &&
                m.Signature.Parameters[1].Type.FrameworkType == typeof(DateTime));
            Assert.IsNotNull(dateTimeMethod, "WriteStringValue for DateTime should be generated");

            // Check TimeSpan version
            var timeSpanMethod = writeStringValueMethods.SingleOrDefault(m =>
                m.Signature.Parameters.Count == 3 &&
                m.Signature.Parameters[1].Type.FrameworkType == typeof(TimeSpan));
            Assert.IsNotNull(timeSpanMethod, "WriteStringValue for TimeSpan should be generated");

            // Check char version
            var charMethod = writeStringValueMethods.SingleOrDefault(m =>
                m.Signature.Parameters.Count == 2 &&
                m.Signature.Parameters[1].Type.FrameworkType == typeof(char));
            Assert.IsNotNull(charMethod, "WriteStringValue for char should be generated");
        }

        [Test]
        public void ValidateWriteBase64StringValueMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var writeBase64Method = methods.SingleOrDefault(m => m.Signature.Name == "WriteBase64StringValue");
            Assert.IsNotNull(writeBase64Method, "WriteBase64StringValue method should be generated");
            Assert.IsNull(writeBase64Method!.Signature.ReturnType);
            Assert.IsTrue(writeBase64Method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(writeBase64Method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(writeBase64Method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(3, writeBase64Method.Signature.Parameters.Count);
            Assert.AreEqual(typeof(byte[]), writeBase64Method.Signature.Parameters[1].Type.FrameworkType);
            Assert.AreEqual(typeof(string), writeBase64Method.Signature.Parameters[2].Type.FrameworkType);
        }

        [Test]
        public void ValidateWriteNumberValueMethodIsGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var writeNumberMethod = methods.SingleOrDefault(m => m.Signature.Name == "WriteNumberValue");
            Assert.IsNotNull(writeNumberMethod, "WriteNumberValue method should be generated");
            Assert.IsNull(writeNumberMethod!.Signature.ReturnType);
            Assert.IsTrue(writeNumberMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));
            Assert.IsTrue(writeNumberMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static));
            Assert.IsTrue(writeNumberMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension));
            Assert.AreEqual(3, writeNumberMethod.Signature.Parameters.Count);
            Assert.AreEqual(typeof(DateTimeOffset), writeNumberMethod.Signature.Parameters[1].Type.FrameworkType);
            Assert.AreEqual(typeof(string), writeNumberMethod.Signature.Parameters[2].Type.FrameworkType);
        }

        [Test]
        public void ValidateWriteObjectValueMethodsAreGenerated()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var writeObjectValueMethods = methods.Where(m => m.Signature.Name == "WriteObjectValue").ToList();
            Assert.AreEqual(2, writeObjectValueMethods.Count, "Two WriteObjectValue methods should be generated");

            // Check non-generic version
            var nonGenericMethod = writeObjectValueMethods.SingleOrDefault(m =>
                m.Signature.GenericArguments == null || m.Signature.GenericArguments.Count == 0);
            Assert.IsNotNull(nonGenericMethod, "Non-generic WriteObjectValue method should be generated");
            Assert.AreEqual(typeof(object), nonGenericMethod!.Signature.Parameters[1].Type.FrameworkType);

            // Check generic version
            var genericMethod = writeObjectValueMethods.SingleOrDefault(m =>
                m.Signature.GenericArguments != null && m.Signature.GenericArguments.Count == 1);
            Assert.IsNotNull(genericMethod, "Generic WriteObjectValue method should be generated");
        }

        [Test]
        public void ValidateAllMethodsHaveCorrectModifiers()
        {
            MockHelpers.LoadMockGenerator();

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            Assert.IsTrue(methods.Count > 0, "Methods should be generated");

            foreach (var method in methods)
            {
                Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public),
                    $"Method {method.Signature.Name} should be public");
                Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Static),
                    $"Method {method.Signature.Name} should be static");
                Assert.IsTrue(method.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Extension),
                    $"Method {method.Signature.Name} should be extension");
            }
        }

        [Test]
        public void ValidateSliceToStartOfPropertyName()
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [InputFactory.Model("dynamicModel", isDynamicModel: true)]);

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var method = methods.SingleOrDefault(m => m.Signature.Name == "SliceToStartOfPropertyName");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(definition, name => name == method!.Signature.Name));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateGetUtf8Bytes()
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [InputFactory.Model("dynamicModel", isDynamicModel: true)]);

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var method = methods.SingleOrDefault(m => m.Signature.Name == "GetUtf8Bytes");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(definition, name => name == method!.Signature.Name));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateGetFirstPropertyName()
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [InputFactory.Model("dynamicModel", isDynamicModel: true)]);

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var method = methods.SingleOrDefault(m => m.Signature.Name == "GetFirstPropertyName");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(definition, name => name == method!.Signature.Name));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateWriteDictionaryWithPatch()
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [InputFactory.Model("dynamicModel", isDynamicModel: true)]);

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var method = methods.SingleOrDefault(m => m.Signature.Name == "WriteDictionaryWithPatch");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(definition, name => name == method!.Signature.Name));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateTryGetIndex()
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [InputFactory.Model("dynamicModel", isDynamicModel: true)]);

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var method = methods.SingleOrDefault(m => m.Signature.Name == "TryGetIndex");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(definition, name => name == method!.Signature.Name));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void ValidateGetRemainder()
        {
            MockHelpers.LoadMockGenerator(inputModels: () => [InputFactory.Model("dynamicModel", isDynamicModel: true)]);

            var definition = new ModelSerializationExtensionsDefinition();
            var methods = definition.Methods;

            Assert.IsNotNull(methods);
            var method = methods.SingleOrDefault(m => m.Signature.Name == "GetRemainder");
            Assert.IsNotNull(method);

            var writer = new TypeProviderWriter(new FilteredMethodsTypeProvider(definition, name => name == method!.Signature.Name));
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
