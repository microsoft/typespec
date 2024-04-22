﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Contains configuration for the generator implemented as a singleton.
    /// </summary>
    public class Configuration
    {
        private const string ConfigurationFileName = "Configuration.json";

        // TO-DO: decouple and refactor apitypes from configuration https://github.com/Azure/autorest.csharp/issues/4226
#pragma warning disable CS0649 // Field 'Configuration._apiTypes' & 'Configuration.__extensibleSnippets' is never assigned to, and will always have its default value null
        private ApiTypes? _apiTypes;
#pragma warning restore CS0649 // Field 'Configuration._apiTypes' & 'Configuration.__extensibleSnippets' is never assigned to, and will always have its default value null

        private Configuration(
            string outputPath,
            Dictionary<string, BinaryData> additionalConfigOptions,
            bool clearOutputFolder,
            bool generateModelFactory,
            bool generateSampleProject,
            bool generateTestProject,
            string libraryName,
            bool useModelNamespace,
            string libraryNamespace)
        {
            OutputDirectory = outputPath;
            AdditionalConfigOptions = additionalConfigOptions;
            ClearOutputFolder = clearOutputFolder;
            GenerateModelFactory = generateModelFactory;
            GenerateSampleProject = generateSampleProject;
            GenerateTestProject = generateTestProject;
            LibraryName = libraryName;
            UseModelNamespace = useModelNamespace;
            Namespace = libraryNamespace;
        }

        /// <summary>
        /// Contains the known set of configuration options.
        /// </summary>
        private static class Options
        {
            public const string ClearOutputFolder = "clear-output-folder";
            public const string GenerateModelFactory = "generate-model-factory";
            public const string GenerateSampleProject = "generate-sample-project";
            public const string GenerateTestProject = "generate-test-project";
            public const string LibraryName = "library-name";
            public const string Namespace = "namespace";
            public const string UseModelNamespace = "use-model-namespace";
        }

        public ApiTypes ApiTypes => _apiTypes ?? throw new InvalidOperationException("Configuration has not been initialized");

        /// Returns the singleton instance of the configuration.
        public string Namespace { get; }

        internal string OutputDirectory { get; }

        private string? _projectDirectory;
        internal string ProjectDirectory => _projectDirectory ??= Path.Combine(OutputDirectory, "src");

        internal string LibraryName { get; }

        /// <summary>
        /// True if the output folder should be cleared before generating the code.
        /// </summary>
        internal bool ClearOutputFolder { get; private set; }

        /// <summary>
        /// Whether we will generate model factory for this library.
        /// If true (default), the model factory will be generated. If false, the model factory will not be generated.
        /// </summary>
        internal bool GenerateModelFactory { get; private set; }

        /// <summary>
        /// True if a sample project should be generated.
        /// </summary>
        internal bool GenerateSampleProject { get; private set; }

        /// <summary>
        /// True if a test project should be generated.
        /// </summary>
        internal bool GenerateTestProject { get; private set; }

        // The additional configuration options read from the input configuration file.
        public Dictionary<string, BinaryData> AdditionalConfigOptions { get; }

        /// <summary>
        /// True if the models contain a separate namespace.
        /// </summary>
        internal bool UseModelNamespace { get; private set; }

        /// <summary>
        /// Initializes the configuration from the given path to the configuration file.
        /// </summary>
        /// <param name="outputPath">The path to the configuration JSON file.</param>
        internal static Configuration Load(string outputPath, string? json = null)
        {
            var configFile = Path.Combine(outputPath, ConfigurationFileName);
            if (!File.Exists(configFile) && json is null)
            {
                throw new InvalidOperationException($"Configuration file {outputPath} does not exist.");
            }

            var root = json is null
                ? JsonDocument.Parse(File.Open(configFile, FileMode.Open, FileAccess.Read, FileShare.Read)).RootElement
                : JsonDocument.Parse(json).RootElement;

            return new Configuration(
                outputPath.Equals(string.Empty) ? outputPath :Path.GetFullPath(outputPath),
                ParseAdditionalConfigOptions(root),
                ReadOption(root, Options.ClearOutputFolder),
                ReadOption(root, Options.GenerateModelFactory),
                ReadOption(root, Options.GenerateSampleProject),
                ReadOption(root, Options.GenerateTestProject),
                ReadRequiredStringOption(root, Options.LibraryName),
                ReadOption(root, Options.UseModelNamespace),
                ReadRequiredStringOption(root, Options.Namespace));
        }

        /// <summary>
        /// The default values for the boolean configuration options.
        /// </summary>
        private static readonly Dictionary<string, bool> _defaultBoolOptionValues = new()
        {
            { Options.UseModelNamespace, true },
            { Options.GenerateModelFactory, true },
            { Options.GenerateSampleProject, true },
            { Options.ClearOutputFolder, false },
            { Options.GenerateTestProject, false }
        };

        /// <summary>
        /// The known set of configuration options.
        /// </summary>
        private static readonly HashSet<string> _knownOptions = new()
        {
            Options.ClearOutputFolder,
            Options.GenerateModelFactory,
            Options.GenerateSampleProject,
            Options.GenerateTestProject,
            Options.LibraryName,
            Options.UseModelNamespace,
            Options.Namespace,
        };

        private static bool ReadOption(JsonElement root, string option)
        {
            if (root.TryGetProperty(option, out JsonElement value))
            {
                return value.GetBoolean();
            }
            else
            {
                return GetDefaultBoolOptionValue(option);
            }
        }

        private static string ReadRequiredStringOption(JsonElement root, string option)
        {
            return ReadStringOption(root, option) ?? throw new InvalidOperationException($"Unable to parse required option {option} from configuration.");
        }


        private static string? ReadStringOption(JsonElement root, string option)
        {
            if (root.TryGetProperty(option, out JsonElement value))
                return value.GetString();

            return null;
        }

        /// <summary>
        /// Returns the default value for the given option.
        /// </summary>
        /// <param name="option">The option to parse.</param>
        private static bool GetDefaultBoolOptionValue(string option)
        {
            return _defaultBoolOptionValues.TryGetValue(option, out bool defaultValue) && defaultValue;
        }

        /// <summary>
        /// Parses the additional configuration options from the given JSON element root and stores them in a dictionary.
        /// </summary>
        /// <param name="root">The json root element to parse.</param>
        /// <returns>A dictionary containing the set of configuration options represented as key-value pairs.</returns>
        private static Dictionary<string, BinaryData> ParseAdditionalConfigOptions(JsonElement root)
        {
            var optionsDict = new Dictionary<string, BinaryData>();
            foreach (var property in root.EnumerateObject())
            {
                var propertyName = property.Name;
                if (!IsKnownOption(propertyName))
                {
                    BinaryData value = BinaryData.FromObjectAsJson(property.Value);
                    optionsDict.TryAdd(propertyName, value);
                }
            }

            return optionsDict;
        }

        /// <summary>
        /// Validates if the given option is a known configuration option from <see cref="Options"/>."/>.
        /// </summary>
        /// <param name="option">The configuration option name.</param>
        /// <returns><c>true</c> if the option is a known option.</returns>
        private static bool IsKnownOption(string option)
        {
            return _knownOptions.Contains(option);
        }
    }
}
