// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable enable

using System;

namespace Microsoft.Generator.CSharp.Customization
{
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
    public class CodeGenMemberAttribute : CodeGenTypeAttribute
    {
        public CodeGenMemberAttribute() : base(null)
        {
        }

        public CodeGenMemberAttribute(string originalName) : base(originalName)
        {
        }
    }
}
