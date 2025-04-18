// <auto-generated/>

#nullable disable

using System;

namespace Sample.Models
{
    internal static partial class MockInputModelExtensions
    {
        public static global::Sample.Models.MockInputModel ToMockInputModel(this int value)
        {
            if ((value == 1))
            {
                return global::Sample.Models.MockInputModel.Red;
            }
            if ((value == 2))
            {
                return global::Sample.Models.MockInputModel.Green;
            }
            if ((value == 3))
            {
                return global::Sample.Models.MockInputModel.SkyBlue;
            }
            throw new global::System.ArgumentOutOfRangeException(nameof(value), value, "Unknown MockInputModel value.");
        }
    }
}
