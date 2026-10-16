using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.VisualStudio;
using NUnit.Framework;

namespace Microsoft.TypeSpec.VisualStudio.Tests;

public class ServerConfigurationTests
{
    private string _root = null!;

    [SetUp]
    public void SetUp()
    {
        _root = Path.Combine(Path.GetTempPath(), "typespec-vs-" + Guid.NewGuid());
        Directory.CreateDirectory(_root);
    }

    [TearDown]
    public void TearDown()
    {
        Directory.Delete(_root, recursive: true);
    }

    [Test]
    public void FindsCompilerInParentDirectory()
    {
        var server = CreateFile("node_modules", "@typespec", "compiler", "cmd", "tsp-server.js");
        var workspace = Path.Combine(_root, "nested", "project");
        Directory.CreateDirectory(workspace);

        var info = ServerConfiguration.CreateStartInfo(workspace);

        Assert.That(info.FileName, Is.EqualTo("node.exe"));
        Assert.That(info.ArgumentList, Is.EqualTo(new[] { server, "--stdio" }));
        Assert.That(info.WorkingDirectory, Is.EqualTo(workspace));
        Assert.That(info.Environment["TYPESPEC_SKIP_COMPILER_RESOLVE"], Is.EqualTo("1"));
    }

    [Test]
    public void ConfiguredServerOverridesLocalCompilerAndExpandsWorkspaceFolder()
    {
        CreateFile("node_modules", "@typespec", "compiler", "cmd", "tsp-server.js");
        var server = CreateFile("custom compiler", "cmd", "tsp-server.js");
        WriteSettings("${workspaceFolder}/custom compiler");

        var info = ServerConfiguration.CreateStartInfo(_root);

        Assert.That(info.ArgumentList, Is.EqualTo(new[] { server, "--stdio" }));
    }

    [Test]
    public void QuotesConfiguredCommandScripts()
    {
        var server = CreateFile("custom compiler", "tsp-server.cmd");
        WriteSettings(server);

        var info = ServerConfiguration.CreateStartInfo(_root);

        Assert.That(info.FileName, Is.EqualTo("cmd.exe"));
        Assert.That(info.Arguments, Is.EqualTo($"/d /s /c \"\"{server}\" --stdio\""));
    }

    [Test]
    public void PreservesGlobalServerFallbackAndNodeOptions()
    {
        var info = ServerConfiguration.CreateStartInfo(_root, nodeOptions: "--max-old-space-size=4096");

        Assert.That(info.FileName, Is.EqualTo("cmd.exe"));
        Assert.That(info.Arguments, Is.EqualTo("/d /s /c \"\"tsp-server.cmd\" --stdio\""));
        Assert.That(info.Environment["NODE_OPTIONS"], Is.EqualTo("--max-old-space-size=4096"));
    }

    [Test]
    public void ReportsInvalidWorkspaceSettings()
    {
        var settings = CreateFile(".vs", "VSWorkspaceSettings.json");
        File.WriteAllText(settings, "{");

        var error = Assert.Throws<TypeSpecUserErrorException>(() => ServerConfiguration.CreateStartInfo(_root));

        Assert.That(error!.Message, Does.Contain(settings));
        Assert.That(error.InnerException, Is.InstanceOf<JsonException>());
    }

    [Test]
    public void AcceptsWorkspaceSettingsWithCommentsAndTrailingCommas()
    {
        var server = CreateFile("custom compiler", "cmd", "tsp-server.js");
        var settings = CreateFile(".vs", "VSWorkspaceSettings.json");
        File.WriteAllText(settings, """
            {
                // Visual Studio workspace settings
                "typespec.tsp-server.path": "${workspaceFolder}/custom compiler",
            }
            """);

        var info = ServerConfiguration.CreateStartInfo(_root);

        Assert.That(info.ArgumentList[0], Is.EqualTo(server));
    }

    [Test]
    public void ReportsMissingConfiguredServer()
    {
        WriteSettings("missing compiler");

        Assert.Throws<TypeSpecServerNotFoundException>(() => ServerConfiguration.CreateStartInfo(_root));
    }

    [Test]
    [Platform("Win")]
    public async Task LaunchesCommandScriptFromPathWithSpaces()
    {
        var server = CreateFile("custom compiler", "tsp-server.cmd");
        File.WriteAllText(server, "@echo off\r\necho %1\r\n");
        WriteSettings(server);

        using var process = Process.Start(ServerConfiguration.CreateStartInfo(_root))!;
        var output = await process.StandardOutput.ReadToEndAsync();
        await process.WaitForExitAsync();

        Assert.That(process.ExitCode, Is.Zero);
        Assert.That(output.Trim(), Is.EqualTo("--stdio"));
    }

    private void WriteSettings(string serverPath)
    {
        var settings = CreateFile(".vs", "VSWorkspaceSettings.json");
        File.WriteAllText(settings, JsonSerializer.Serialize(new Dictionary<string, string>
        {
            ["typespec.tsp-server.path"] = serverPath,
        }));
    }

    private string CreateFile(params string[] segments)
    {
        var path = Path.Combine(_root, Path.Combine(segments));
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        File.WriteAllText(path, "");
        return path;
    }
}
