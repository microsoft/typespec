// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Text.Json;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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
            }, this, XmlDocProvider.Empty);
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
