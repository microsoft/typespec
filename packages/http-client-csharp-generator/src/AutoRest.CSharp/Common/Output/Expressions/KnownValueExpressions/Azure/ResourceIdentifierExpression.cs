// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure.Core;
using Azure.ResourceManager;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record ResourceIdentifierExpression(ValueExpression Untyped) : TypedValueExpression<ResourceIdentifier>(Untyped)
    {
        public static ResourceIdentifierExpression Root => new(new MemberExpression(typeof(ResourceIdentifier), nameof(ResourceIdentifier.Root)));

        public StringExpression Name => new(Property(nameof(ResourceIdentifier.Name)));
        public ResourceIdentifierExpression Parent => new(Property(nameof(ResourceIdentifier.Parent)));
        public StringExpression Provider => new(Property(nameof(ResourceIdentifier.Provider)));
        public ResourceTypeExpression ResourceType => new(Property(nameof(ResourceIdentifier.ResourceType)));
        public StringExpression ResourceGroupName => new(Property(nameof(ResourceIdentifier.ResourceGroupName)));
        public StringExpression SubscriptionId => new(Property(nameof(ResourceIdentifier.SubscriptionId)));

        public StringExpression SubstringAfterProviderNamespace() => new(InvokeExtension(typeof(SharedExtensions), nameof(SharedExtensions.SubstringAfterProviderNamespace)));
    }
}
