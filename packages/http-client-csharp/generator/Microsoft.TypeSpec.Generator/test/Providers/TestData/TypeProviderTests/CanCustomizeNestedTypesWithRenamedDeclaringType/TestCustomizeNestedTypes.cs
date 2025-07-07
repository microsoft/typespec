using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SampleTypeSpec;

namespace Test
{
    /// <summary>
    /// This is a simple test type.
    /// </summary>
    [CodeGenType("TestCustomizeNestedTypes")]
    public class RenamedType
    {
        public enum TestEnum
        {
            Value1,
            Value2,
            Value3
        }
    }
}
