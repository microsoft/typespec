// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace PlaygroundServer;

/// <summary>
/// Container-local in-memory cache for /generate responses.
/// </summary>
public interface IGenerationCache
{
    bool TryGet(string key, out CachedGenerationResponse? value);

    void Set(string key, CachedGenerationResponse value);
}
