// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Contains configuration for the generator implemented as a singleton.
    /// </summary>
    public class Configuration
    {
        internal enum UnreferencedTypesHandlingOption
        {
            RemoveOrInternalize = 0,
            Internalize = 1,
            KeepAll = 2
        }

        private const string GeneratedFolderName = "Generated";
        private const string ConfigurationFileName = "Configuration.json";

        // for mocking
        protected Configuration()
        {
            OutputDirectory = null!;
            AdditionalConfigOptions = null!;
            LibraryName = null!;
        }

        private Configuration(
            string outputPath,
            Dictionary<string, BinaryData> additionalConfigOptions,
            bool clearOutputFolder,
            string libraryName,
            bool disableXmlDocs,
            UnreferencedTypesHandlingOption unreferencedTypesHandling)
        {
            OutputDirectory = outputPath;
            AdditionalConfigOptions = additionalConfigOptions;
            ClearOutputFolder = clearOutputFolder;
            LibraryName = libraryName;
            DisableXmlDocs = disableXmlDocs;
            UnreferencedTypesHandling = unreferencedTypesHandling;
        }

        /// <summary>
        /// Contains the known set of configuration options.
        /// </summary>
        private static class Options
        {
            public const string ClearOutputFolder = "clear-output-folder";
            public const string LibraryName = "library-name";
            public const string DisableXmlDocs = "disable-xml-docs";
            public const string UnreferencedTypesHandling = "unreferenced-types-handling";
        }

        /// <summary>
        /// Gets whether XML docs are disabled.
        /// </summary>
        public bool DisableXmlDocs { get; }

        /// <summary>
        /// Gets the root output directory for the generated library.
        /// </summary>
        public string OutputDirectory { get; }

        internal static UnreferencedTypesHandlingOption UnreferencedTypesHandling { get; private set; } = UnreferencedTypesHandlingOption.RemoveOrInternalize;

        private string? _projectDirectory;
        internal string ProjectDirectory => _projectDirectory ??= Path.Combine(OutputDirectory, "src");

        private string? _testProjectDirectory;
        internal string TestProjectDirectory => _testProjectDirectory ??= Path.Combine(OutputDirectory, "tests");

        private string? _projectGeneratedDirectory;
        internal string ProjectGeneratedDirectory => _projectGeneratedDirectory ??= Path.Combine(ProjectDirectory, GeneratedFolderName);

        private string? _testGeneratedDirectory;
        internal string TestGeneratedDirectory => _testGeneratedDirectory ??= Path.Combine(TestProjectDirectory, GeneratedFolderName);

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
        /// Initializes the configuration from the given path to the configuration file.
        /// </summary>
        /// <param name="outputPath">The path to the configuration JSON file.</param>
        internal static Configuration Load(string outputPath, string? json = null)
        {
            var configFile = Path.Combine(outputPath, ConfigurationFileName);
            if (!File.Exists(configFile) && json is null)
            {
                throw new InvalidOperationException($"Configuration file {configFile} does not exist.");
            }

            var root = json is null
                ? JsonDocument.Parse(File.Open(configFile, FileMode.Open, FileAccess.Read, FileShare.Read)).RootElement
                : JsonDocument.Parse(json).RootElement;

            return new Configuration(
                Path.GetFullPath(outputPath),
                ParseAdditionalConfigOptions(root),
                ReadOption(root, Options.ClearOutputFolder),
                ReadRequiredStringOption(root, Options.LibraryName),
                ReadOption(root, Options.DisableXmlDocs),
                ReadEnumOption<UnreferencedTypesHandlingOption>(root, Options.UnreferencedTypesHandling));
        }

        /// <summary>
        /// The default values for the boolean configuration options.
        /// </summary>
        private static readonly Dictionary<string, bool> _defaultBoolOptionValues = new()
        {
            { Options.ClearOutputFolder, true },
            { Options.DisableXmlDocs, false },
        };

        /// <summary>
        /// The known set of configuration options.
        /// </summary>
        private static readonly HashSet<string> _knownOptions = new()
        {
            Options.ClearOutputFolder,
            Options.LibraryName,
            Options.DisableXmlDocs,
            Options.UnreferencedTypesHandling,
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

        private static T ReadEnumOption<T>(JsonElement root, string option) where T : struct, Enum
        {
            if (root.TryGetProperty(option, out JsonElement value) && Enum.TryParse<T>(value.ToString(), true, out var enumValue))
            {
                return enumValue;
            }

            return (T)GetDefaultEnumOptionValue(option)!;
        }

        public static Enum? GetDefaultEnumOptionValue(string option) => option switch
        {
            Options.UnreferencedTypesHandling => UnreferencedTypesHandlingOption.RemoveOrInternalize,
            _ => null
        };

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
