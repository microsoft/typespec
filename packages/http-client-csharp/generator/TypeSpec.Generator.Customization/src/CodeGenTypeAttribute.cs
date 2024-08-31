// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable enable

using System;

namespace TypeSpec.Generator.Customization
{
    [AttributeUsage(AttributeTargets.Class)]
    public class CodeGenTypeAttribute : Attribute
    {
        public string? OriginalName { get; }

        public CodeGenTypeAttribute(string? originalName)
        {
            OriginalName = originalName;
        }
    }
}
