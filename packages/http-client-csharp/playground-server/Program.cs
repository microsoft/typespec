// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using PlaygroundServer;

const int MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB
const int GeneratorTimeoutSeconds = 300;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "http://localhost:5173", // vite dev
    "http://localhost:4173", // vite preview
    "http://localhost:3000",
    "https://typespec.io",
    "https://www.typespec.io",
    "https://azure.github.io",
};
// Add additional origins from PLAYGROUND_URLS (comma-separated) or PLAYGROUND_URL (single)
var playgroundUrls = Environment.GetEnvironmentVariable("PLAYGROUND_URLS")
    ?? Environment.GetEnvironmentVariable("PLAYGROUND_URL");
if (!string.IsNullOrEmpty(playgroundUrls))
{
    foreach (var origin in playgroundUrls.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        {
            allowedOrigins.Add(uri.GetLeftPart(UriPartial.Authority));
        }
    }
}

// Application Insights instrumentation. The SDK reads the connection string from the
// APPLICATIONINSIGHTS_CONNECTION_STRING environment variable (or ApplicationInsights:ConnectionString
// configuration value). When neither is set, telemetry is silently dropped.
builder.Services.AddApplicationInsightsTelemetry();
var appInsightsConnectionString = Environment.GetEnvironmentVariable("APPLICATIONINSIGHTS_CONNECTION_STRING")
    ?? builder.Configuration["ApplicationInsights:ConnectionString"];
Console.WriteLine(string.IsNullOrWhiteSpace(appInsightsConnectionString)
    ? "Application Insights connection string not set; telemetry disabled."
    : "Application Insights telemetry enabled.");

builder.Services.AddCors();
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = MemoryGenerationCache.DefaultSizeLimitBytes;
});
builder.Services.AddSingleton<IGenerationCache, MemoryGenerationCache>();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddFixedWindowLimiter("generate", limiter =>
    {
        limiter.PermitLimit = 10;
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.QueueLimit = 2;
        limiter.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});

// Limit request body size
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxRequestBodySize;
});

var app = builder.Build();

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});

app.UseCors(policy => policy
    .WithOrigins([.. allowedOrigins])
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseRateLimiter();

// Resolve the generator DLL path. Default: dist/generator in the http-client-csharp package.
var generatorPath = Environment.GetEnvironmentVariable("GENERATOR_PATH")
    ?? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "dist", "generator", "Microsoft.TypeSpec.Generator.dll"));

if (!File.Exists(generatorPath))
{
    Console.Error.WriteLine($"WARNING: Generator DLL not found at {generatorPath}");
    Console.Error.WriteLine("Set GENERATOR_PATH environment variable to the correct path.");
}
else
{
    Console.WriteLine($"Generator DLL: {generatorPath}");
}

// Capture the generator's assembly file version at startup so a deploy of a
// new binary implicitly invalidates every previously cached response.
string generatorVersion;
try
{
    generatorVersion = File.Exists(generatorPath)
        ? (FileVersionInfo.GetVersionInfo(generatorPath).FileVersion ?? "unknown")
        : "missing";
}
catch (Exception ex)
{
    Console.Error.WriteLine($"WARNING: Failed to read generator version from {generatorPath}: {ex.Message}");
    generatorVersion = "unknown";
}
Console.WriteLine($"Generator version: {generatorVersion}");

app.MapGet("/health", () =>
{
    string dotnetVersion;
    try
    {
        var psi = new ProcessStartInfo("dotnet", "--version") { RedirectStandardOutput = true, UseShellExecute = false };
        var proc = Process.Start(psi)!;
        dotnetVersion = proc.StandardOutput.ReadToEnd().Trim();
        proc.WaitForExit();
    }
    catch (Exception ex) { dotnetVersion = ex.Message; }

    return Results.Ok(new
    {
        status = "ok",
        generatorFound = File.Exists(generatorPath),
        generatorPath,
        dotnetVersion,
        runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
        os = System.Runtime.InteropServices.RuntimeInformation.OSDescription,
        arch = System.Runtime.InteropServices.RuntimeInformation.OSArchitecture.ToString()
    });
});

