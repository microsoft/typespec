#nullable disable

using Sample;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        public int[] Prop2 { get; set; }
    }
}
