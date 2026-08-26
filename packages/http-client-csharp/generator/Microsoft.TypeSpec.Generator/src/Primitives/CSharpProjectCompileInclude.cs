// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Primitives;

/// <summary>
/// Represents a compile include item in a `csproj` file.
/// </summary>
/// <param name="Include"></param>
/// <param name="LinkBase"></param>
public record CSharpProjectCompileInclude(string Include, string? LinkBase)
{
    public CSharpProjectCompileInclude(string include) : this(include, null) { }
}
