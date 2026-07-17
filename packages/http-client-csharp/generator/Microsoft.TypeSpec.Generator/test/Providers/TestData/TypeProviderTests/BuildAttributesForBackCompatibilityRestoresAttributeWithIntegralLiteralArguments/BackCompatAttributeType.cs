using System;

namespace Test
{
    public class NumericAttribute : Attribute
    {
        public NumericAttribute(byte byteValue, sbyte sbyteValue, short shortValue, ushort ushortValue, uint uintValue, ulong ulongValue)
        {
        }
    }

    [Numeric(1, 2, 3, 4, 5, 6)]
    public class BackCompatAttributeType
    {
    }
}
