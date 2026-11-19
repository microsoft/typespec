// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Field)]
    internal sealed class CodeGenMemberAttribute : System.Attribute
    {
        public CodeGenMemberAttribute(string name) { }
    }
    public partial class DerivedModel
    {
        [CodeGenMember("__ORIGINAL_NAME__")]
        public int RenamedValue { get; set; }
    }
}
