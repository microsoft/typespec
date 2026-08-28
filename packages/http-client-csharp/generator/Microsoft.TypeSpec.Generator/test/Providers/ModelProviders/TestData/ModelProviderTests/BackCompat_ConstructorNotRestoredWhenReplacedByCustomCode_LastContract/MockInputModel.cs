namespace Sample.Models
{
    public partial class MockInputModel
    {
        // The previously published constructor accepted the required "resources" parameter.
        public MockInputModel(string name, string resources)
        {
            Name = name;
            Resources = resources;
        }

        public string Name { get; }

        public string Resources { get; }
    }
}
