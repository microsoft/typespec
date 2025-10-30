// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.SourceInput;
using Microsoft.TypeSpec.Generator.Tests.Common;
using Moq;
using Moq.Protected;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal static class MockHelpers
    {
        public const string TestHelpersFolder = "TestHelpers";

        public async static Task<Mock<CodeModelGenerator>> LoadMockGeneratorAsync(
            Func<InputType, CSharpType?>? createCSharpTypeCore = null,
            Func<InputModelType, ModelProvider?>? createModelCore = null,
            Func<InputEnumType, TypeProvider?, EnumProvider?>? createEnumCore = null,
            Func<OutputLibrary>? createOutputLibrary = null,
            string? configuration = null,
            InputModelType[]? inputModelTypes = null,
            InputEnumType[]? inputEnumTypes = null,
            InputLiteralType[]? inputLiteralTypes = null,
            Func<Task<Compilation>>? compilation = null,
            Func<Task<Compilation>>? lastContractCompilation = null,
            IEnumerable<MetadataReference>? additionalMetadataReferences = null,
            IEnumerable<string>? sharedSourceDirectories = null,
            IEnumerable<string>? typesToKeep = null,
            bool includeXmlDocs = false,
            string? inputNamespaceName = null,
            string? outputPath = null)
        {
            var mockGenerator = LoadMockGenerator(
                createCSharpTypeCore,
                createModelCore,
                createEnumCore,
                createOutputLibrary,
                configuration,
                inputModelTypes,
                inputEnumTypes,
                inputLiteralTypes,
                additionalMetadataReferences,
                sharedSourceDirectories,
                typesToKeep,
                includeXmlDocs,
                inputNamespaceName,
                outputPath);

            var compilationResult = compilation == null ? null : await compilation();
            var lastContractCompilationResult = lastContractCompilation == null ? null : await lastContractCompilation();

            var sourceInputModel = new Mock<SourceInputModel>(() => new SourceInputModel(compilationResult, lastContractCompilationResult)) { CallBase = true };
            mockGenerator.Setup(p => p.SourceInputModel).Returns(sourceInputModel.Object);

            return mockGenerator;
        }

        public static Mock<CodeModelGenerator> LoadMockGenerator(
            Func<InputType, CSharpType?>? createCSharpTypeCore = null,
            Func<InputModelType, ModelProvider?>? createModelCore = null,
            Func<InputEnumType, TypeProvider?, EnumProvider?>? createEnumCore = null,
            Func<OutputLibrary>? createOutputLibrary = null,
            string? configuration = null,
            InputModelType[]? inputModelTypes = null,
            InputEnumType[]? inputEnumTypes = null,
            InputLiteralType[]? inputLiteralTypes = null,
            IEnumerable<MetadataReference>? additionalMetadataReferences = null,
            IEnumerable<string>? sharedSourceDirectories = null,
            IEnumerable<string>? typesToKeep = null,
            bool includeXmlDocs = false,
            string? inputNamespaceName = null,
            string? outputPath = null)
        {
            // reset the type cache on TypeReferenceExpression
            var resetCacheMethod = typeof(TypeReferenceExpression).GetMethod("ResetCache", BindingFlags.Static | BindingFlags.NonPublic);
            resetCacheMethod!.Invoke(null, null);

            outputPath = outputPath ?? Path.Combine(AppContext.BaseDirectory, TestHelpersFolder);
            if (includeXmlDocs)
            {
                configuration = "{\"disable-xml-docs\": false, \"package-name\": \"Sample.Namespace\"}";
            }
            // initialize the singleton instance of the generator
            var mockGenerator = new Mock<CodeModelGenerator>(new GeneratorContext(Configuration.Load(outputPath, configuration))) { CallBase = true };

            mockGenerator.Setup(p => p.Emitter).Returns(new Emitter(Console.OpenStandardOutput()));

            var mockTypeFactory = new Mock<TypeFactory>() { CallBase = true };

            if (createCSharpTypeCore != null)
            {
                mockTypeFactory.Protected().Setup<CSharpType?>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns((InputType inputType) => createCSharpTypeCore.Invoke(inputType));
            }

            if (createModelCore != null)
            {
                mockTypeFactory.Protected().Setup<ModelProvider?>("CreateModelCore", ItExpr.IsAny<InputModelType>()).Returns((InputModelType inputModel) => createModelCore.Invoke(inputModel));
            }

            if (createEnumCore != null)
            {
                mockTypeFactory.Protected().Setup<EnumProvider?>("CreateEnumCore", ItExpr.IsAny<InputEnumType>(), ItExpr.IsAny<TypeProvider?>()).Returns((InputEnumType inputEnum, TypeProvider? type) => createEnumCore.Invoke(inputEnum, type));
            }

            if (createOutputLibrary != null)
            {
                mockGenerator.Setup(p => p.OutputLibrary).Returns(createOutputLibrary);
            }

            Mock<InputLibrary> mockInputLibrary = new Mock<InputLibrary>() { CallBase = true };
            mockInputLibrary.Setup(l => l.InputNamespace).Returns(InputFactory.Namespace(
                inputNamespaceName ?? "Sample",
                models: inputModelTypes,
                enums: inputEnumTypes,
                constants: inputLiteralTypes));

            mockGenerator.Setup(p => p.InputLibrary).Returns(mockInputLibrary.Object);

            mockGenerator.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);

            var sourceInputModel = new Mock<SourceInputModel>(() => new SourceInputModel(null, null)) { CallBase = true };
            mockGenerator.Setup(p => p.SourceInputModel).Returns(sourceInputModel.Object);

            if (additionalMetadataReferences != null)
            {
                foreach (var reference in additionalMetadataReferences)
                {
                    mockGenerator.Object.AddMetadataReference(reference);
                }
            }

            if (sharedSourceDirectories != null)
            {
                foreach (var directory in sharedSourceDirectories)
                {
                    mockGenerator.Object.AddSharedSourceDirectory(directory);
                }
            }

            if (typesToKeep != null)
            {
                foreach (var type in typesToKeep)
                {
                    mockGenerator.Object.AddTypeToKeep(type);
                }
            }

            CodeModelGenerator.Instance = mockGenerator.Object;

            return mockGenerator;
        }
    }
}
