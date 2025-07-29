// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using BenchmarkDotNet.Attributes;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.ClientModel.Tests;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Tests.Common;

namespace Microsoft.TypeSpec.Generator.ClientModel.Perf
{
    [MemoryDiagnoser]
    public class ModelReaderWriterContextDefinitionBenchmark
    {
        private ModelReaderWriterContextDefinition? _contextDefinition;
        private Func<object, IReadOnlyList<AttributeStatement>>? _privateDelegate;

        [Params(1, 10, 100)]
        public int ModelCount;

        [Params(1, 10, 100)]
        public int SimplePropertyCount;

        [Params(0, 1, 2, 5)]
        public int NestingLevel;

        [GlobalSetup]
        public void Setup()
        {
            var generator = MockHelpers.LoadMockGenerator(inputModels: () => GetMockModels(ModelCount, SimplePropertyCount, NestingLevel));

            _contextDefinition = generator.Object.OutputLibrary.TypeProviders.OfType<ModelReaderWriterContextDefinition>().FirstOrDefault();

            var methodInfo = typeof(ModelReaderWriterContextDefinition).GetMethod("BuildAttributes", BindingFlags.Instance | BindingFlags.NonPublic);
            _privateDelegate = CreateDelegate<Func<object, IReadOnlyList<AttributeStatement>>>(methodInfo!);
        }

        [GlobalCleanup]
        public void Cleanup()
        {
            _contextDefinition = null;
        }

        [Benchmark]
        public IReadOnlyList<AttributeStatement> CollectBuildableTypes()
        {
            return _privateDelegate!(_contextDefinition!);
        }

        private IReadOnlyList<InputModelType> GetMockModels(int modelCount, int simplePropertyCount, int nestingLevel)
        {
            return
            [
                .. GetSimpleModels(modelCount, simplePropertyCount, nestingLevel),
            ];
        }

        private static IEnumerable<InputModelType> GetSimpleModels(int modelCount, int simplePropertyCount, int nestingLevel)
        {
            for (int i = 0; i < modelCount; i++)
            {
                yield return GetNestedModel(i, simplePropertyCount, nestingLevel);
            }
        }

        private static IEnumerable<InputModelProperty> GetSimpleProperties(int simplePropertyCount)
        {
            for (int i = 0; i < simplePropertyCount; i++)
            {
                yield return InputFactory.Property($"Property{i}", InputPrimitiveType.String, isRequired: true);
            }
        }

        private static InputModelType GetNestedModel(int modelNumber, int simplePropertyCount, int nestingLevel)
        {
            var nestedModel = GetRecursiveNestedModel(modelNumber, simplePropertyCount, nestingLevel);
            return InputFactory.Model(
                $"Model{modelNumber}",
                properties: nestedModel is null
                ? [.. GetSimpleProperties(simplePropertyCount)]
                : [.. GetSimpleProperties(simplePropertyCount), InputFactory.Property($"Property{simplePropertyCount}", nestedModel)]);
        }

        private static InputModelType? GetRecursiveNestedModel(int modelNumber, int simplePropertyCount, int nestingLevel)
        {
            if (nestingLevel <= 0)
                return null;

            var nestedModel = GetRecursiveNestedModel(modelNumber, simplePropertyCount, nestingLevel - 1);
            return InputFactory.Model(
                $"NestedModel{modelNumber}_{nestingLevel}",
                properties: nestedModel is null
                ? [.. GetSimpleProperties(simplePropertyCount)]
                : [.. GetSimpleProperties(simplePropertyCount), InputFactory.Property($"Property{simplePropertyCount}", nestedModel)]);
        }

        private static T CreateDelegate<T>(MethodInfo methodInfo)
        {
            var instanceParam = Expression.Parameter(typeof(object), "target");
            var parameters = methodInfo.GetParameters()
                .Select(p => Expression.Parameter(p.ParameterType, p.Name))
                .ToArray();

            var instanceCast = Expression.Convert(instanceParam, methodInfo.DeclaringType!);
            var methodCall = Expression.Call(instanceCast, methodInfo, parameters);

            var lambdaParams = new ParameterExpression[] { instanceParam }.Concat(parameters);
            var lambda = Expression.Lambda<T>(methodCall, lambdaParams);

            return lambda.Compile();
        }
    }
}
