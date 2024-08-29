#nullable disable

using System;

namespace NewNamespace
{
    [AttributeUsage(AttributeTargets.Class)]
    internal class CodeGenTypeAttribute : Attribute
    {
        public string OriginalName { get; }

        public CodeGenTypeAttribute(string originalName)
        {
            OriginalName = originalName;
        }
    }
}
namespace NewNamespace.Models
{
    [CodeGenType("MockInputModel")]
    public partial class CustomizedModel
    {
    }
}