app.MapPost("/generate", async (HttpRequest request, IGenerationCache cache, TelemetryClient? telemetryClient) =>
{
    var stopwatch = Stopwatch.StartNew();
    var telemetryProperties = new Dictionary<string, string>();

    void TrackGenerateEvent(string outcome)
    {
        if (telemetryClient is null) return;
        stopwatch.Stop();
        telemetryProperties["outcome"] = outcome;
        telemetryProperties["durationMs"] = stopwatch.Elapsed.TotalMilliseconds.ToString("F0", System.Globalization.CultureInfo.InvariantCulture);
        var evt = new EventTelemetry("PlaygroundGenerate");
        foreach (var kvp in telemetryProperties) evt.Properties[kvp.Key] = kvp.Value;
        telemetryClient.TrackEvent(evt);
        telemetryClient.GetMetric("PlaygroundGenerateDurationMs", "outcome").TrackValue(stopwatch.Elapsed.TotalMilliseconds, outcome);
    }

    // Validate content type
    if (!request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) ?? true)
    {
        TrackGenerateEvent("invalid_content_type");
        return Results.BadRequest(new { error = "Content-Type must be application/json" });
    }

    GenerateRequest? body;
    try
    {
        body = await JsonSerializer.DeserializeAsync<GenerateRequest>(
            request.Body, GenerateJsonContext.Default.GenerateRequest);
    }
    catch (JsonException)
    {
        TrackGenerateEvent("invalid_json");
        return Results.BadRequest(new { error = "Invalid JSON in request body" });
    }

    if (body?.CodeModel is null || body?.Configuration is null)
    {
        TrackGenerateEvent("missing_fields");
        return Results.BadRequest(new { error = "Missing 'codeModel' or 'configuration' fields" });
    }

    var generatorName = body.GeneratorName ?? "ScmCodeModelGenerator";
    telemetryProperties["generatorName"] = generatorName;
    telemetryProperties["codeModelSizeBytes"] = body.CodeModel.Length.ToString(System.Globalization.CultureInfo.InvariantCulture);

    if (!File.Exists(generatorPath))
    {
        TrackGenerateEvent("generator_missing");
        return Results.StatusCode(503);
    }

    var cacheKey = MemoryGenerationCache.ComputeKey(generatorName, body.CodeModel!, body.Configuration!, generatorVersion);
    if (cache.TryGet(cacheKey, out var cached) && cached is not null)
    {
        request.HttpContext.Response.Headers["X-Cache"] = "HIT";
        return Results.Bytes(cached.Body, cached.ContentType);
    }

    request.HttpContext.Response.Headers["X-Cache"] = "MISS";

    // Create a temporary working directory
    var tempDir = Path.Combine(Path.GetTempPath(), "tsp-playground", Guid.NewGuid().ToString("N"));
    var generatedDir = Path.Combine(tempDir, "src", "Generated");
    Directory.CreateDirectory(generatedDir);

    try
    {
        // Write the input files the generator expects
        await File.WriteAllTextAsync(Path.Combine(tempDir, "tspCodeModel.json"), body.CodeModel);
        await File.WriteAllTextAsync(Path.Combine(tempDir, "Configuration.json"), body.Configuration);

        // Run the .NET generator as a subprocess
        Console.WriteLine($"Starting generator: dotnet --roll-forward Major {generatorPath} {tempDir} -g {generatorName} --new-project");
        Console.WriteLine($"Code model size: {body.CodeModel!.Length} chars");
        Console.WriteLine($"Configuration: {body.Configuration}");

        var psi = new ProcessStartInfo
        {
            FileName = "dotnet",
            ArgumentList = { "--roll-forward", "Major", generatorPath, tempDir, "-g", generatorName, "--new-project" },
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var process = Process.Start(psi)!;
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(GeneratorTimeoutSeconds));

        // Stream stdout/stderr to console for logging
        var stderrLines = new List<string>();
        var stdoutTask = Task.Run(async () =>
        {
            string? line;
            while ((line = await process.StandardOutput.ReadLineAsync()) != null)
            {
                Console.WriteLine($"[generator stdout] {line}");
            }
        });
        var stderrTask = Task.Run(async () =>
        {
            string? line;
            while ((line = await process.StandardError.ReadLineAsync()) != null)
            {
                Console.Error.WriteLine($"[generator stderr] {line}");
                stderrLines.Add(line);
            }
        });

        try
        {
            await process.WaitForExitAsync(cts.Token);
        }
        catch (OperationCanceledException)
        {
            process.Kill(entireProcessTree: true);
            TrackGenerateEvent("timeout");
            return Results.Json(
                new GenerateErrorResponse("Generator timed out", $"Process did not complete within {GeneratorTimeoutSeconds} seconds"),
                GenerateJsonContext.Default.GenerateErrorResponse,
                statusCode: 504);
        }
        await Task.WhenAll(stdoutTask, stderrTask);

        var exitCode = process.ExitCode;
        Console.WriteLine($"Generator exited with code {exitCode}");
        telemetryProperties["exitCode"] = exitCode.ToString(System.Globalization.CultureInfo.InvariantCulture);

        if (exitCode != 0)
        {
            var stderrTail = string.Join("\n", stderrLines.TakeLast(50));
            telemetryClient?.TrackTrace(
                $"Generator failed (exit {exitCode}): {stderrTail}",
                SeverityLevel.Error,
                telemetryProperties);
            TrackGenerateEvent("generator_failed");
            return Results.Json(
                new GenerateErrorResponse($"Generator failed with exit code {exitCode}", stderrTail),
                GenerateJsonContext.Default.GenerateErrorResponse,
                statusCode: 500);
        }

        // Collect all generated files
        var files = new List<GeneratedFile>();
        if (Directory.Exists(tempDir))
        {
            foreach (var filePath in Directory.EnumerateFiles(tempDir, "*", SearchOption.AllDirectories))
            {
                // Skip the input files
                var fileName = Path.GetFileName(filePath);
                if (fileName is "tspCodeModel.json" or "Configuration.json")
                    continue;

                var relativePath = Path.GetRelativePath(tempDir, filePath).Replace('\\', '/');
                var content = await File.ReadAllTextAsync(filePath);
                files.Add(new GeneratedFile(relativePath, content));
            }
        }

        telemetryProperties["generatedFileCount"] = files.Count.ToString(System.Globalization.CultureInfo.InvariantCulture);
        TrackGenerateEvent("success");
        var responseBytes = JsonSerializer.SerializeToUtf8Bytes(
            new GenerateResponse(files),
            GenerateJsonContext.Default.GenerateResponse);
        cache.Set(cacheKey, new CachedGenerationResponse(responseBytes, "application/json"));
        return Results.Bytes(responseBytes, "application/json");
    }
    catch (Exception ex)
    {
        if (telemetryClient is not null)
        {
            var exTelemetry = new ExceptionTelemetry(ex);
            foreach (var kvp in telemetryProperties) exTelemetry.Properties[kvp.Key] = kvp.Value;
            telemetryClient.TrackException(exTelemetry);
        }
        TrackGenerateEvent("exception");
        throw;
    }
    finally
    {
        try { Directory.Delete(tempDir, recursive: true); } catch { }
    }
}).RequireRateLimiting("generate");

var port = Environment.GetEnvironmentVariable("PORT")
    ?? Environment.GetEnvironmentVariable("WEBSITES_PORT")
    ?? "5174";
var url = Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? $"http://+:{port}";
Console.WriteLine($"C# playground server listening on {url}");
app.Run(url);

// --- Request/Response types ---

record GenerateRequest(string? CodeModel, string? Configuration, string? GeneratorName);
record GeneratedFile(string Path, string Content);
record GenerateResponse(List<GeneratedFile> Files);
record GenerateErrorResponse(string Error, string? Details);

[JsonSerializable(typeof(GenerateRequest))]
[JsonSerializable(typeof(GenerateResponse))]
[JsonSerializable(typeof(GenerateErrorResponse))]
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
partial class GenerateJsonContext : JsonSerializerContext { }
