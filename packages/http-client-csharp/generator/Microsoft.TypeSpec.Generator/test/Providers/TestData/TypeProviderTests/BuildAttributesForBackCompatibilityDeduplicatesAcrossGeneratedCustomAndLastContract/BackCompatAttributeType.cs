using System;

namespace Test
{
    public class RestorableAttribute : Attribute
    {
    }

    [Obsolete("This is obsolete")]
    [CLSCompliant(true)]
    [Restorable]
    public class BackCompatAttributeType
    {
    }
}
