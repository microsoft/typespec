// <auto-generated/>

#nullable disable

using System;

namespace sample.namespace.Models
{
    internal static partial class MockInputEnumExtensions
    {
        public static global::sample.namespace.Models.MockInputEnum ToMockInputEnum(this int value)
        {
            if ((value == "1"))
            {
                return global::sample.namespace.Models.MockInputEnum.One;
            }
            if ((value == "2"))
            {
                return global::sample.namespace.Models.MockInputEnum.Two;
            }
            throw new global::System.ArgumentOutOfRangeException(nameof(value), value, "Unknown MockInputEnum value.");
        }
    }
}
