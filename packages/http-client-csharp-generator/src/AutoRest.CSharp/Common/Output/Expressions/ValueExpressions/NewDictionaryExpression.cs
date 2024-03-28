// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Common.Output.Expressions.ValueExpressions
{
    internal record NewDictionaryExpression(CSharpType Type, DictionaryInitializerExpression? Values = null) : ValueExpression;
}
