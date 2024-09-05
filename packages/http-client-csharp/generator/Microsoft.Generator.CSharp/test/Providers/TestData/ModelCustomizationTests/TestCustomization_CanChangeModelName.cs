#nullable disable

using System;

namespace NewNamespace
{
    // TODO: if we decide to use the public APIs, we do not have to define this attribute here. Tracking: https://github.com/Azure/autorest.csharp/issues/4551
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
