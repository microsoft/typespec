using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.Tests
{
    public class MockExtensibleSnippets : ExtensibleSnippets
    {
        public override ModelSnippets Model { get; } = null!;
        public override RestOperationsSnippets RestOperations { get; } = null!;
    }
}
