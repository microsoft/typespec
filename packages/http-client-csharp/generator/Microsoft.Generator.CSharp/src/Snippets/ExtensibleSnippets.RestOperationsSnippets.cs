// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class RestOperationsSnippets
        {
            public abstract TypedValueExpression InvokeServiceOperationCall(TypedValueExpression pipeline, TypedValueExpression message, bool async);

            public abstract TypedValueExpression GetTypedResponseFromValue(TypedValueExpression value, TypedValueExpression response);
            public abstract TypedValueExpression GetTypedResponseFromModel(TypeProvider typeProvider, TypedValueExpression response);
            public abstract TypedValueExpression GetTypedResponseFromEnum(EnumTypeProvider enumType, TypedValueExpression response);
            public abstract TypedValueExpression GetTypedResponseFromBinaryData(Type responseType, TypedValueExpression response, string? contentType = null);

            public abstract MethodBodyStatement DeclareHttpMessage(MethodSignatureBase createRequestMethodSignature, out TypedValueExpression message);
            public abstract MethodBodyStatement DeclareContentWithUtf8JsonWriter(out TypedValueExpression content, out Utf8JsonWriterExpression writer);
            public abstract MethodBodyStatement InvokeServiceOperationCallAndReturnHeadAsBool(TypedValueExpression pipeline, TypedValueExpression message, TypedValueExpression clientDiagnostics, bool async);
            public abstract StreamExpression GetContentStream(TypedValueExpression response);
        }
    }
}
