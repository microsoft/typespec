// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed record SourceChild(string Role, object Producer, bool EmissionBoundary = true);
}
