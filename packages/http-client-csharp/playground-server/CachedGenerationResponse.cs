// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace PlaygroundServer;

/// <summary>
/// Cached generator response. Stored as the already-serialized JSON bytes plus
/// content type so cache hits can return without re-serializing.
/// </summary>
public sealed record CachedGenerationResponse(byte[] Body, string ContentType);
