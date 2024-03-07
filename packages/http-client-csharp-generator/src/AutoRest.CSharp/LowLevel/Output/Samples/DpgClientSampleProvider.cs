// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Samples.Models;
using AutoRest.CSharp.Utilities;
using NUnit.Framework;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.LowLevel.Output.Samples
{
    internal class DpgClientSampleProvider : DpgClientTestProvider
    {
        public DpgClientSampleProvider(string defaultNamespace, LowLevelClient client, SourceInputModel? sourceInputModel) : base($"{defaultNamespace}.Samples", $"Samples_{client.Declaration.Name}", client, sourceInputModel)
        {
            _samples = client.ClientMethods.SelectMany(m => m.Samples);
        }

        protected override IEnumerable<string> BuildUsings()
        {
            if (Configuration.IsBranded)
                yield return "Azure.Identity"; // we need this using because we might need to call `new DefaultAzureCredential` from `Azure.Identity` package, but Azure.Identity package is not a dependency of the generator project.
        }

        private readonly IEnumerable<DpgOperationSample> _samples;
        private Dictionary<MethodSignature, List<DpgOperationSample>>? methodToSampleDict;
        private Dictionary<MethodSignature, List<DpgOperationSample>> MethodToSampleDict => methodToSampleDict ??= BuildMethodToSampleCache();

        private Dictionary<MethodSignature, List<DpgOperationSample>> BuildMethodToSampleCache()
        {
            var result = new Dictionary<MethodSignature, List<DpgOperationSample>>();
            foreach (var sample in _samples)
            {
                result.AddInList(sample.OperationMethodSignature.WithAsync(false), sample);
                result.AddInList(sample.OperationMethodSignature.WithAsync(true), sample);
            }

            return result;
        }

        public IEnumerable<(string ExampleInformation, string TestMethodName)> GetSampleInformation(MethodSignature signature, bool isAsync)
        {
            if (MethodToSampleDict.TryGetValue(signature, out var result))
            {
                foreach (var sample in result)
                {
                    yield return (sample.GetSampleInformation(isAsync), GetMethodName(sample, isAsync));
                }
            }
        }

        protected override IEnumerable<Method> BuildMethods()
        {
            foreach (var sample in _client.ClientMethods.SelectMany(m => m.Samples))
            {
                yield return BuildSampleMethod(sample, false);
                yield return BuildSampleMethod(sample, true);
            }
        }

        protected override string GetMethodName(DpgOperationSample sample, bool isAsync)
        {
            var builder = new StringBuilder("Example_");

            if (sample.ResourceName is not null)
                builder.Append(sample.ResourceName).Append("_");

            builder.Append(sample.InputOperationName)
                .Append('_').Append(sample.ExampleKey);

            if (sample.IsConvenienceSample)
            {
                builder.Append("_Convenience");
            }
            if (isAsync)
            {
                builder.Append("_Async");
            }
            return builder.ToString();
        }

        protected override CSharpAttribute[] GetMethodAttributes() => _attributes;

        private readonly CSharpAttribute[] _attributes = new[] { new CSharpAttribute(typeof(TestAttribute)), new CSharpAttribute(typeof(IgnoreAttribute), Literal("Only validating compilation of examples")) };

        protected override IEnumerable<MethodBodyStatement> BuildResponseStatements(DpgOperationSample sample, VariableReference resultVar)
        {
            if (sample.IsResponseStream)
            {
                return BuildResponseForStream(resultVar);
            }
            else
            {
                return BuildNormalResponse(sample, resultVar);
            }
        }

        private IEnumerable<MethodBodyStatement> BuildResponseForStream(VariableReference resultVar)
        {
            var contentStreamExpression = new StreamExpression(resultVar.Property(Configuration.ApiTypes.ContentStreamName));
            yield return new IfStatement(NotEqual(contentStreamExpression, Null))
            {
                UsingDeclare("outFileStream", InvokeFileOpenWrite("<filepath>"), out var streamVariable),
                contentStreamExpression.CopyTo(streamVariable)
            };
        }

        private IEnumerable<MethodBodyStatement> BuildNormalResponse(DpgOperationSample sample, VariableReference responseVar)
        {
            // we do not write response handling for convenience method samples
            if (sample.IsConvenienceSample)
                yield break;

            ValueExpression streamVar;
            var responseType = responseVar.Type;
            if (responseType.EqualsIgnoreNullable(typeof(BinaryData)))
                streamVar = responseVar.Invoke(nameof(BinaryData.ToStream));
            else if (responseType.EqualsIgnoreNullable(Configuration.ApiTypes.ResponseType))
                streamVar = responseVar.Property(Configuration.ApiTypes.ContentStreamName);
            else if (TypeFactory.IsResponseOfT(responseType))
                streamVar = responseVar.Invoke(Configuration.ApiTypes.GetRawResponseName);
            else
                yield break;

            if (sample.ResultType != null)
            {
                var resultVar = new VariableReference(typeof(JsonElement), Configuration.ApiTypes.JsonElementVariableName);
                yield return Declare(resultVar, JsonDocumentExpression.Parse(new StreamExpression(streamVar)).RootElement);

                var responseParsingStatements = new List<MethodBodyStatement>();
                BuildResponseParseStatements(sample.IsAllParametersUsed, sample.ResultType, resultVar, responseParsingStatements, new HashSet<InputType>());

                yield return responseParsingStatements;
            }
            else
            {
                // if there is not a schema for us to show, just print status code
                ValueExpression statusVar = responseVar;
                if (TypeFactory.IsResponseOfT(responseType))
                    statusVar = responseVar.Invoke(Configuration.ApiTypes.GetRawResponseName);
                if (TypeFactory.IsResponseOfT(responseType) || TypeFactory.IsResponse(responseType))
                    yield return InvokeConsoleWriteLine(statusVar.Property(Configuration.ApiTypes.StatusName));
            }
        }

        private static void BuildResponseParseStatements(bool useAllProperties, InputType type, ValueExpression invocation, List<MethodBodyStatement> statements, HashSet<InputType> visitedTypes)
        {
            switch (type)
            {
                case InputListType listType:
                    if (visitedTypes.Contains(listType.ElementType))
                        return;
                    // <invocation>[0]
                    invocation = new IndexerExpression(invocation, Literal(0));
                    BuildResponseParseStatements(useAllProperties, listType.ElementType, invocation, statements, visitedTypes);
                    return;
                case InputDictionaryType dictionaryType:
                    if (visitedTypes.Contains(dictionaryType.ValueType))
                        return;
                    // <invocation>.GetProperty("<key>")
                    invocation = invocation.Invoke("GetProperty", Literal("<key>"));
                    BuildResponseParseStatements(useAllProperties, dictionaryType.ValueType, invocation, statements, visitedTypes);
                    return;
                case InputModelType modelType:
                    BuildResponseParseStatementsForModelType(useAllProperties, modelType, invocation, statements, visitedTypes);
                    return;
            }
            // we get primitive types, return the statement
            var statement = InvokeConsoleWriteLine(invocation.InvokeToString());
            statements.Add(statement);
        }

        private static void BuildResponseParseStatementsForModelType(bool useAllProperties, InputModelType model, ValueExpression invocation, List<MethodBodyStatement> statements, HashSet<InputType> visitedTypes)
        {
            var allProperties = model.GetSelfAndBaseModels().SelectMany(m => m.Properties);
            var propertiesToExplore = useAllProperties
                ? allProperties
                : allProperties.Where(p => p.IsRequired);

            if (!propertiesToExplore.Any()) // if you have a required property, but its child properties are all optional
            {
                // return the object
                statements.Add(InvokeConsoleWriteLine(invocation.InvokeToString()));
                return;
            }

            foreach (var property in propertiesToExplore)
            {
                if (!visitedTypes.Contains(property.Type))
                {
                    // <invocation>.GetProperty("<propertyName>");
                    visitedTypes.Add(property.Type);
                    var next = invocation.Invoke("GetProperty", Literal(property.SerializedName));
                    BuildResponseParseStatements(useAllProperties, property.Type, next, statements, visitedTypes);
                    visitedTypes.Remove(property.Type);
                }
            }
        }
    }
}
