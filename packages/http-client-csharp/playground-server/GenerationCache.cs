// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace PlaygroundServer;

/// <summary>
/// Cached generator response for the playground server.
/// Stored as the already-serialized JSON bytes plus content type so cache hits
/// can short-circuit the entire generation pipeline.
/// </summary>
public sealed record CachedGenerationResponse(byte[] Body, string ContentType);

/// <summary>
/// Container-local cache for /generate responses. See Item 3 of the playground
/// perf design: this is Tier 1 (in-memory) only. Identical requests within a
/// container short-circuit the dotnet sub-process invocation.
/// </summary>
public interface IGenerationCache
{
    /// <summary>Look up a previously cached response.</summary>
    bool TryGet(string key, out CachedGenerationResponse? value);

    /// <summary>Store a response, sized by its body length.</summary>
    void Set(string key, CachedGenerationResponse value);
}

/// <summary>
/// IMemoryCache-backed implementation of <see cref="IGenerationCache"/>.
/// Entry size is the response body length in bytes; total cache size is
/// capped via <see cref="MemoryCacheOptions.SizeLimit"/> on the underlying cache.
/// </summary>
public sealed class MemoryGenerationCache : IGenerationCache
{
    /// <summary>Default cache size cap: 256 MB of response bodies.</summary>
    public const long DefaultSizeLimitBytes = 256L * 1024 * 1024;

    /// <summary>Default sliding expiration for an entry.</summary>
    public static readonly TimeSpan DefaultSlidingExpiration = TimeSpan.FromHours(1);

    private readonly IMemoryCache _cache;
    private readonly TimeSpan _slidingExpiration;

    public MemoryGenerationCache(IMemoryCache cache, TimeSpan? slidingExpiration = null)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _slidingExpiration = slidingExpiration ?? DefaultSlidingExpiration;
    }

    public bool TryGet(string key, out CachedGenerationResponse? value)
    {
        if (_cache.TryGetValue(key, out CachedGenerationResponse? hit) && hit is not null)
        {
            value = hit;
            return true;
        }
        value = null;
        return false;
    }

    public void Set(string key, CachedGenerationResponse value)
    {
        ArgumentNullException.ThrowIfNull(value);
        ArgumentNullException.ThrowIfNull(value.Body);

        // Size is in bytes; an entry will be evicted under SizeLimit pressure
        // via the IMemoryCache compaction algorithm (LRU-ish, by priority).
        var size = Math.Max(1, value.Body.LongLength);
        var entryOptions = new MemoryCacheEntryOptions
        {
            Size = size,
            SlidingExpiration = _slidingExpiration,
            Priority = CacheItemPriority.Normal,
        };
        _cache.Set(key, value, entryOptions);
    }

    /// <summary>
    /// Build a content-addressed cache key. Includes <paramref name="generatorVersion"/>
    /// so a deploy of a new generator binary implicitly invalidates the cache.
    /// </summary>
    public static string ComputeKey(string generatorName, string codeModel, string configuration, string generatorVersion)
    {
        ArgumentNullException.ThrowIfNull(generatorName);
        ArgumentNullException.ThrowIfNull(codeModel);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(generatorVersion);

        // Length-prefix each component so concatenation is unambiguous.
        // e.g. "Foo" + "BarBaz" must not collide with "FooBar" + "Baz".
        var sb = new StringBuilder(generatorName.Length + codeModel.Length + configuration.Length + generatorVersion.Length + 64);
        Append(sb, generatorName);
        Append(sb, generatorVersion);
        Append(sb, codeModel);
        Append(sb, configuration);

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);

        static void Append(StringBuilder buffer, string component)
        {
            buffer.Append(component.Length).Append(':').Append(component).Append('|');
        }
    }
}
