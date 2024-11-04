using Microsoft.Generator.CSharp.Customization;

namespace Sample.Models;

public readonly partial struct DiscriminatorValue
{
    [CodeGenMember("Foo")]
    public static DiscriminatorValue FooValue { get; } = new DiscriminatorValue("foo");
}
