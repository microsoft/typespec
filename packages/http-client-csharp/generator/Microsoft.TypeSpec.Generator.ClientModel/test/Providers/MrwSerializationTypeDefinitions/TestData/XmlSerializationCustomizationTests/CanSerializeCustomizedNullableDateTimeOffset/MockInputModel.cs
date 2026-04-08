
using System;
using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        // Customizing Timestamp to be nullable DateTimeOffset instead of required DateTimeOffset
        [CodeGenMember("Timestamp")]
        public DateTimeOffset? CustomTimestamp { get; set; }
    }
}
