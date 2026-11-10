namespace Sample.Models
{
    public partial class MockInputModel
    {
        // The previously published constructor used the pre-rename parameter name "resources".
        public MockInputModel(string name, string resources)
        {
            Name = name;
            Resources = resources;
        }

        public string Name { get; }

        public string Resources { get; }
    }
}
