// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Tests
{
    internal class CustomCodeWriterExtensionMethods : CodeWriterExtensionMethods
    {
        public override string LicenseString => "// License string";

        public override void WriteMethod(CodeWriter writer, Method method)
        {
            writer.AppendRaw("Custom implementation");
        }
    }
}
