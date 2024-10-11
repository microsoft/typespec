// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IRequestContentApi
    {
        CSharpType RequestContentType { get; }
        RequestContentApi FromExpression(ValueExpression original);
        RequestContentApi ToExpression();
    }
}
