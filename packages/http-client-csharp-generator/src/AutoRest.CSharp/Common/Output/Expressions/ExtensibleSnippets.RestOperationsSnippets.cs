// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models.Types;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Types;

namespace AutoRest.CSharp.Common.Output.Expressions
{
    internal abstract partial class ExtensibleSnippets
    {
        internal abstract class RestOperationsSnippets
        {
            public abstract TypedValueExpression InvokeServiceOperationCall(TypedValueExpression pipeline, TypedValueExpression message, bool async);

            public abstract TypedValueExpression GetTypedResponseFromValue(TypedValueExpression value, TypedValueExpression response);
            public abstract TypedValueExpression GetTypedResponseFromModel(SerializableObjectType type, TypedValueExpression response);
            public abstract TypedValueExpression GetTypedResponseFromEnum(EnumType enumType, TypedValueExpression response);
            public abstract TypedValueExpression GetTypedResponseFromBinaryData(Type responseType, TypedValueExpression response, string? contentType = null);

            public abstract MethodBodyStatement DeclareHttpMessage(MethodSignatureBase createRequestMethodSignature, out TypedValueExpression message);
            public abstract MethodBodyStatement DeclareContentWithUtf8JsonWriter(out TypedValueExpression content, out Utf8JsonWriterExpression writer);
            public abstract MethodBodyStatement DeclareContentWithXmlWriter(out TypedValueExpression content, out XmlWriterExpression writer);
            public abstract MethodBodyStatement InvokeServiceOperationCallAndReturnHeadAsBool(TypedValueExpression pipeline, TypedValueExpression message, TypedValueExpression clientDiagnostics, bool async);
            public abstract StreamExpression GetContentStream(TypedValueExpression response);
        }
    }
}
