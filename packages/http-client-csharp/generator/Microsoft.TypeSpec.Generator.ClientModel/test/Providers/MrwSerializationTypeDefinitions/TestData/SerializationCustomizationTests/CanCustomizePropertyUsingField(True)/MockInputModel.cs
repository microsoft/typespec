
using SampleTypeSpec;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        private string _prop1;

        public string Prop1
        {
            get => _prop1;
            set => _prop1 = value;
        }
    }
}
