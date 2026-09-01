namespace Sample.Models
{
    public partial class MockInputModel
    {
        // In the last contract "count" was required so the initialization constructor
        // accepted it. The current spec relaxes it to optional, which drops it from the
        // constructor unless it is restored for back compat.
        public MockInputModel(string name, int count)
        {
            Name = name;
            Count = count;
        }

        public string Name { get; }

        public int Count { get; }
    }
}
