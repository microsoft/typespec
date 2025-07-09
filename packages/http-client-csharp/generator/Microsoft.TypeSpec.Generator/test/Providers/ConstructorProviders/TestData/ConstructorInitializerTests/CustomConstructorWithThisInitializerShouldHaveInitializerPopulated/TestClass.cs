using System;

namespace Sample.Models
{
    public class TestClass
    {
        public TestClass(int bar) : this(bar, "default")
        {
        }
        
        public TestClass(int bar, string name)
        {
        }
    }
}