// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class ModelSnippets
        {
            public abstract CSharpMethod? BuildJsonModelSerializationMethod(CSharpType jsonModelInterface);
            public abstract CSharpMethod? BuildJsonModelDeserializationMethod(CSharpType jsonModelInterface);
            public abstract CSharpMethod? BuildIModelSerializationMethod(CSharpType jsonIModelInterface);
            public abstract CSharpMethod? BuildIModelDeserializationMethod(CSharpType jsonIModelInterface);
            public abstract CSharpMethod? BuildIModelGetFormatMethod(CSharpType jsonIModelInterface, ValueExpression wireFormat);
            public abstract CSharpMethod BuildConversionToRequestBodyMethod(MethodSignatureModifiers modifiers);
            public abstract CSharpMethod BuildFromOperationResponseMethod(TypeProvider typeProvider, MethodSignatureModifiers modifiers);
            public abstract TypedValueExpression InvokeToRequestBodyMethod(TypedValueExpression model);
        }
    }
}
