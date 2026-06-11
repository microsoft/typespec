
namespace Sample
{
    /// <summary>
    /// An unreferenced model whose only usings (System.Diagnostics.CodeAnalysis and System.Text) become
    /// unused after internalizing, so both using directives must be removed.
    /// </summary>
    internal class UnreferencedWithUnusedUsing
    {
    }
}
