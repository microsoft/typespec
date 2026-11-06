// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using NUnit.Framework;

namespace PlaygroundServer.Tests;

[TestFixture]
public class GeneratorEndpointTests
{
    private string _root = null!;
    private string _temporaryRoot = null!;
    private Process _server = null!;
    private HttpClient _client = null!;

    [OneTimeSetUp]
    public async Task StartServer()
    {
        _root = Path.Combine(Path.GetTempPath(), "playground-endpoint-tests", Guid.NewGuid().ToString("N"));
        _temporaryRoot = Path.Combine(_root, "temp");
        Directory.CreateDirectory(_temporaryRoot);
        WriteRuntime(Path.Combine(_root, "unbranded"));
        foreach (var package in new[] { "http-client-csharp", "http-client-csharp-mgmt", "http-client-csharp-provisioning" })
        {
            var packageRoot = Path.Combine(_root, "azure", package);
            WriteRuntime(Path.Combine(packageRoot, "dist", "generator"));
            File.WriteAllText(Path.Combine(packageRoot, "package.json"),
                JsonSerializer.Serialize(new { name = $"@azure-typespec/{package}", version = "1.2.3" }));
        }

        var info = new ProcessStartInfo("dotnet")
        {
            ArgumentList = { typeof(GeneratorRegistry).Assembly.Location },
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
        };
        info.Environment["GENERATOR_PATH"] = GetRuntimePath("unbranded");
        info.Environment["AZURE_GENERATOR_ROOT"] = Path.Combine(_root, "azure");
        info.Environment["ASPNETCORE_URLS"] = "http://127.0.0.1:0";
        info.Environment["APPLICATIONINSIGHTS_CONNECTION_STRING"] =
            "InstrumentationKey=00000000-0000-0000-0000-000000000000;IngestionEndpoint=http://127.0.0.1:1";
        info.Environment["ApplicationInsights__DisableTelemetry"] = "true";
        foreach (var variable in new[] { "TEMP", "TMP", "TMPDIR" })
        {
            info.Environment[variable] = _temporaryRoot;
        }

        var listening = new TaskCompletionSource<Uri>(TaskCreationOptions.RunContinuationsAsynchronously);
        var logs = new ConcurrentQueue<string>();
        _server = new Process { StartInfo = info, EnableRaisingEvents = true };
        _server.OutputDataReceived += (_, args) =>
        {
            if (args.Data is not { } line) return;
            logs.Enqueue(line);
            const string prefix = "Now listening on: ";
            var index = line.IndexOf(prefix, StringComparison.Ordinal);
            if (index >= 0)
            {
                listening.TrySetResult(new Uri(line[(index + prefix.Length)..].Trim()));
            }
        };
        _server.ErrorDataReceived += (_, args) =>
        {
            if (args.Data is { } line) logs.Enqueue(line);
        };
        _server.Exited += (_, _) => listening.TrySetException(
            new InvalidOperationException($"Server exited before listening: {string.Join(Environment.NewLine, logs)}"));
        _server.Start();
        _server.BeginOutputReadLine();
        _server.BeginErrorReadLine();
        _client = new HttpClient { BaseAddress = await listening.Task.WaitAsync(TimeSpan.FromSeconds(30)) };
    }

    [OneTimeTearDown]
    public async Task StopServer()
    {
        _client?.Dispose();
        if (_server is not null)
        {
            if (!_server.HasExited) _server.Kill(entireProcessTree: true);
            await _server.WaitForExitAsync();
            _server.Dispose();
        }
        if (_root is not null) Directory.Delete(_root, recursive: true);
    }

    [TestCase("AzureClientGenerator", "http-client-csharp")]
    [TestCase("ManagementClientGenerator", "http-client-csharp-mgmt")]
    [TestCase("ProvisioningGenerator", "http-client-csharp-provisioning")]
    [TestCase("ScmCodeModelGenerator", "unbranded")]
    [TestCase(null, "unbranded")]
    public async Task GenerateLaunchesSelectedRuntime(string? generatorName, string package)
    {
        var body = new Dictionary<string, string> { ["codeModel"] = "{}", ["configuration"] = "{}" };
        if (generatorName is not null) body["generatorName"] = generatorName;
        using var response = await _client.PostAsJsonAsync("/generate", body);
        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        // Each fixture intentionally has invalid runtime configuration. The dotnet
        // host's error identifies the actual selected runtime, not just registry lookup.
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.InternalServerError));
        Assert.That(result.RootElement.GetProperty("details").GetString(),
            Does.Contain(Path.ChangeExtension(GetRuntimePath(package), ".runtimeconfig.json")));
    }

    [Test]
    public async Task UnknownGeneratorIsRejectedWithoutCreatingProcessWorkspace()
    {
        var before = Directory.GetDirectories(_temporaryRoot, "*", SearchOption.AllDirectories);
        using var response = await _client.PostAsJsonAsync("/generate",
            new { codeModel = "{}", configuration = "{}", generatorName = "UnknownGenerator" });

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        Assert.That(Directory.GetDirectories(_temporaryRoot, "*", SearchOption.AllDirectories), Is.EquivalentTo(before));
    }

    [Test]
    public async Task CatalogReturnsConfiguredPackages()
    {
        using var response = await _client.GetAsync("/generators");
        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(result.RootElement.GetProperty("generators").GetArrayLength(), Is.EqualTo(3));
    }

    private string GetRuntimePath(string package) => Path.Combine(
        package == "unbranded" ? Path.Combine(_root, package) : Path.Combine(_root, "azure", package, "dist", "generator"),
        "Microsoft.TypeSpec.Generator.dll");

    private static void WriteRuntime(string directory)
    {
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, "Microsoft.TypeSpec.Generator.dll");
        File.WriteAllText(path, "fake runtime");
        File.WriteAllText(Path.ChangeExtension(path, ".runtimeconfig.json"), "invalid json");
    }
}
