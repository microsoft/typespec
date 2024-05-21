// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    /// <summary>
    /// Custom reference handler that preserves the same instance of the resolver across multiple calls of the converters Read method
    /// Required for the reference preservation to work with custom converters
    /// </summary>
    internal sealed class TypeSpecReferenceHandler : ReferenceHandler
    {
        public ReferenceResolver CurrentResolver { get; } = new TypeSpecReferenceResolver();

        public override ReferenceResolver CreateResolver() => CurrentResolver;

        private class TypeSpecReferenceResolver : ReferenceResolver
        {
            private readonly Dictionary<string, object> _referenceIdToObjectMap = new();

            public override void AddReference(string referenceId, object value)
            {
                if (!_referenceIdToObjectMap.TryAdd(referenceId, value))
                {
                    throw new JsonException($"Failed to add reference ID '{referenceId}' with value type '{value.GetType()}'");
                }
            }

            public override string GetReference(object value, out bool alreadyExists)
                => throw new InvalidOperationException("JSON writing isn't supported");

            public override object ResolveReference(string referenceId)
                => _referenceIdToObjectMap.TryGetValue(referenceId, out object? value) ? value : throw new JsonException($"cannot resolve reference {referenceId}");
        }
    }
}
