namespace Sample.Models
{
    public partial class MockInputModel
    {
        // In the last contract "resources" was required so the initialization constructor
        // accepted it. The current spec relaxes it to optional, which would normally cause the
        // previous constructor to be restored - but here its removal is accepted in the baseline.
        public MockInputModel(string name, string resources)
        {
            Name = name;
            Resources = resources;
        }

        public string Name { get; }

        public string Resources { get; }
    }
}
