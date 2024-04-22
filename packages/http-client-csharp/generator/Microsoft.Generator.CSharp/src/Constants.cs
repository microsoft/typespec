// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Constants shared between the components of the core generator.
    /// </summary>
    internal static class Constants
    {
        /// <summary>
        /// The default name of the generated code folder that the generator will output to.
        /// </summary>
        public const string DefaultGeneratedCodeFolderName = "Generated";

        /// <summary>
        /// The default name of the generated test folder that the generator will output to.
        /// </summary>
        public const string DefaultGeneratedTestFolderName = "GeneratedTests";

        /// <summary>
        /// The default name of the generated code folder in the project workspace..
        /// </summary>
        public const string DefaultGeneratedCodeProjectFolderName = "GeneratedCode";

        /// <summary>
        /// The default name of the configuration file.
        /// </summary>
        public const string DefaultConfigurationFileName = "Configuration.json";

        /// <summary>
        /// The default name of the code model file.
        /// </summary>
        public const string DefaultCodeModelFileName = "tspCodeModel.json";

        /// <summary>
        /// The error message when the configuration has not been initialized.
        /// </summary>
        public const string ConfigurationNotInitializedError = "Configuration has not been initialized.";
    }
}
