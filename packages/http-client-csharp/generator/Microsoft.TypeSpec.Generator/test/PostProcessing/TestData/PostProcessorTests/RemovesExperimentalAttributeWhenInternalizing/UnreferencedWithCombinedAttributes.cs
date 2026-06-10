using System;
using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    /// <summary>
    /// An unreferenced model with the experimental attribute combined in a single list.
    /// </summary>
    [Serializable, Experimental("EXP001")]
    public class UnreferencedWithCombinedAttributes
    {
    }
}
