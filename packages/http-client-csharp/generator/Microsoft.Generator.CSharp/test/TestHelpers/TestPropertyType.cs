using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.Tests
{
    public class PropertyType : TypeProvider
    {
        protected override PropertyProvider[] BuildProperties()
        {
            return
            [
                new PropertyProvider($"Foo property", MethodSignatureModifiers.Public, typeof(int), "Foo", new AutoPropertyBody(true), this),
            ];
        }

        protected override string BuildRelativeFilePath() => ".";

        protected override string BuildName() => "PropertyType";
    }
}
