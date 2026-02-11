using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Test
{
    /// <summary>
    /// Custom method with int parameter. The generated method initially has int too (matching),
    /// but a visitor changes it to float (no longer matching), so the generated method should be kept.
    /// </summary>
    public partial class TestName
    {
        public void TestMethod(int param1) { }
    }
}
