using SampleTypeSpec;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Models;

public readonly partial struct DiscriminatorValue
{
    [CodeGenMember("Foo")]
    public static DiscriminatorValue FooValue { get; } = new DiscriminatorValue("foo");
}
