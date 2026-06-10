using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    /// <summary>
    /// A model that is referenced from a root type and therefore stays public.
    /// </summary>
    [Experimental("EXP001")]
    public class ReferencedModel
    {
    }
}
