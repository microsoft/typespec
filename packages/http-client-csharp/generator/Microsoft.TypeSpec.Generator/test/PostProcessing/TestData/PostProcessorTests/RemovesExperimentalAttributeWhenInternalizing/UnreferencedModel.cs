using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    /// <summary>
    /// A model that is not referenced from any root type and is internalized.
    /// </summary>
    [Experimental("EXP001")]
    public class UnreferencedModel
    {
    }
}
