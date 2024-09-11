#nullable disable

using System;

namespace Sample
{
    // TODO: if we decide to use the public APIs, we do not have to define this attribute here. Tracking: https://github.com/Azure/autorest.csharp/issues/4551
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
    internal class CodeGenMemberAttribute : Attribute
    {
        public CodeGenMemberAttribute() : base(null)
        {
        }

        public CodeGenMemberAttribute(string originalName) : base(originalName)
        {
        }
    }
}
namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        public int[] Prop2 { get; set; }
    }
}
