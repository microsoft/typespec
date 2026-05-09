// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

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

builder.Services.AddCors();
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

app.MapPost("/generate", async (HttpRequest request) =>
{
    // Validate content type
    if (!request.ContentType?.StartsWith("application/json", StringComparison.OrdinalIgnoreCase) ?? true)
    {
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
        return Results.BadRequest(new { error = "Invalid JSON in request body" });
    }

    if (body?.CodeModel is null || body?.Configuration is null)
    {
        return Results.BadRequest(new { error = "Missing 'codeModel' or 'configuration' fields" });
    }

    var generatorName = body.GeneratorName ?? "ScmCodeModelGenerator";

    if (!File.Exists(generatorPath))
    {
        return Results.StatusCode(503);
    }

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
            return Results.Json(
                new GenerateErrorResponse("Generator timed out", $"Process did not complete within {GeneratorTimeoutSeconds} seconds"),
                GenerateJsonContext.Default.GenerateErrorResponse,
                statusCode: 504);
        }
        await Task.WhenAll(stdoutTask, stderrTask);

        var exitCode = process.ExitCode;
        Console.WriteLine($"Generator exited with code {exitCode}");

        if (exitCode != 0)
        {
            return Results.Json(
                new GenerateErrorResponse($"Generator failed with exit code {exitCode}", string.Join("\n", stderrLines.TakeLast(50))),
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

        return Results.Json(
            new GenerateResponse(files),
            GenerateJsonContext.Default.GenerateResponse);
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
