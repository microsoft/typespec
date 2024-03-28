// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Output.Samples.Models;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.LowLevel.Output
{
    internal abstract class DpgClientTestProvider : ExpressionTypeProvider
    {
        public DpgClientTestProvider(string defaultNamespace, string defaultName, LowLevelClient client, SourceInputModel? sourceInputModel) : base(defaultNamespace, sourceInputModel)
        {
            DeclarationModifiers = TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial;
            DefaultName = defaultName;
            _client = client;
        }

        protected readonly LowLevelClient _client;

        public bool IsEmpty => !Methods.Any();

        protected override string DefaultName { get; }

        protected abstract CSharpAttribute[] GetMethodAttributes();

        protected abstract string GetMethodName(DpgOperationSample sample, bool isAsync);

        protected MethodSignature GetMethodSignature(DpgOperationSample sample, bool isAsync) => new(
                Name: GetMethodName(sample, isAsync),
                Summary: null,
                Description: null,
                Modifiers: isAsync ? MethodSignatureModifiers.Public | MethodSignatureModifiers.Async : MethodSignatureModifiers.Public,
                ReturnType: isAsync ? typeof(Task) : (CSharpType?)null,
                ReturnDescription: null,
                Parameters: Array.Empty<Parameter>(),
                Attributes: GetMethodAttributes());

        protected Method BuildSampleMethod(DpgOperationSample sample, bool isAsync)
        {
            var signature = GetMethodSignature(sample, isAsync);
            var clientVariableStatements = new List<MethodBodyStatement>();
            var newClientStatement = BuildGetClientStatement(sample, sample.ClientInvocationChain, clientVariableStatements, out var clientVar);

            // the method invocation statements go here
            var operationVariableStatements = new List<MethodBodyStatement>();
            var operationInvocationStatements = BuildSampleOperationInvocation(sample, clientVar, operationVariableStatements, isAsync).ToArray();

            return new Method(signature, new MethodBodyStatement[]
            {
                clientVariableStatements,
                newClientStatement,
                EmptyLine,
                operationVariableStatements,
                operationInvocationStatements
            });
        }

        protected virtual MethodBodyStatement BuildGetClientStatement(DpgOperationSample sample, IReadOnlyList<MethodSignatureBase> methodsToCall, List<MethodBodyStatement> variableDeclarations, out VariableReference clientVar)
        {
            var first = methodsToCall[0];
            ValueExpression valueExpression = first switch
            {
                ConstructorSignature ctor => New.Instance(ctor.Type, sample.GetValueExpressionsForParameters(ctor.Parameters, variableDeclarations).ToArray()),
                _ => new InvokeInstanceMethodExpression(null, first.Name, sample.GetValueExpressionsForParameters(first.Parameters, variableDeclarations).ToArray(), null, false)
            };

            foreach (var method in methodsToCall.Skip(1))
            {
                valueExpression = valueExpression.Invoke(method.Name, sample.GetValueExpressionsForParameters(method.Parameters, variableDeclarations).ToArray());
            }

            clientVar = new VariableReference(_client.Type, "client");

            return Declare(clientVar, valueExpression);
        }

        protected IEnumerable<MethodBodyStatement> BuildSampleOperationInvocation(DpgOperationSample sample, ValueExpression clientVar, List<MethodBodyStatement> variableDeclarations, bool isAsync)
        {
            var methodSignature = sample.OperationMethodSignature.WithAsync(isAsync);
            var parameterExpressions = sample.GetValueExpressionsForParameters(methodSignature.Parameters, variableDeclarations);
            ValueExpression invocation = clientVar.Invoke(methodSignature, parameterExpressions.ToArray(), addConfigureAwaitFalse: false);
            var returnType = GetReturnType(methodSignature.ReturnType);
            VariableReference resultVar = sample.IsLongRunning
                ? new VariableReference(returnType, "operation")
                : new VariableReference(returnType, "response");

            if (sample.IsPageable)
            {
                // if it is pageable, we need to wrap the invocation inside a foreach statement
                // but before the foreach, if this operation is long-running, we still need to call it, and pass the operation.Value into the foreach
                if (sample.IsLongRunning)
                {
                    /*
                     * This will generate code like:
                     * Operation<T> operation = <invocation>;
                     * BinaryData responseData = operation.Value;
                     */
                    yield return Declare(resultVar, invocation);
                    returnType = GetOperationValueType(returnType);
                    invocation = resultVar.Property("Value");
                    resultVar = new VariableReference(returnType, "responseData");
                    yield return Declare(resultVar, invocation);
                }
                /*
                 * This will generate code like:
                 * await foreach (ItemType item in <invocation>)
                 * {}
                 */
                var itemType = GetPageableItemType(returnType);
                var foreachStatement = new ForeachStatement(itemType, "item", invocation, isAsync, out var itemVar)
                {
                    BuildResponseStatements(sample, itemVar).ToArray()
                };
                yield return foreachStatement;
            }
            else
            {
                // if it is not pageable, we just call the operation, declare a local variable and assign the result to it
                /*
                 * This will generate code like:
                 * Operation<T> operation = <invocation>; // when it is long-running
                 * Response<T> response = <invocation>; // when it is not long-running
                 */
                yield return Declare(resultVar, invocation);

                // generate an extra line when it is long-running
                /*
                 * This will generate code like:
                 * Operation<T> operation = <invocation>;
                 * BinaryData responseData = operation.Value;
                 */
                if (sample.IsLongRunning && TypeFactory.IsOperationOfT(returnType))
                {
                    returnType = GetOperationValueType(returnType);
                    invocation = resultVar.Property("Value");
                    resultVar = new VariableReference(returnType, "responseData");
                    yield return Declare(resultVar, invocation);
                }

                yield return EmptyLine;

                yield return BuildResponseStatements(sample, resultVar).ToArray();
            }
        }

        protected abstract IEnumerable<MethodBodyStatement> BuildResponseStatements(DpgOperationSample sample, VariableReference resultVar);

        protected static CSharpType GetOperationValueType(CSharpType? returnType)
        {
            if (returnType == null)
                throw new InvalidOperationException("The return type of a client operation should never be null");

            returnType = GetReturnType(returnType);

            Debug.Assert(TypeFactory.IsOperationOfT(returnType));

            return returnType.Arguments.Single();
        }

        protected static CSharpType GetReturnType(CSharpType? returnType)
        {
            if (returnType == null)
                throw new InvalidOperationException("The return type of a client operation should never be null");

            if (returnType.IsFrameworkType && returnType.FrameworkType.Equals(typeof(Task<>)))
            {
                return returnType.Arguments.Single();
            }

            return returnType;
        }

        protected static CSharpType GetPageableItemType(CSharpType? returnType)
        {
            if (returnType == null)
                throw new InvalidOperationException("The return type of a client operation should never be null");

            Debug.Assert(TypeFactory.IsPageable(returnType) || TypeFactory.IsAsyncPageable(returnType));

            return returnType.Arguments.Single();
        }
    }
}
