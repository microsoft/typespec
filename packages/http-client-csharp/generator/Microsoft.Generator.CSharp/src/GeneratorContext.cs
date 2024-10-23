// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp
{
    public class GeneratorContext
    {
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
