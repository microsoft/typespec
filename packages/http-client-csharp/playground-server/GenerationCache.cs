// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace PlaygroundServer;

/// <summary>
/// Cached generator response. Stored as the already-serialized JSON bytes plus
/// content type so cache hits can return without re-serializing.
/// </summary>
public sealed record CachedGenerationResponse(byte[] Body, string ContentType);

/// <summary>
/// Container-local in-memory cache for /generate responses.
/// </summary>
public interface IGenerationCache
{
    bool TryGet(string key, out CachedGenerationResponse? value);

    void Set(string key, CachedGenerationResponse value);
}

/// <summary>
/// <see cref="IMemoryCache"/>-backed implementation of <see cref="IGenerationCache"/>.
/// </summary>
public sealed class MemoryGenerationCache : IGenerationCache
{
    public const long DefaultSizeLimitBytes = 256L * 1024 * 1024;

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
    /// Build a content-addressed cache key. Including <paramref name="generatorVersion"/>
    /// means a deploy of a new generator binary implicitly invalidates the cache.
    /// </summary>
    public static string ComputeKey(string generatorName, string codeModel, string configuration, string generatorVersion)
    {
        ArgumentNullException.ThrowIfNull(generatorName);
        ArgumentNullException.ThrowIfNull(codeModel);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(generatorVersion);

        // Length-prefix each component so concatenation is unambiguous:
        // "Foo" + "BarBaz" must not collide with "FooBar" + "Baz".
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
