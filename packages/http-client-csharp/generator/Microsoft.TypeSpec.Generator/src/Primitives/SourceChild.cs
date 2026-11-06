// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal sealed record SourceChild(string Role, object Producer, bool EmissionBoundary = true,
        CSharpType? TargetType = null, CSharpType? MethodReturnType = null, MethodProvider? ParameterOwner = null);
}
