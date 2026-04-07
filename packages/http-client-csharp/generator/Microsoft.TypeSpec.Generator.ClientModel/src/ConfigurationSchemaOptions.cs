// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.ClientModel
{
    /// <summary>
    /// Options that control ConfigurationSchema.json generation.
    /// </summary>
    public class ConfigurationSchemaOptions
    {
        /// <summary>
        /// Gets or sets the top-level section name used in the generated ConfigurationSchema.json.
        /// Defaults to "Clients". Azure SDK generators should set this to "AzureClients".
        /// </summary>
        public string SectionName { get; set; } = ConfigurationSchemaGenerator.DefaultSectionName;

        /// <summary>
        /// Gets or sets the $ref value used for the base options definition in the generated ConfigurationSchema.json.
        /// Defaults to "options". Azure SDK generators should set this to "azureOptions".
        /// </summary>
        public string OptionsRef { get; set; } = ConfigurationSchemaGenerator.DefaultOptionsRef;

        /// <summary>
        /// Gets or sets whether to generate the .NuGet.targets file alongside the ConfigurationSchema.json.
        /// Defaults to true. Set to false when the build infrastructure handles targets file packing centrally.
        /// </summary>
        public bool GenerateNuGetTargets { get; set; } = true;
    }
}
