// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;
using PlaygroundServer;

namespace PlaygroundServer.Tests;

[TestFixture]
public class GenerationCacheTests
{
    private static MemoryGenerationCache CreateCache(long sizeLimit = MemoryGenerationCache.DefaultSizeLimitBytes, TimeSpan? sliding = null)
    {
        var memory = new MemoryCache(new MemoryCacheOptions { SizeLimit = sizeLimit });
        return new MemoryGenerationCache(memory, sliding);
    }

    private static CachedGenerationResponse MakeResponse(string content)
        => new(Encoding.UTF8.GetBytes(content), "application/json");

    [Test]
    public void ComputeKey_IsDeterministic_ForSameInputs()
    {
        var k1 = MemoryGenerationCache.ComputeKey("gen", "{\"a\":1}", "{\"b\":2}", "1.0.0");
        var k2 = MemoryGenerationCache.ComputeKey("gen", "{\"a\":1}", "{\"b\":2}", "1.0.0");
        Assert.AreEqual(k1, k2);
    }

    [Test]
    public void ComputeKey_ProducesSha256HexString()
    {
        var key = MemoryGenerationCache.ComputeKey("gen", "model", "config", "1.0.0");
        // SHA-256 hex = 64 hex chars, uppercase per Convert.ToHexString.
        Assert.AreEqual(64, key.Length);
        Assert.That(key, Does.Match("^[0-9A-F]{64}$"));
    }

    [Test]
    public void ComputeKey_ChangesWhenGeneratorNameChanges()
    {
        var a = MemoryGenerationCache.ComputeKey("genA", "m", "c", "v");
        var b = MemoryGenerationCache.ComputeKey("genB", "m", "c", "v");
        Assert.AreNotEqual(a, b);
    }

    [Test]
    public void ComputeKey_ChangesWhenCodeModelChanges()
    {
        var a = MemoryGenerationCache.ComputeKey("gen", "m1", "c", "v");
        var b = MemoryGenerationCache.ComputeKey("gen", "m2", "c", "v");
        Assert.AreNotEqual(a, b);
    }

    [Test]
    public void ComputeKey_ChangesWhenConfigurationChanges()
    {
        var a = MemoryGenerationCache.ComputeKey("gen", "m", "c1", "v");
        var b = MemoryGenerationCache.ComputeKey("gen", "m", "c2", "v");
        Assert.AreNotEqual(a, b);
    }

    [Test]
    public void ComputeKey_ChangesWhenGeneratorVersionChanges()
    {
        // Item 3 acceptance: a deploy bumps the version and must invalidate.
        var a = MemoryGenerationCache.ComputeKey("gen", "m", "c", "1.0.0");
        var b = MemoryGenerationCache.ComputeKey("gen", "m", "c", "1.0.1");
        Assert.AreNotEqual(a, b);
    }

    [Test]
    public void ComputeKey_IsUnambiguousAcrossComponentBoundaries()
    {
        // Naive concatenation would collide here; the length prefix must prevent that.
        var a = MemoryGenerationCache.ComputeKey("Foo", "Bar", "Baz", "v");
        var b = MemoryGenerationCache.ComputeKey("FooBar", "", "Baz", "v");
        var c = MemoryGenerationCache.ComputeKey("Foo", "BarBaz", "", "v");
        Assert.AreNotEqual(a, b);
        Assert.AreNotEqual(a, c);
        Assert.AreNotEqual(b, c);
    }

    [Test]
    public void ComputeKey_ThrowsOnNullArguments()
    {
        Assert.Throws<ArgumentNullException>(() => MemoryGenerationCache.ComputeKey(null!, "m", "c", "v"));
        Assert.Throws<ArgumentNullException>(() => MemoryGenerationCache.ComputeKey("g", null!, "c", "v"));
        Assert.Throws<ArgumentNullException>(() => MemoryGenerationCache.ComputeKey("g", "m", null!, "v"));
        Assert.Throws<ArgumentNullException>(() => MemoryGenerationCache.ComputeKey("g", "m", "c", null!));
    }

    [Test]
    public void TryGet_ReturnsFalse_WhenKeyMissing()
    {
        var cache = CreateCache();
        Assert.IsFalse(cache.TryGet("nope", out var value));
        Assert.IsNull(value);
    }

    [Test]
    public void Set_ThenTryGet_ReturnsStoredValue()
    {
        var cache = CreateCache();
        var response = MakeResponse("hello");
        cache.Set("k", response);

        Assert.IsTrue(cache.TryGet("k", out var value));
        Assert.IsNotNull(value);
        Assert.AreEqual("application/json", value!.ContentType);
        Assert.AreEqual("hello", Encoding.UTF8.GetString(value.Body));
    }

    [Test]
    public void Set_OverwritesExistingEntry()
    {
        var cache = CreateCache();
        cache.Set("k", MakeResponse("first"));
        cache.Set("k", MakeResponse("second"));

        Assert.IsTrue(cache.TryGet("k", out var value));
        Assert.AreEqual("second", Encoding.UTF8.GetString(value!.Body));
    }

    [Test]
    public void Set_ThrowsOnNullValue()
    {
        var cache = CreateCache();
        Assert.Throws<ArgumentNullException>(() => cache.Set("k", null!));
    }

    [Test]
    public void Constructor_ThrowsOnNullBackingCache()
    {
        Assert.Throws<ArgumentNullException>(() => new MemoryGenerationCache(null!));
    }

    [Test]
    public void SizeLimit_EvictsEntriesUnderPressure()
    {
        // SizeLimit is bytes; each entry's Size is its body length.
        // Fill past the cap and trigger compaction.
        using var backing = new MemoryCache(new MemoryCacheOptions { SizeLimit = 1024, CompactionPercentage = 0.5 });
        var cache = new MemoryGenerationCache(backing);

        // Each entry is 256 bytes -> fits 4 entries before pressure.
        var payload = new byte[256];
        for (int i = 0; i < 8; i++)
        {
            cache.Set("k" + i, new CachedGenerationResponse(payload, "application/json"));
        }
        // Force a full synchronous compaction to make eviction deterministic in the test.
        backing.Compact(0.0);

        // Total cache should not exceed the cap.
        Assert.LessOrEqual(backing.Count * 256, 1024);
    }

    [Test]
    public async Task SlidingExpiration_EvictsAfterIdle()
    {
        var cache = CreateCache(sliding: TimeSpan.FromMilliseconds(50));
        cache.Set("k", MakeResponse("x"));
        Assert.IsTrue(cache.TryGet("k", out _));

        // Wait past the sliding window without touching the entry.
        await Task.Delay(200);
        Assert.IsFalse(cache.TryGet("k", out var value));
        Assert.IsNull(value);
    }
}
