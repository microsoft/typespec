#nullable disable

using Sample;
using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        public int[] Prop2 { get; set; }
    }
}
