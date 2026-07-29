using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class PropertyType : TypeProvider
    {
        protected internal override PropertyProvider[] BuildProperties()
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
