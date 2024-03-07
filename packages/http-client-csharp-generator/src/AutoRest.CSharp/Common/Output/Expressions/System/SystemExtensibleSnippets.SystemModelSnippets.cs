// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.ClientModel.Internal;
using System.ClientModel.Primitives;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;

namespace AutoRest.CSharp.Common.Output.Expressions.System
{
    internal partial class SystemExtensibleSnippets
    {
        internal class SystemModelSnippets : ModelSnippets
        {
            public override Method BuildConversionToRequestBodyMethod(MethodSignatureModifiers modifiers)
            {
                return new Method
                (
                    new MethodSignature(Configuration.ApiTypes.ToRequestContentName, null, $"Convert into a {nameof(Utf8JsonRequestBody)}.", modifiers, typeof(RequestBody), null, Array.Empty<Parameter>()),
                    new[]
                    {
                        Snippets.Extensible.RestOperations.DeclareContentWithUtf8JsonWriter(out var requestContent, out var writer),
                        writer.WriteObjectValue(Snippets.This),
                        Snippets.Return(requestContent)
                    }
                );
            }

            public override Method BuildFromOperationResponseMethod(SerializableObjectType type, MethodSignatureModifiers modifiers)
            {
                var result = new Parameter("response", $"The result to deserialize the model from.", typeof(PipelineResponse), null, ValidationType.None, null);
                return new Method
                (
                    new MethodSignature(Configuration.ApiTypes.FromResponseName, null, $"Deserializes the model from a raw response.", modifiers, type.Type, null, new[] { result }),
                    new MethodBodyStatement[]
                    {
                        Snippets.UsingVar("document", JsonDocumentExpression.Parse(new PipelineResponseExpression(result).Content), out var document),
                        Snippets.Return(SerializableObjectTypeExpression.Deserialize(type, document.RootElement))
                    }
                );
            }

            public override TypedValueExpression InvokeToRequestBodyMethod(TypedValueExpression model) => new RequestBodyExpression(model.Invoke("ToRequestBody"));
        }
    }
}
