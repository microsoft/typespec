// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Models.Types;
using Autorest.CSharp.Core;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models.Shared;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal static partial class Snippets
    {
        public static DeclarationStatement DeclareFirstPageRequestLocalFunction(ValueExpression? restClient, string methodName, IEnumerable<ValueExpression> arguments, out CodeWriterDeclaration localFunctionName)
        {
            var requestMethodCall = new InvokeInstanceMethodExpression(restClient, methodName, arguments.ToList(), null, false);
            localFunctionName = new CodeWriterDeclaration("FirstPageRequest");
            return new DeclareLocalFunctionStatement(localFunctionName, new[]{KnownParameters.PageSizeHint}, typeof(HttpMessage), requestMethodCall);
        }

        public static DeclarationStatement DeclareNextPageRequestLocalFunction(ValueExpression? restClient, string methodName, IEnumerable<ValueExpression> arguments, out CodeWriterDeclaration localFunctionName)
        {
            var requestMethodCall = new InvokeInstanceMethodExpression(restClient, methodName, arguments.ToList(), null, false);
            localFunctionName = new CodeWriterDeclaration("NextPageRequest");
            return new DeclareLocalFunctionStatement(localFunctionName, new[]{KnownParameters.PageSizeHint, KnownParameters.NextLink}, typeof(HttpMessage), requestMethodCall);
        }

        public static ValueExpression CreatePageable(
            CodeWriterDeclaration createFirstPageRequest,
            CodeWriterDeclaration? createNextPageRequest,
            ValueExpression clientDiagnostics,
            ValueExpression pipeline,
            CSharpType? pageItemType,
            string scopeName,
            string itemPropertyName,
            string? nextLinkPropertyName,
            ValueExpression? requestContextOrCancellationToken,
            bool async)
        {
            var arguments = new List<ValueExpression>
            {
                new VariableReference(typeof(Func<int?, HttpMessage>), createFirstPageRequest),
                createNextPageRequest is not null ? new VariableReference(typeof(Func<int?, string, HttpMessage>), createNextPageRequest) : Null,
                GetValueFactory(pageItemType),
                clientDiagnostics,
                pipeline,
                Literal(scopeName),
                Literal(itemPropertyName),
                Literal(nextLinkPropertyName)
            };

            if (requestContextOrCancellationToken is not null)
            {
                arguments.Add(requestContextOrCancellationToken);
            }

            var methodName = async ? nameof(GeneratorPageableHelpers.CreateAsyncPageable) : nameof(GeneratorPageableHelpers.CreatePageable);
            return new InvokeStaticMethodExpression(typeof(GeneratorPageableHelpers), methodName, arguments);
        }

        public static ValueExpression CreatePageable(
            ValueExpression message,
            CodeWriterDeclaration? createNextPageRequest,
            ValueExpression clientDiagnostics,
            ValueExpression pipeline,
            CSharpType? pageItemType,
            OperationFinalStateVia finalStateVia,
            string scopeName,
            string itemPropertyName,
            string? nextLinkPropertyName,
            ValueExpression? requestContext,
            bool async)
        {
            var arguments = new List<ValueExpression>
            {
                KnownParameters.WaitForCompletion,
                message,
                createNextPageRequest is not null ? new VariableReference(typeof(Func<int?, string, HttpMessage>), createNextPageRequest) : Null,
                GetValueFactory(pageItemType),
                clientDiagnostics,
                pipeline,
                FrameworkEnumValue(finalStateVia),
                Literal(scopeName),
                Literal(itemPropertyName),
                Literal(nextLinkPropertyName)
            };

            if (requestContext is not null)
            {
                arguments.Add(requestContext);
            }

            var methodName = async ? nameof(GeneratorPageableHelpers.CreateAsyncPageable) : nameof(GeneratorPageableHelpers.CreatePageable);
            return new InvokeStaticMethodExpression(typeof(GeneratorPageableHelpers), methodName, arguments, null, false, async);
        }

        private static ValueExpression GetValueFactory(CSharpType? pageItemType)
        {
            if (pageItemType is null)
            {
                throw new NotSupportedException("Type of the element of the page must be specified");
            }

            if (pageItemType.Equals(typeof(BinaryData)))
            {
                // When `JsonElement` provides access to its UTF8 buffer, change this code to create `BinaryData` from it.
                // See also PageableHelpers.ParseResponseForBinaryData
                var e = new VariableReference(typeof(JsonElement), "e");
                return new FuncExpression(new[] { e.Declaration }, BinaryDataExpression.FromString(new JsonElementExpression(e).GetRawText()));
            }

            if (pageItemType is { IsFrameworkType: false, Implementation: SerializableObjectType { JsonSerialization: { } } type })
            {
                return SerializableObjectTypeExpression.DeserializeDelegate(type);
            }

            var variable = new VariableReference(typeof(JsonElement), "e");
            var deserializeImplementation = JsonSerializationMethodsBuilder.GetDeserializeValueExpression(new JsonElementExpression(variable), pageItemType, null);
            return new FuncExpression(new[] { variable.Declaration }, deserializeImplementation);
        }
    }
}
