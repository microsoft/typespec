using System;
using System.Reflection;

namespace Test
{
    public class RestorableAttribute : Attribute
    {
    }

    [DefaultMember("Something")]
    [Restorable]
    public class BackCompatAttributeType
    {
    }
}
