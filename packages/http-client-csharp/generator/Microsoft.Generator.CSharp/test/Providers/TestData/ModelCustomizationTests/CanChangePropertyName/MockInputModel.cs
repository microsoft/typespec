#nullable disable

using Sample;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        public string[] Prop2 { get; set; }
    }
}
