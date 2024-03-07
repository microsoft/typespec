// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure.ResourceManager;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record ArmResourceExpression(ValueExpression Untyped) : TypedValueExpression<ArmResource>(Untyped)
    {
        public ResourceIdentifierExpression Id => new(Property(nameof(ArmResource.Id)));
        public ResourceIdentifierExpression Name => new(Property("Name"));
    }
}
