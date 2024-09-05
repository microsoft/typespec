#nullable disable

using System;

namespace Samples
{
    // TODO: if we decide to use the public APIs, we do not have to define this attribute here. Tracking: https://github.com/Azure/autorest.csharp/issues/4551
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct)]
    internal class CodeGenTypeAttribute : Attribute
    {
        public string OriginalName { get; }

        public CodeGenTypeAttribute(string originalName)
        {
            OriginalName = originalName;
        }
    }
}
namespace Samples.Models
{
    [CodeGenType("MockInputModel")]
    public partial readonly struct MockInputModel
    {
    }
}
