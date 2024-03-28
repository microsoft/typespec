// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record ResourceTypeExpression(ValueExpression Untyped) : TypedValueExpression<ResourceType>(Untyped)
    {
        public StringExpression Namespace => new(Property(nameof(ResourceType.Namespace)));

        public StringExpression GetLastType() => new(Invoke(nameof(ResourceType.GetLastType)));
    }
}
