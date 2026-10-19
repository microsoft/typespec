using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class ConcreteListRequest
    {
        [CodeGenMember("Tags")]
        public List<string> Tags { get; set; }
    }
}
