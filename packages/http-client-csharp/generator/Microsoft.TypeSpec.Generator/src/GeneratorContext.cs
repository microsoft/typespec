// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator
{
    /// <summary>
    /// Provides context information for code generation operations.
    /// </summary>
    public class GeneratorContext
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GeneratorContext"/> class for mocking purposes.
        /// </summary>
        /// <summary>
        /// For mocking.
        /// </summary>
        protected GeneratorContext()
        {
            // should be mocked
            Configuration = null!;
        }
        internal GeneratorContext(Configuration configuration)
        {
            Configuration = configuration;
        }

        public Configuration Configuration { get; }
    }
}
