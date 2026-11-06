// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal enum PreparedNameChannel
    {
        Field,
        Body
    }

    // Owned spelling plus a numeric range, never a span into pooled writer buffers.
    // Offset is payload-relative during capture and file-relative after rendering.
    // This is output evidence only, not a name-binding or source-edit permission.
    internal readonly record struct PreparedNameAlternative(
        int QualifiedOffset, int QualifiedLength, string ShortSpelling, PreparedNameChannel Channel);
}
