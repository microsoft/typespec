using System;
using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    [Experimental("ARG001")]
    [Obsolete("Use another type argument instead.")]
    public class TypeArgument
    {
    }

    [Experimental("ARG001")]
    public class Outer<T>
    {
        public class Middle
        {
            public class DeepModel
            {
            }
        }
    }
}
