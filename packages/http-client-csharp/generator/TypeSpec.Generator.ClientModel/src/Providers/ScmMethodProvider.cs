// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Providers;
using TypeSpec.Generator.Statements;

namespace TypeSpec.Generator.ClientModel.Providers
{
    public class ScmMethodProvider : MethodProvider
    {
        public ScmMethodProvider(MethodSignature signature, MethodBodyStatement bodyStatements, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default) : base(signature, bodyStatements, enclosingType, xmlDocProvider)
        {
        }

        public ScmMethodProvider(MethodSignature signature, ValueExpression bodyExpression, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default) : base(signature, bodyExpression, enclosingType, xmlDocProvider)
        {
        }

        internal bool IsServiceCall { get; init; }
    }
}
