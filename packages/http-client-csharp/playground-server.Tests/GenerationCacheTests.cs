// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Text;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;
using PlaygroundServer;

namespace PlaygroundServer.Tests;

[TestFixture]
public class GenerationCacheTests
{
    private static MemoryGenerationCache CreateCache(long sizeLimit = MemoryGenerationCache.DefaultSizeLimitBytes)
    {
        var memory = new MemoryCache(new MemoryCacheOptions { SizeLimit = sizeLimit });
        return new MemoryGenerationCache(memory);
    }

    private static CachedGenerationResponse MakeResponse(string content)
        => new(Encoding.UTF8.GetBytes(content), "application/json");

    // A representative (multi-KB) code model payload shaped like what the generator actually receives,
    // used to exercise ComputeKey against realistic input rather than tiny synthetic strings.
    private const string SampleCodeModel = """
        {
          "$id": "1",
          "name": "PetStore",
          "apiVersions": ["2024-01-01"],
          "enums": [
            {
              "$id": "2",
              "kind": "enum",
              "name": "PetKind",
              "valueType": { "$id": "3", "kind": "string", "name": "string", "crossLanguageDefinitionId": "TypeSpec.string" },
              "values": [
                { "$id": "4", "kind": "enumvalue", "name": "Dog", "value": "dog" },
                { "$id": "5", "kind": "enumvalue", "name": "Cat", "value": "cat" }
              ],
              "isFixed": true,
              "usage": "Input,Output"
            }
          ],
          "models": [
            {
              "$id": "6",
              "kind": "model",
              "name": "Pet",
              "crossLanguageDefinitionId": "PetStore.Pet",
              "usage": "Input,Output",
              "properties": [
                { "$id": "7", "kind": "property", "name": "id", "serializedName": "id", "type": { "$id": "8", "kind": "int32", "name": "int32" }, "optional": false },
                { "$id": "9", "kind": "property", "name": "name", "serializedName": "name", "type": { "$id": "10", "kind": "string", "name": "string" }, "optional": false },
                { "$id": "11", "kind": "property", "name": "kind", "serializedName": "kind", "type": { "$ref": "2" }, "optional": true }
              ]
            }
          ],
          "clients": [
            {
              "$id": "12",
              "kind": "client",
              "name": "PetStoreClient",
              "namespace": "PetStore",
              "operations": [
                {
                  "$id": "13",
                  "name": "getPet",
                  "resourceName": "Pet",
                  "verb": "get",
                  "path": "/pets/{petId}",
                  "responses": [{ "$id": "14", "statusCodes": [200], "bodyType": { "$ref": "6" } }]
                }
              ]
            }
          ]
        }
        """;

    private const string SampleConfiguration = """
        { "package-name": "PetStore", "namespace": "PetStore", "library-name": "PetStore" }
        """;

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
    public void ComputeKey_WithRealisticCodeModel_IsDeterministic()
    {
        var k1 = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", SampleCodeModel, SampleConfiguration, "1.0.0");
        var k2 = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", SampleCodeModel, SampleConfiguration, "1.0.0");
        Assert.AreEqual(k1, k2);
        Assert.AreEqual(64, k1.Length);
        Assert.That(k1, Does.Match("^[0-9A-F]{64}$"));
    }

    [Test]
    public void ComputeKey_WithRealisticCodeModel_ChangesOnSemanticEdit()
    {
        // Flip a single property name deep in the model; the key must change.
        var edited = SampleCodeModel.Replace("\"name\": \"name\"", "\"name\": \"fullName\"");
        Assert.AreNotEqual(SampleCodeModel, edited, "precondition: the edit must alter the code model");

        var original = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", SampleCodeModel, SampleConfiguration, "1.0.0");
        var afterEdit = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", edited, SampleConfiguration, "1.0.0");
        Assert.AreNotEqual(original, afterEdit);
    }

    [Test]
    public void ComputeKey_WithRealisticCodeModel_ChangesOnConfigurationEdit()
    {
        var editedConfig = SampleConfiguration.Replace("\"library-name\": \"PetStore\"", "\"library-name\": \"PetStoreV2\"");
        Assert.AreNotEqual(SampleConfiguration, editedConfig, "precondition: the edit must alter the configuration");

        var original = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", SampleCodeModel, SampleConfiguration, "1.0.0");
        var afterEdit = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", SampleCodeModel, editedConfig, "1.0.0");
        Assert.AreNotEqual(original, afterEdit);
    }

    [Test]
    public void ComputeKey_RealisticCodeModel_RoundTripsThroughCache()
    {
        var cache = CreateCache();
        var key = MemoryGenerationCache.ComputeKey("ScmCodeModelGenerator", SampleCodeModel, SampleConfiguration, "1.0.0");

        Assert.IsFalse(cache.TryGet(key, out _));
        cache.Set(key, MakeResponse("generated"));

        Assert.IsTrue(cache.TryGet(key, out var value));
        Assert.AreEqual("generated", Encoding.UTF8.GetString(value!.Body));
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
        using var backing = new MemoryCache(new MemoryCacheOptions { SizeLimit = 1024, CompactionPercentage = 0.5 });
        var cache = new MemoryGenerationCache(backing);

        var payload = new byte[256];
        for (int i = 0; i < 8; i++)
        {
            cache.Set("k" + i, new CachedGenerationResponse(payload, "application/json"));
        }
        backing.Compact(0.0);

        Assert.LessOrEqual(backing.Count * 256, 1024);
    }
}
