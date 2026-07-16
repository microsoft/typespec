using System;

namespace Test
{
    public class RestorableAttribute : Attribute
    {
    }

    [CLSCompliant(true)]
    [Restorable]
    public class BackCompatAttributeType
    {
    }
}
