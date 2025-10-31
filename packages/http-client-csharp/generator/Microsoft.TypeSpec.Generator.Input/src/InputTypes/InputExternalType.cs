// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{
    /// <summary>
    /// Represents an external type reference in the input model.
    /// </summary>
    public sealed class InputExternalType : InputType
    {
        /// <summary>
        /// Construct a new <see cref="InputExternalType"/> instance
        /// </summary>
        /// <param name="identity">The fully qualified name of the external type.</param>
        /// <param name="package">The package that exports the external type.</param>
        /// <param name="minVersion">The minimum version of the package.</param>
        public InputExternalType(string identity, string? package, string? minVersion) : base("external")
        {
            Identity = identity;
            Package = package;
            MinVersion = minVersion;
        }

        /// <summary>
        /// The fully qualified name of the external type. For example, "Azure.Core.Expressions.DataFactoryExpression"
        /// </summary>
        public string Identity { get; }

        /// <summary>
        /// The package that exports the external type. For example, "Azure.Core.Expressions"
        /// </summary>
        public string? Package { get; }

        /// <summary>
        /// The minimum version of the package to use for the external type. For example, "1.0.0"
        /// </summary>
        public string? MinVersion { get; }
    }
}
