// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Output.Models;

namespace AutoRest.CSharp.Common.Output.Expressions
{
    internal abstract partial class ExtensibleSnippets
    {
        internal abstract class ModelSnippets
        {
            public abstract Method BuildConversionToRequestBodyMethod(MethodSignatureModifiers modifiers);
            public abstract Method BuildFromOperationResponseMethod(SerializableObjectType type, MethodSignatureModifiers modifiers);
            public abstract TypedValueExpression InvokeToRequestBodyMethod(TypedValueExpression model);
        }
    }
}
