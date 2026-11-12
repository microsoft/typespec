// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace PlaygroundServer;

/// <summary>
/// <see cref="IMemoryCache"/>-backed implementation of <see cref="IGenerationCache"/>.
/// </summary>
public sealed class MemoryGenerationCache : IGenerationCache
{
    public const long DefaultSizeLimitBytes = 256L * 1024 * 1024;

    private readonly IMemoryCache _cache;

    public MemoryGenerationCache(IMemoryCache cache)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
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
