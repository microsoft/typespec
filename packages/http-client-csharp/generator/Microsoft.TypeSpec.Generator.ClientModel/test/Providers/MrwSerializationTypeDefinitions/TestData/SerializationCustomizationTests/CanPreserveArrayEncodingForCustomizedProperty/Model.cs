
using SampleTypeSpec;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class Model
    {
        [CodeGenMember("Prop1")]
        public IList<string> Prop2 { get; internal set; }
    }
}
