
using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models
{
    public partial class Model
    {
        [CodeGenMember("Prop1")]
        public string[] Prop2 { get; set; }
    }
}
