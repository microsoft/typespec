// <auto-generated/>

#nullable disable

using System;

namespace Versioning.RenamedFrom.V2
{
    [AttributeUsage((AttributeTargets.Class | AttributeTargets.Struct))]
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
