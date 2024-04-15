// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class ModelSnippets
        {
            public abstract Method BuildConversionToRequestBodyMethod(MethodSignatureModifiers modifiers);
            public abstract Method BuildFromOperationResponseMethod(TypeProvider typeProvider, MethodSignatureModifiers modifiers);
            public abstract TypedValueExpression InvokeToRequestBodyMethod(TypedValueExpression model);
        }
    }
}
