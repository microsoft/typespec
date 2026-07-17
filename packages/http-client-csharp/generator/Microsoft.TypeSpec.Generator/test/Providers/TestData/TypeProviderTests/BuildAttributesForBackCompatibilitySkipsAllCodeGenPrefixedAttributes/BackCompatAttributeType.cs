using System;

namespace Test
{
    public class CodeGenModelAttribute : Attribute
    {
        public CodeGenModelAttribute(string name)
        {
        }
    }

    public class RestorableAttribute : Attribute
    {
    }

    [CodeGenModel("Something")]
    [Restorable]
    public class BackCompatAttributeType
    {
    }
}
