// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class ClientMethodProvider : MethodProvider
    {
        public ClientMethodProvider(MethodSignatureBase signature, MethodBodyStatement bodyStatements, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default) : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
        }

        public ClientMethodProvider(MethodSignatureBase signature, ValueExpression bodyExpression, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default) : base(signature, bodyExpression, enclosingType, xmlDocProvider)
        {
        }

        public bool IsProtocol { get; internal set; }
    }
}
