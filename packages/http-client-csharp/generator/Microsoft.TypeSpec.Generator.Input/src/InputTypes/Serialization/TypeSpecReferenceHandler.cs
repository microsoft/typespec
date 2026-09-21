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
            private readonly Dictionary<string, int> _resolvingReferences = new();
            private readonly Dictionary<string, int> _readingReferenceDefinitions = new();
            private int _referenceDepth;
            private JsonSerializerOptions? _options;

            public bool UsesEscapedPropertyNames { get; set; }

            public string DecodePropertyName(string name)
                => UsesEscapedPropertyNames && name.StartsWith("$$", StringComparison.Ordinal) ? name.Substring(1) : name;

            public JsonElement GetReferenceDefinition(string referenceId)
                => _referenceDefinitions.TryGetValue(referenceId, out var definition)
                    ? definition : throw new JsonException($"cannot resolve reference {referenceId}");

            public void RegisterReferenceDefinitions(JsonElement root, JsonSerializerOptions options)
            {
                _options = options;
                IndexReferenceDefinitions(root);
            }

            private void IndexReferenceDefinitions(JsonElement element)
            {
                if (element.ValueKind == JsonValueKind.Object)
                {
                    if (element.TryGetProperty("$id", out var id) && id.ValueKind == JsonValueKind.String)
                    {
                        var referenceId = id.GetString() ?? throw new JsonException("$id can't be null");
                        if (!_referenceDefinitions.TryAdd(referenceId, element))
                        {
                            throw new JsonException($"Duplicate reference ID '{referenceId}'");
                        }
                    }

                    // Legacy documents have no explicit separation between metadata and data.
                    // Version 2 escapes every data key, so all subtrees can be indexed uniformly.
                    var hasOpaqueValue = !UsesEscapedPropertyNames && element.TryGetProperty("kind", out var kind)
                        && kind.ValueKind == JsonValueKind.String
                        && kind.GetString() is "unknown" or "union"
                        && element.TryGetProperty("type", out _);
                    foreach (var property in element.EnumerateObject())
                    {
                        if (hasOpaqueValue && property.NameEquals("value"))
                        {
                            continue;
                        }

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
                // but reject unresolved cycles and bound reference chains independently of the JSON document's depth.
                if (_referenceDepth >= _options.MaxDepth)
                {
                    throw new JsonException($"Cannot resolve reference {referenceId}: circular reference or maximum reference depth exceeded");
                }

                var referenceCount = _referenceIdToObjectMap.Count;
                var isReentrantReference = _resolvingReferences.TryGetValue(referenceId, out var previousReferenceCount);
                if (isReentrantReference && referenceCount <= previousReferenceCount)
                {
                    throw new JsonException($"Cannot resolve reference {referenceId}: circular reference or maximum reference depth exceeded");
                }

                _resolvingReferences[referenceId] = referenceCount;
                _referenceDepth++;
                EnterReferenceDefinition(referenceId);
                try
                {
                    var result = definition.Deserialize<T>(_options) ?? throw new JsonException($"cannot resolve reference {referenceId}");
                    return (T)(GetPreviouslyResolvedReference(referenceId) ?? result);
                }
                finally
                {
                    ExitReferenceDefinition(referenceId);
                    _referenceDepth--;
                    if (isReentrantReference)
                    {
                        _resolvingReferences[referenceId] = previousReferenceCount;
                    }
                    else
                    {
                        _resolvingReferences.Remove(referenceId);
                    }
                }
            }

            public void EnterReferenceDefinition(string referenceId)
            {
                _readingReferenceDefinitions.TryGetValue(referenceId, out var count);
                _readingReferenceDefinitions[referenceId] = count + 1;
            }

            public void ExitReferenceDefinition(string referenceId)
            {
                var count = _readingReferenceDefinitions[referenceId];
                if (count > 1)
                {
                    _readingReferenceDefinitions[referenceId] = count - 1;
                }
                else
                {
                    _readingReferenceDefinitions.Remove(referenceId);
                }
            }

            public override void AddReference(string referenceId, object value)
            {
                // Indexed definitions are unique. A cycle through a late-registering type
                // can materialize one definition twice; readers must reuse the first instance.
                if (_referenceIdToObjectMap.TryGetValue(referenceId, out var existingValue))
                {
                    if (ReferenceEquals(existingValue, value)
                        || (_readingReferenceDefinitions.ContainsKey(referenceId) && existingValue.GetType() == value.GetType()))
                    {
                        return;
                    }

                    throw new JsonException($"Failed to add reference ID '{referenceId}' with value type '{value.GetType()}'");
                }

                _referenceIdToObjectMap.Add(referenceId, value);
            }

            public override string GetReference(object value, out bool alreadyExists)
                => throw new InvalidOperationException("JSON writing isn't supported");

            public override object ResolveReference(string referenceId)
                => _referenceIdToObjectMap.TryGetValue(referenceId, out object? value) ? value : throw new JsonException($"cannot resolve reference {referenceId}");
        }
    }
}
