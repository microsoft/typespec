// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Output.Models;

namespace AutoRest.CSharp.Common.Output.Models
{
    internal abstract record PropertyBody;

    internal record AutoPropertyBody(bool HasSetter, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None, ConstantExpression? InitializationExpression = null) : PropertyBody;

    internal record MethodPropertyBody(MethodBodyStatement Getter, MethodBodyStatement? Setter = null, MethodSignatureModifiers SetterModifiers = MethodSignatureModifiers.None) : PropertyBody;

    internal record ExpressionPropertyBody(ValueExpression Getter) : PropertyBody;
}
