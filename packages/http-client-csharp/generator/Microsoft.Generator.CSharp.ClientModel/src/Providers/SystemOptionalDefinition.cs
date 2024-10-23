// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal sealed class SystemOptionalDefinition : OptionalDefinition
    {
        private const string IsDefinedMethodName = "IsDefined";
        protected override MethodProvider[] BuildMethods()
        {
            return [.. base.BuildMethods(), IsJsonElementDefined()];
        }

        private MethodProvider IsJsonElementDefined()
        {
            var valueParam = new ParameterProvider("value", $"The value.", typeof(JsonElement));
            var signature = GetIsDefinedSignature(valueParam);

            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                Snippet.Return(valueParam.As<JsonElement>().ValueKindNotEqualsUndefined())
            }, this);
        }

        private MethodSignature GetIsDefinedSignature(ParameterProvider valueParam, IReadOnlyList<CSharpType>? genericArguments = null, IReadOnlyList<WhereExpression>? genericParameterConstraints = null)
            => new(
                IsDefinedMethodName,
                null,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                typeof(bool),
                null,
                [valueParam],
                GenericArguments: genericArguments,
                GenericParameterConstraints: genericParameterConstraints);
    }
}
