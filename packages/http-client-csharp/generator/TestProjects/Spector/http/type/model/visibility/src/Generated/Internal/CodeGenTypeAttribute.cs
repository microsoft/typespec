// <auto-generated/>

#nullable disable

using System;

namespace _Type.Model.Visibility
{
    [AttributeUsage((AttributeTargets.Class | AttributeTargets.Enum | AttributeTargets.Struct))]
    internal partial class CodeGenTypeAttribute : Attribute
    {
        public CodeGenTypeAttribute(string originalName)
        {
            OriginalName = originalName;
        }

        /// <summary> Gets the OriginalName. </summary>
        public string OriginalName { get; }
    }
}
