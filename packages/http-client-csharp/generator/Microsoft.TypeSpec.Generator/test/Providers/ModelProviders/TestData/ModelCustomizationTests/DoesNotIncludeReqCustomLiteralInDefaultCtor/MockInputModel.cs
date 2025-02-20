using UnbrandedTypeSpec;

namespace Sample.Models;

public partial class MockInputModel
{
    [CodeGenMember("Prop1")]
    public CustomEnum Prop1 { get; } = CustomEnum.Bar;
}

public enum CustomEnum
{
    Bar
}
