
using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        [CodeGenMember("Prop1")]
        private string _prop1;
    }
}
