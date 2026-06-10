using System;
using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    /// <summary>
    /// An unreferenced model that carries another attribute which must be preserved.
    /// </summary>
    [Serializable]
    [Experimental("EXP001")]
    public class UnreferencedWithOtherAttribute
    {
    }
}
