// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples
{
    /// <summary>
    /// Generates a <c>Samples_{ClientName}.cs</c> file containing compilable example methods
    /// for each operation on a client. Each example method is annotated with <c>[Test]</c> and
    /// <c>[Ignore("Only validating compilation of examples")]</c> so it compiles but doesn't
    /// run in normal test suites.
    /// </summary>
    public class ClientSampleProvider : TypeProvider
    {
        private static readonly CSharpType _testAttributeType = CreateExternalCSharpType("TestAttribute", "NUnit.Framework");
        private static readonly CSharpType _ignoreAttributeType = CreateExternalCSharpType("IgnoreAttribute", "NUnit.Framework");

        private static readonly AttributeStatement _testAttribute = new AttributeStatement(_testAttributeType);
        private static readonly AttributeStatement _ignoreAttribute = new AttributeStatement(
            _ignoreAttributeType, Literal("Only validating compilation of examples"));

        private readonly ClientProvider _client;

        public ClientSampleProvider(ClientProvider client)
        {
            _client = client;
        }

        /// <summary>
        /// Whether this provider has any sample methods to generate.
        /// </summary>
        public bool IsEmpty => Methods.Count == 0;

        protected override string BuildRelativeFilePath()
            => Path.Combine("tests", "Generated", "Samples", $"{Name}.cs");

        protected override string BuildName() => $"Samples_{_client.Name}";

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
            => TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial;

        protected override MethodProvider[] BuildMethods()
        {
            var methods = new List<MethodProvider>();

            // Ensure client methods are built so MethodCache is populated
            _ = _client.Methods;

            foreach (var serviceMethod in _client.InputClient.Methods)
            {
                ScmMethodProviderCollection methodCollection;
                try
                {
                    methodCollection = _client.GetMethodCollectionByOperation(serviceMethod.Operation);
                }
                catch
                {
                    continue;
                }

                foreach (var sample in methodCollection.Samples)
                {
                    methods.Add(BuildSampleMethod(sample, isAsync: false));
                    methods.Add(BuildSampleMethod(sample, isAsync: true));
                }
            }

            return [.. methods];
        }

        // -------------------------------------------------------------------
        // Method building
        // -------------------------------------------------------------------

        private MethodProvider BuildSampleMethod(OperationSample sample, bool isAsync)
        {
            var methodName = GetMethodName(sample, isAsync);
            var returnType = isAsync ? new CSharpType(typeof(Task)) : null;
            var modifiers = MethodSignatureModifiers.Public;
            if (isAsync)
                modifiers |= MethodSignatureModifiers.Async;

            var signature = new MethodSignature(
                Name: methodName,
                Description: $"{sample.GetSampleInformation(isAsync)}",
                Modifiers: modifiers,
                ReturnType: returnType,
                ReturnDescription: null,
                Parameters: [],
                Attributes: [_testAttribute, _ignoreAttribute]);

            var body = BuildSampleMethodBody(sample, isAsync);

            return new MethodProvider(signature, body, this);
        }

        private MethodBodyStatement BuildSampleMethodBody(OperationSample sample, bool isAsync)
        {
            var clientVarDeclarations = new List<MethodBodyStatement>();
            var clientStatement = BuildGetClientStatement(sample, clientVarDeclarations, out var clientVar);

            var operationVarDeclarations = new List<MethodBodyStatement>();
            // Force enumeration so that operationVarDeclarations is populated
            // before it is spread into the method body (same pattern as autorest's .ToArray()).
            var operationStatements = BuildSampleOperationInvocation(sample, clientVar, operationVarDeclarations, isAsync).ToArray();

            return new MethodBodyStatements(
            [
                .. clientVarDeclarations,
                clientStatement,
                MethodBodyStatement.EmptyLine,
                .. operationVarDeclarations,
                .. operationStatements,
            ]);
        }

        // -------------------------------------------------------------------
        // Client construction
        // -------------------------------------------------------------------

        /// <summary>
        /// Generates the client construction statement:
        /// <code>
        /// Uri endpoint = new Uri("&lt;endpoint&gt;");
        /// FooClient client = new FooClient(endpoint, credential).GetSubClient();
        /// </code>
        /// </summary>
        private MethodBodyStatement BuildGetClientStatement(
            OperationSample sample,
            List<MethodBodyStatement> variableDeclarations,
            out VariableExpression clientVar)
        {
            var chain = sample.ClientInvocationChain;
            if (chain.Count == 0)
            {
                clientVar = new VariableExpression(_client.Type, "client");
                return Declare(clientVar, Null);
            }

            // First element is a constructor
            var first = chain[0];
            ValueExpression valueExpression;
            if (first is ConstructorSignature ctor)
            {
                var ctorArgs = sample.GetValueExpressionsForParameters(ctor.Parameters, variableDeclarations);
                valueExpression = New.Instance(ctor.Type, [.. ctorArgs]);
            }
            else
            {
                var methodArgs = sample.GetValueExpressionsForParameters(first.Parameters, variableDeclarations);
                valueExpression = new InvokeMethodExpression(null, first.Name, [.. methodArgs]);
            }

            // Chain remaining factory methods
            for (int i = 1; i < chain.Count; i++)
            {
                var method = chain[i];
                var methodArgs = sample.GetValueExpressionsForParameters(method.Parameters, variableDeclarations);
                valueExpression = valueExpression.Invoke(method.Name, [.. methodArgs]);
            }

            clientVar = new VariableExpression(_client.Type, "client");
            return Declare(clientVar, valueExpression);
        }

        // -------------------------------------------------------------------
        // Operation invocation
        // -------------------------------------------------------------------

        /// <summary>
        /// Generates the operation invocation and response handling:
        /// <code>
        /// Response response = client.DoSomething(param1, param2);
        /// JsonElement result = JsonDocument.Parse(response.ContentStream).RootElement;
        /// Console.WriteLine(result.GetProperty("name").ToString());
        /// </code>
        /// </summary>
        private IEnumerable<MethodBodyStatement> BuildSampleOperationInvocation(
            OperationSample sample,
            VariableExpression clientVar,
            List<MethodBodyStatement> variableDeclarations,
            bool isAsync)
        {
            var methodSignature = sample.OperationMethodSignature;
            var parameterExpressions = sample.GetValueExpressionsForParameters(
                methodSignature.Parameters, variableDeclarations);

            // Build the invocation expression: client.MethodName(args)
            // The resolved signature is always the sync variant; append "Async" when generating async samples
            // so we call the correct async overload (which returns Task<T>).
            var methodName = isAsync ? methodSignature.Name + "Async" : methodSignature.Name;

            // For pageable operations, don't wrap in await — ForEachStatement handles "await foreach".
            // Pageable methods return CollectionResult/AsyncCollectionResult directly (not Task).
            var wrapInAwait = isAsync && !sample.IsPageable;
            var invocation = clientVar.Invoke(
                methodName,
                [.. parameterExpressions],
                wrapInAwait);

            var returnType = methodSignature.ReturnType;

            // Normal (non-pageable, non-LRO) operation
            if (!sample.IsPageable && !sample.IsLongRunning)
            {
                if (returnType == null)
                {
                    yield return invocation.Terminate();
                    yield break;
                }

                var responseVar = new VariableExpression(returnType, "response");
                yield return Declare(responseVar, invocation);
                yield return MethodBodyStatement.EmptyLine;

                foreach (var stmt in BuildResponseStatements(sample, responseVar))
                {
                    yield return stmt;
                }
                yield break;
            }

            // Pageable operation
            if (sample.IsPageable && !sample.IsLongRunning)
            {
                yield return BuildPageableStatements(sample, invocation, isAsync);
                yield break;
            }

            // Long-running operation (with or without paging)
            if (sample.IsLongRunning)
            {
                if (returnType == null)
                {
                    yield return invocation.Terminate();
                    yield break;
                }

                var operationVar = new VariableExpression(returnType, "operation");
                yield return Declare(operationVar, invocation);
                yield return MethodBodyStatement.EmptyLine;

                // Access the result value
                var valueExpr = operationVar.Property("Value");

                if (sample.IsPageable)
                {
                    yield return BuildPageableStatements(sample, valueExpr, isAsync);
                }
                else
                {
                    var resultVar = new VariableExpression(new CSharpType(typeof(BinaryData)), "responseData");
                    yield return Declare(resultVar, valueExpr);
                    yield return MethodBodyStatement.EmptyLine;

                    foreach (var stmt in BuildResponseStatements(sample, resultVar))
                    {
                        yield return stmt;
                    }
                }
                yield break;
            }
        }

        // -------------------------------------------------------------------
        // Response handling
        // -------------------------------------------------------------------

        /// <summary>
        /// Builds response handling statements for the generated sample method.
        /// For protocol methods: parses JSON and prints property values via Console.WriteLine.
        /// For convenience methods: no response handling is generated.
        /// </summary>
        private IEnumerable<MethodBodyStatement> BuildResponseStatements(
            OperationSample sample,
            VariableExpression responseVar)
        {
            // Convenience methods skip response handling
            if (sample.IsConvenienceSample)
                yield break;

            // No response body — nothing to parse
            if (!sample.HasResponseBody)
                yield break;

            // Stream responses
            if (sample.IsResponseStream)
            {
                foreach (var stmt in BuildStreamResponseStatements(responseVar))
                    yield return stmt;
                yield break;
            }

            // Determine how to obtain a parseable stream based on the response variable's type.
            // This mirrors autorest's BuildNormalResponse dispatch:
            //   BinaryData (from LRO operation.Value) → .ToStream()
            //   ClientResult / ClientResult<T>        → .GetRawResponse().ContentStream
            ValueExpression streamExpr;
            var responseType = responseVar.Type;
            if (responseType.IsFrameworkType && responseType.FrameworkType == typeof(BinaryData))
            {
                streamExpr = responseVar.Invoke(nameof(BinaryData.ToStream), []);
            }
            else
            {
                streamExpr = responseVar.Invoke("GetRawResponse", []).Property("ContentStream");
            }

            var parseExpr = Static(typeof(JsonDocument)).Invoke(nameof(JsonDocument.Parse), streamExpr)
                .Property(nameof(JsonDocument.RootElement));

            var resultVar = new VariableExpression(new CSharpType(typeof(JsonElement)), "result");
            yield return Declare(resultVar, parseExpr);

            // Build response property parsing (recursive)
            if (sample.ResultType != null)
            {
                foreach (var stmt in BuildResponseParseStatements(
                    sample.IsAllParametersUsed, sample.ResultType, resultVar, new HashSet<InputType>()))
                {
                    yield return stmt;
                }
            }
        }

        /// <summary>
        /// Recursively walks the response type's properties and generates
        /// <c>Console.WriteLine(result.GetProperty("name").ToString());</c> statements.
        /// </summary>
        private IEnumerable<MethodBodyStatement> BuildResponseParseStatements(
            bool useAllProperties,
            InputType type,
            ValueExpression invocation,
            HashSet<InputType> visitedTypes)
        {
            switch (type)
            {
                case InputArrayType arrayType:
                    // Array → access [0] then recurse into element type
                    var indexedExpr = new IndexerExpression(invocation, Literal(0));
                    foreach (var stmt in BuildResponseParseStatements(useAllProperties, arrayType.ValueType, indexedExpr, visitedTypes))
                    {
                        yield return stmt;
                    }
                    yield break;

                case InputModelType modelType:
                    // Prevent infinite recursion
                    if (!visitedTypes.Add(modelType))
                        yield break;

                    foreach (var stmt in BuildResponseParseStatementsForModel(
                        useAllProperties, modelType, invocation, visitedTypes))
                    {
                        yield return stmt;
                    }

                    visitedTypes.Remove(modelType);
                    yield break;

                default:
                    // Primitive → Console.WriteLine(expr.ToString())
                    yield return ConsoleWriteLine(invocation.Invoke("ToString", []));
                    yield break;
            }
        }

        /// <summary>
        /// Walks a model type's properties and generates GetProperty() chains with Console.WriteLine().
        /// </summary>
        private IEnumerable<MethodBodyStatement> BuildResponseParseStatementsForModel(
            bool useAllProperties,
            InputModelType modelType,
            ValueExpression invocation,
            HashSet<InputType> visitedTypes)
        {
            foreach (var model in GetSelfAndBaseModels(modelType))
            {
                foreach (var property in model.Properties)
                {
                    // Skip optional properties unless using all
                    if (!useAllProperties && !property.IsRequired)
                        continue;

                    var propertyExpr = invocation.Invoke("GetProperty", Literal(property.SerializedName ?? property.Name));

                    foreach (var stmt in BuildResponseParseStatements(
                        useAllProperties, property.Type, propertyExpr, visitedTypes))
                    {
                        yield return stmt;
                    }
                }
            }
        }

        /// <summary>
        /// Generates statements for stream responses:
        /// <code>
        /// if (response.GetRawResponse().ContentStream != null) { ... }
        /// </code>
        /// </summary>
        private static IEnumerable<MethodBodyStatement> BuildStreamResponseStatements(VariableExpression responseVar)
        {
            var contentStreamExpr = responseVar.Invoke("GetRawResponse", []).Property("ContentStream");
            var ifStatement = new IfStatement(contentStreamExpr.NotEqual(Null))
            {
                ConsoleWriteLine(Literal("Response has content stream"))
            };
            yield return ifStatement;
        }

        /// <summary>
        /// Generates pageable iteration.
        /// Protocol: foreach (ClientResult page in result.GetRawPages()) { ... }
        /// Convenience: foreach (Thing item in result) { Console.WriteLine(item.ToString()); }
        /// </summary>
        private MethodBodyStatement BuildPageableStatements(
            OperationSample sample,
            ValueExpression enumerableExpr,
            bool isAsync)
        {
            if (sample.IsConvenienceSample)
            {
                // Convenience: iterate typed items directly.
                // CollectionResult<T> / AsyncCollectionResult<T> implement IEnumerable<T> / IAsyncEnumerable<T>.
                var resultType = sample.ResultType;
                CSharpType itemType = new CSharpType(typeof(BinaryData));
                if (resultType != null)
                {
                    itemType = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(resultType) ?? itemType;
                }
                var forEach = new ForEachStatement(itemType, "item", enumerableExpr, isAsync, out var item);
                forEach.Add(ConsoleWriteLine(item.Invoke("ToString", [])));
                return forEach;
            }
            else
            {
                // Protocol: CollectionResult / AsyncCollectionResult do not implement IEnumerable directly.
                // Iterate pages via GetRawPages() / GetRawPagesAsync().
                var pagesMethod = isAsync ? "GetRawPagesAsync" : "GetRawPages";
                var pagesExpr = enumerableExpr.Invoke(pagesMethod, []);
                var forEach = new ForEachStatement(new CSharpType(typeof(ClientResult)), "page", pagesExpr, isAsync, out var page);
                forEach.Add(ConsoleWriteLine(page.Invoke("ToString", [])));
                return forEach;
            }
        }

        // -------------------------------------------------------------------
        // Method naming
        // -------------------------------------------------------------------

        /// <summary>
        /// Generates the method name following the pattern:
        /// <c>Example_{ResourceName}_{OperationName}_{ExampleKey}[_Convenience][_Async]</c>
        /// </summary>
        private static string GetMethodName(OperationSample sample, bool isAsync)
        {
            var name = $"Example_{sample.ResourceName}_{sample.InputOperationName}_{sample.ExampleKey}";

            if (sample.IsConvenienceSample)
                name += "_Convenience";

            if (isAsync)
                name += "_Async";

            return name;
        }

        // -------------------------------------------------------------------
        // Helpers
        // -------------------------------------------------------------------

        /// <summary>
        /// Generates a <c>Console.WriteLine(expression)</c> statement without fully qualifying
        /// the <c>Console</c> type. The standard <c>Snippet.InvokeConsoleWriteLine</c> uses
        /// <c>Static(typeof(Console))</c> which the CodeWriter renders as <c>global::System.Console</c>.
        /// Since the generated file already has <c>using System;</c>, this helper emits the shorter form.
        /// </summary>
        private static MethodBodyStatement ConsoleWriteLine(ValueExpression expression)
            => new InvokeMethodExpression(null, "Console.WriteLine", [expression]).Terminate();

        private static IEnumerable<InputModelType> GetSelfAndBaseModels(InputModelType model)
        {
            var current = model;
            while (current != null)
            {
                yield return current;
                current = current.BaseModel;
            }
        }

        /// <summary>
        /// Creates a <see cref="CSharpType"/> for an external type (e.g., NUnit attributes)
        /// that is not referenced by this assembly. Uses the internal string-based constructor
        /// via reflection.
        /// </summary>
        private static CSharpType CreateExternalCSharpType(string name, string ns)
        {
            var ctor = typeof(CSharpType).GetConstructor(
                BindingFlags.NonPublic | BindingFlags.Instance,
                null,
                [typeof(string), typeof(string), typeof(bool), typeof(bool),
                 typeof(CSharpType), typeof(IReadOnlyList<CSharpType>),
                 typeof(bool), typeof(bool), typeof(CSharpType), typeof(Type)],
                null)!;
            return (CSharpType)ctor.Invoke([name, ns, false, false, null, Array.Empty<CSharpType>(), true, false, null, null]);
        }
    }
}
