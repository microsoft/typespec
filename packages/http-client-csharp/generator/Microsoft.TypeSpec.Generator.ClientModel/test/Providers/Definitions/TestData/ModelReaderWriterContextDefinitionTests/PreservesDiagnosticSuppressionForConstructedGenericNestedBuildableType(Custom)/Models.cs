using System;
using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    [Experimental("ARG001")]
    public class TypeArgument
    {
    }

    [Obsolete("Use another outer type instead.")]
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
