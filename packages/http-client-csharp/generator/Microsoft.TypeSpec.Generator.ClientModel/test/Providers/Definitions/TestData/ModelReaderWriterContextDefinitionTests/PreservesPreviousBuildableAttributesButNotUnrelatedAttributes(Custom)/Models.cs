using System;
using System.Diagnostics.CodeAnalysis;

namespace Sample.Models
{
    public class CurrentModel
    {
    }

    [Obsolete("Use CurrentModel instead.")]
    public class PreviousModel
    {
    }

    [Experimental("TEST001")]
    public class ExperimentalPreviousModel
    {
    }

    [Obsolete("This model cannot be used.", true)]
    public class ErrorObsoleteModel
    {
    }

    [Obsolete("This enclosing type cannot be used.", true)]
    public class ErrorObsoleteOuter
    {
        public class NestedModel
        {
        }
    }

    public class GenericModel<T>
    {
    }

    [Obsolete("This type argument cannot be used.", true)]
    public class ErrorObsoleteTypeArgument
    {
    }
}
