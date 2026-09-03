namespace Sample.Models
{
    public partial class MockInputModel
    {
        // In the last contract "resources" existed and was part of the constructor, but
        // the current spec removes the property entirely. Because there is no matching
        // property to assign, the previous constructor cannot be safely restored.
        public MockInputModel(string name, string resources)
        {
            Name = name;
            Resources = resources;
        }

        public string Name { get; }

        public string Resources { get; }
    }
}
