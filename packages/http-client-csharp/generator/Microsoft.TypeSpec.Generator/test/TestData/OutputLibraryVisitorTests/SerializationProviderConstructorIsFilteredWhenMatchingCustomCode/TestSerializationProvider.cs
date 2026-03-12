using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Test
{
    /// <summary>
    /// This is used to verify constructor filtering for serialization providers when a constructor is repeated in custom code.
    /// </summary>
    public partial class TestSerializationProvider
    {
        public TestSerializationProvider(string param1) { }
    }
}

