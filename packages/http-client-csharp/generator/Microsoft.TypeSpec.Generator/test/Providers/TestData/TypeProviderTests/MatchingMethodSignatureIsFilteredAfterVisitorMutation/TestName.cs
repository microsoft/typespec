using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SampleTypeSpec
{
    /// <summary>
    /// This is used to verify method replacement when a method signature is changed in a visitor to match the below custom definition.
    /// </summary>
    public partial class TestName
    {
        public void Test(int param1) { }
    }
}
