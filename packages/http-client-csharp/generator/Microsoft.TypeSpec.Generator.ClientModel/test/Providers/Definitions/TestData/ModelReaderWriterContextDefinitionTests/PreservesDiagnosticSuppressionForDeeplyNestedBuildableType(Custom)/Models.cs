using System;

namespace Sample.Models
{
    public class Outer
    {
        public class Middle
        {
            [Obsolete("Use another model instead.")]
            public class DeepModel
            {
            }
        }
    }
}
