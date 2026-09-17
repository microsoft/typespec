// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Custom reference handler that preserves the same instance of the resolver across multiple calls of the converters Read method
    /// Required for the reference preservation to work with custom converters
    /// </summary>
    internal sealed class TypeSpecReferenceHandler : ReferenceHandler
    {
        public TypeSpecReferenceResolver CurrentResolver { get; } = new TypeSpecReferenceResolver();

        public override ReferenceResolver CreateResolver() => CurrentResolver;

        internal sealed class TypeSpecReferenceResolver : ReferenceResolver
        {
            private readonly Dictionary<string, object> _referenceIdToObjectMap = new();
            private readonly Dictionary<string, JsonElement> _referenceDefinitions = new();
            private int _referenceDepth;
            private JsonSerializerOptions? _options;

            public void RegisterReferenceDefinitions(JsonElement root, JsonSerializerOptions options)
            {
                _options = options;
                IndexReferenceDefinitions(root);
            }

            private void IndexReferenceDefinitions(JsonElement element)
            {
                if (element.ValueKind == JsonValueKind.Object)
                {
                    if (element.TryGetProperty("$id", out var id) && id.ValueKind == JsonValueKind.String
                        && !_referenceDefinitions.TryAdd(id.GetString()!, element))
                    {
                        throw new JsonException($"Duplicate reference ID '{id.GetString()}'");
                    }

                    foreach (var property in element.EnumerateObject())
                    {
                        IndexReferenceDefinitions(property.Value);
                    }
                }
                else if (element.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in element.EnumerateArray())
                    {
                        IndexReferenceDefinitions(item);
                    }
                }
            }

            public object? GetPreviouslyResolvedReference(string referenceId)
                => _referenceDefinitions.ContainsKey(referenceId) && _referenceIdToObjectMap.TryGetValue(referenceId, out var value) ? value : null;

            public T ResolveReference<T>(string referenceId) where T : class
            {
                if (_referenceIdToObjectMap.TryGetValue(referenceId, out var value))
                {
                    return (T)value;
                }

                if (_options == null || !_referenceDefinitions.TryGetValue(referenceId, out var definition))
                {
                    throw new JsonException($"cannot resolve reference {referenceId}");
                }

                // Allow re-entry after a child registers an instance that can close a cycle,
                // but bound reference chains independently of the JSON document's depth.
                if (_referenceDepth >= _options.MaxDepth)
                {
                    throw new JsonException($"Cannot resolve reference {referenceId}: circular reference or maximum reference depth exceeded");
                }

                _referenceDepth++;
                try
                {
                    var result = definition.Deserialize<T>(_options) ?? throw new JsonException($"cannot resolve reference {referenceId}");
                    return (T)(GetPreviouslyResolvedReference(referenceId) ?? result);
                }
                finally
                {
                    _referenceDepth--;
                }
            }

            public override void AddReference(string referenceId, object value)
            {
                // Indexed definitions are unique. A cycle through a late-registering type
                // can materialize one definition twice; readers must reuse the first instance.
                if (!_referenceIdToObjectMap.TryAdd(referenceId, value) && !_referenceDefinitions.ContainsKey(referenceId))
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
