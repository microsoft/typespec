using System.Diagnostics.CodeAnalysis;
using System.Text;

namespace Sample
{
    /// <summary>
    /// An unreferenced model whose only usings (System.Diagnostics.CodeAnalysis and System.Text) become
    /// unused after internalizing, so both using directives must be removed.
    /// </summary>
    [Experimental("EXP001")]
    public class UnreferencedWithUnusedUsing
    {
    }
}
