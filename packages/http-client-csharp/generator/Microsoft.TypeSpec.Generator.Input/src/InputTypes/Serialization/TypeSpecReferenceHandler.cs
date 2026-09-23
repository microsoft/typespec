// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
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

            public void RegisterReferenceDefinitions(JsonElement root, JsonSerializerOptions options)
            {
                _options = options;
                var candidates = new Dictionary<string, List<JsonElement>>();
                foreach (var definition in EnumerateReferenceDefinitions(root, root, []))
                {
                    var id = GetRequiredReferenceId(definition);
                    if (!candidates.TryGetValue(id, out var definitions))
                    {
                        candidates.Add(id, definitions = []);
                    }
                    definitions.Add(definition);
                }

                // Locate example slots through the typed graph, even when its definitions live in decorators.
                // Defer duplicate checks until opaque payloads (which may repeat any ID) have been excluded.
                var opaqueValues = FindOpaqueExampleValues(root, id => candidates.TryGetValue(id, out var definitions) ? definitions : []);
                IndexReferenceDefinitions(root, opaqueValues);

                // Candidate payload IDs must not establish example contexts elsewhere in the graph.
                // Recompute using only surviving definitions, then validate the final index.
                opaqueValues = FindOpaqueExampleValues(root, id => _referenceDefinitions.TryGetValue(id, out var definition)
                    ? [definition]
                    : throw new JsonException($"cannot resolve reference {id}"));
                _referenceDefinitions.Clear();
                IndexReferenceDefinitions(root, opaqueValues);
            }

            private void IndexReferenceDefinitions(JsonElement root, HashSet<int> opaqueValues)
            {
                foreach (var definition in EnumerateReferenceDefinitions(root, root, opaqueValues))
                {
                    var id = GetRequiredReferenceId(definition);
                    if (!_referenceDefinitions.TryAdd(id, definition))
                    {
                        throw new JsonException($"Duplicate reference ID '{id}'");
                    }
                }
            }

            private static IEnumerable<JsonElement> EnumerateReferenceDefinitions(JsonElement root, JsonElement element, HashSet<int> opaqueValues)
            {
                if (opaqueValues.Contains(GetElementOffset(root, element)))
                {
                    yield break;
                }

                if (element.ValueKind == JsonValueKind.Object)
                {
                    if (element.TryGetProperty("$id", out var id) && id.ValueKind == JsonValueKind.String)
                    {
                        yield return element;
                    }
                    foreach (var property in element.EnumerateObject())
                    {
                        foreach (var definition in EnumerateReferenceDefinitions(root, property.Value, opaqueValues))
                        {
                            yield return definition;
                        }
                    }
                }
                else if (element.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in element.EnumerateArray())
                    {
                        foreach (var definition in EnumerateReferenceDefinitions(root, item, opaqueValues))
                        {
                            yield return definition;
                        }
                    }
                }
            }

            private enum ExampleContext
            {
                None,
                Namespace,
                Client,
                Method,
                PagingMetadata,
                NextLink,
                Operation,
                OperationExample,
                ParameterExample,
                ExampleValue,
                ExampleDictionary
            }

            // All elements belong to the same document. Offsets distinguish their locations without
            // JsonElement's default hash collisions between elements from that document.
            private static int GetElementOffset(JsonElement root, JsonElement element)
                => (int)Unsafe.ByteOffset(
                    ref MemoryMarshal.GetReference(JsonMarshal.GetRawUtf8Value(root)),
                    ref MemoryMarshal.GetReference(JsonMarshal.GetRawUtf8Value(element)));

            private static HashSet<int> FindOpaqueExampleValues(JsonElement root, Func<string, IEnumerable<JsonElement>> resolve)
            {
                var opaqueValues = new HashSet<int>();
                var visited = new HashSet<(int, ExampleContext)>();
                var visitedReferences = new HashSet<(string, ExampleContext)>();
                var pending = new Queue<(JsonElement, ExampleContext)>();
                pending.Enqueue((root, ExampleContext.Namespace));
                while (pending.TryDequeue(out var next))
                {
                    var (element, context) = next;
                    if (!visited.Add((GetElementOffset(root, element), context)))
                    {
                        continue;
                    }
                    if (element.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in element.EnumerateArray())
                        {
                            pending.Enqueue((item, context));
                        }
                        continue;
                    }
                    if (element.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }
                    if (context is ExampleContext.Client or ExampleContext.Method or ExampleContext.Operation
                        && TryGetReferenceId(element, out var id))
                    {
                        if (!visitedReferences.Add((id, context)))
                        {
                            continue;
                        }
                        foreach (var definition in resolve(id))
                        {
                            pending.Enqueue((definition, context));
                        }
                        continue;
                    }

                    var kind = element.TryGetProperty("kind", out var kindValue) && kindValue.ValueKind == JsonValueKind.String
                        ? kindValue.GetString() : null;
                    foreach (var property in element.EnumerateObject())
                    {
                        if (context == ExampleContext.ExampleValue && kind is "unknown" or "union" && property.NameEquals("value"))
                        {
                            opaqueValues.Add(GetElementOffset(root, property.Value));
                            continue;
                        }
                        var childContext = (context, property.Name) switch
                        {
                            (ExampleContext.Namespace, "clients") => ExampleContext.Client,
                            (ExampleContext.Client, "children" or "parent") => ExampleContext.Client,
                            (ExampleContext.Client, "methods") => ExampleContext.Method,
                            (ExampleContext.Method or ExampleContext.NextLink, "operation") => ExampleContext.Operation,
                            (ExampleContext.Method, "pagingMetadata") when kind is "paging" or "lropaging" => ExampleContext.PagingMetadata,
                            (ExampleContext.PagingMetadata, "nextLink") => ExampleContext.NextLink,
                            (ExampleContext.Operation, "examples") => ExampleContext.OperationExample,
                            (ExampleContext.OperationExample, "parameters") => ExampleContext.ParameterExample,
                            (ExampleContext.ParameterExample, "value") => ExampleContext.ExampleValue,
                            (ExampleContext.ExampleValue, "value") when kind == "array" => ExampleContext.ExampleValue,
                            (ExampleContext.ExampleValue, "value") when kind is "model" or "dict" => ExampleContext.ExampleDictionary,
                            (ExampleContext.ExampleDictionary, _) => ExampleContext.ExampleValue,
                            _ => ExampleContext.None
                        };
                        if (childContext != ExampleContext.None)
                        {
                            pending.Enqueue((property.Value, childContext));
                        }
                    }
                }
                return opaqueValues;
            }

            private static string GetRequiredReferenceId(JsonElement definition)
                => definition.GetProperty("$id").GetString() ?? throw new JsonException("Reference property '$id' cannot be null");

            private static bool TryGetReferenceId(JsonElement element, out string id)
            {
                if (element.TryGetProperty("$ref", out var reference) && reference.ValueKind == JsonValueKind.String)
                {
                    var referenceId = reference.GetString();
                    if (referenceId is not null)
                    {
                        id = referenceId;
                        return true;
                    }
                }

                id = string.Empty;
                return false;
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
