// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable enable

using System;

namespace TypeSpec.Generator.Customization
{
    [AttributeUsage(AttributeTargets.Assembly, AllowMultiple = true)]
    public class CodeGenOverrideServiceVersionsAttribute : Attribute
    {
        public string[] Versions { get; }

        public CodeGenOverrideServiceVersionsAttribute(params string[] versions)
        {
            Versions = versions;
        }
    }
}
