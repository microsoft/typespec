using System;
using Sample.Models;
using Microsoft.TypeSpec.Generator.Tests.Writers

namespace Sample
{
    public class KeepMe
    {
        /// <summary> Reference to a type in a different namespace like <see cref="global::Microsoft.TypeSpec.Generator.Tests.Writers.CodeScopeTests"/> </summary>
        public Model Foo() => new Model();
    }
}
";
