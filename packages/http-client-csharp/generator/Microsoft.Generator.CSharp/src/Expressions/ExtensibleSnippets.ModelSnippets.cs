// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class ModelSnippets
        {
            public abstract CSharpMethod BuildConversionToRequestBodyMethod(MethodSignatureModifiers modifiers);
            public abstract CSharpMethod BuildFromOperationResponseMethod(TypeProvider typeProvider, MethodSignatureModifiers modifiers);
            public abstract TypedValueExpression InvokeToRequestBodyMethod(TypedValueExpression model);
        }
    }
}
