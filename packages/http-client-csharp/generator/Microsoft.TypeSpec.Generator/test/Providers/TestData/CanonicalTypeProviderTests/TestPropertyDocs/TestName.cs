using System.ClientModel.Primitives;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using Sample;

namespace Sample.Models
{
    [CodeGenType("TestName")]
    public class TestName
    {
        /// <summary>
        /// Custom summary for SpecProperty
        /// </summary>
        [CodeGenMember("IntProperty")]
        public string IntProperty { get; set; }

        /// <summary>
        /// Custom summary for CustomProperty
        /// </summary>
        public int CustomProperty { get; set; }
    }
}
