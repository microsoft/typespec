// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public abstract partial class ExtensibleSnippets
    {
        public abstract class RestOperationsSnippets
        {
            public abstract TypedSnippet GetTypedResponseFromValue(TypedSnippet value, TypedSnippet response);
            public abstract TypedSnippet GetTypedResponseFromModel(TypeProvider typeProvider, TypedSnippet response);
            public abstract TypedSnippet GetTypedResponseFromEnum(EnumProvider enumType, TypedSnippet response);
            public abstract TypedSnippet GetTypedResponseFromBinaryData(Type responseType, TypedSnippet response, string? contentType = null);

            public abstract MethodBodyStatement DeclareHttpMessage(MethodSignatureBase createRequestMethodSignature, out TypedSnippet message);
            public abstract MethodBodyStatement DeclareContentWithUtf8JsonWriter(out TypedSnippet content, out Utf8JsonWriterSnippet writer);
            public abstract StreamSnippet GetContentStream(TypedSnippet response);
        }
    }
}
