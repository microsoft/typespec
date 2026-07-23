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
}
