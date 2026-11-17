namespace Sample.Models
{
    public partial class NullableCounter
    {
        public NullableCounter(int? count)
        {
            Count = count;
        }

        public int? Count { get; set; }
    }

    public partial class NonNullableCounter
    {
        public NonNullableCounter(int? count)
        {
            Count = count.GetValueOrDefault();
        }

        public int Count { get; set; }
    }

    public partial class DerivedNullableCounter : NullableCounter
    {
        public DerivedNullableCounter(int? count) : base(count)
        {
        }
    }

    public partial class DerivedNonNullableCounter : NonNullableCounter
    {
        public DerivedNonNullableCounter(int? count) : base(count)
        {
        }
    }
}
