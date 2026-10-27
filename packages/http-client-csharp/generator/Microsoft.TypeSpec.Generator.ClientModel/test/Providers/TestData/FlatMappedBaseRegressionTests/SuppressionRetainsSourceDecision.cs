// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    [System.AttributeUsage(System.AttributeTargets.Class, AllowMultiple = true)]
    internal sealed class CodeGenSuppressAttribute : System.Attribute
    {
        public CodeGenSuppressAttribute(string memberName, params System.Type[] parameterTypes) { }
    }
    [CodeGenSuppress("__SUPPRESSED_NAME__")]
    public partial class DerivedModel { }
}
