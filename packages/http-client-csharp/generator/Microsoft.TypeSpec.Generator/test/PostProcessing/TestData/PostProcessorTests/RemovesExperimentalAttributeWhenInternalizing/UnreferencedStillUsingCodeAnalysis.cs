using System.Diagnostics.CodeAnalysis;

namespace Sample
{
    /// <summary>
    /// An unreferenced model that still uses the System.Diagnostics.CodeAnalysis namespace through
    /// another attribute, so the using directive must be preserved after internalizing.
    /// </summary>
    [SuppressMessage("Category", "Rule")]
    [Experimental("EXP001")]
    public class UnreferencedStillUsingCodeAnalysis
    {
    }
}
