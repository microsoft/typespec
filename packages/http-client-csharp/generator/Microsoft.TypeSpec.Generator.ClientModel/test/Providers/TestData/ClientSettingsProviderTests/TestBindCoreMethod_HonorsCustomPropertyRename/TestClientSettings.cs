#nullable disable

using System;
using Microsoft.TypeSpec.Generator.Customizations;

namespace SampleNamespace
{
    public partial class TestClientSettings
    {
        [CodeGenMember("Endpoint")]
        public Uri ServiceUri { get; set; }
    }
}
