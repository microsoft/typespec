using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;

namespace Microsoft.TypeSpec.VisualStudio;

internal static class ServerConfiguration
{
    public static ProcessStartInfo CreateStartInfo(
        string? workspaceFolder,
        string? nodeOptions = null,
        string? developmentServerPath = null)
    {
        var info = new ProcessStartInfo
        {
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        if (!string.IsNullOrEmpty(workspaceFolder))
        {
            info.WorkingDirectory = workspaceFolder;
        }

        if (developmentServerPath != null)
        {
            info.FileName = "node.exe";
            info.Arguments = $"{nodeOptions} \"{developmentServerPath}\" --stdio";
            return info;
        }
        if (!string.IsNullOrEmpty(nodeOptions))
        {
            info.Environment["NODE_OPTIONS"] = nodeOptions;
        }

        var serverPath = ReadConfiguredServerPath(workspaceFolder);
        if (string.IsNullOrEmpty(serverPath) && workspaceFolder != null)
        {
            serverPath = FindLocalCompiler(workspaceFolder);
        }
        if (string.IsNullOrEmpty(serverPath))
        {
            SetCommandScript(info, "tsp-server.cmd");
            return info;
        }

        var variables = new Dictionary<string, string>();
        if (workspaceFolder != null)
        {
            variables.Add("workspaceFolder", workspaceFolder);
        }
        serverPath = VariableResolver.ResolveVariables(serverPath, variables);
        serverPath = Path.GetFullPath(serverPath, workspaceFolder ?? Environment.CurrentDirectory);
        if (Directory.Exists(serverPath))
        {
            serverPath = Path.Combine(serverPath, "cmd", "tsp-server.js");
        }
        else if (!File.Exists(serverPath) && File.Exists(serverPath + ".cmd"))
        {
            serverPath += ".cmd";
        }
        if (!File.Exists(serverPath))
        {
            throw new TypeSpecServerNotFoundException(serverPath);
        }

        if (serverPath.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
        {
            info.FileName = "node.exe";
            info.ArgumentList.Add(serverPath);
            info.ArgumentList.Add("--stdio");
            info.Environment["TYPESPEC_SKIP_COMPILER_RESOLVE"] = "1";
        }
        else if (serverPath.EndsWith(".cmd", StringComparison.OrdinalIgnoreCase)
            || serverPath.EndsWith(".bat", StringComparison.OrdinalIgnoreCase))
        {
            SetCommandScript(info, serverPath);
        }
        else
        {
            info.FileName = serverPath;
            info.ArgumentList.Add("--stdio");
        }
        return info;
    }

    private static void SetCommandScript(ProcessStartInfo info, string serverPath)
    {
        info.FileName = "cmd.exe";
        info.Arguments = $"/d /s /c \"\"{serverPath}\" --stdio\"";
    }

    private static string? FindLocalCompiler(string directory)
    {
        for (string? current = directory; current != null; current = Path.GetDirectoryName(current))
        {
            var candidate = Path.Combine(current, "node_modules", "@typespec", "compiler");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }
        }
        return null;
    }

    private static string? ReadConfiguredServerPath(string? workspaceFolder)
    {
        if (workspaceFolder == null)
        {
            return null;
        }
        var settingsPath = Path.Combine(workspaceFolder, ".vs", "VSWorkspaceSettings.json");
        if (!File.Exists(settingsPath))
        {
            return null;
        }
        try
        {
            using var settings = JsonDocument.Parse(File.ReadAllText(settingsPath), new JsonDocumentOptions
            {
                AllowTrailingCommas = true,
                CommentHandling = JsonCommentHandling.Skip,
            });
            if (settings.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new JsonException("Workspace settings must be a JSON object.");
            }
            return settings.RootElement.TryGetProperty("typespec.tsp-server.path", out var value)
                && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
        }
        catch (Exception e) when (e is IOException || e is UnauthorizedAccessException || e is JsonException)
        {
            throw new TypeSpecUserErrorException($"Error reading {settingsPath}: {e.Message}", e);
        }
    }
}
