// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable enable

using System;

namespace Microsoft.Generator.CSharp.Customization
{
    [AttributeUsage(AttributeTargets.Assembly, AllowMultiple = true)]
    public class CodeGenSuppressTypeAttribute : Attribute
    {
        public string Typename { get; }

        public CodeGenSuppressTypeAttribute(string typename)
        {
            Typename = typename;
        }
    }
}
