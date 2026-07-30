namespace Sample.Models
{
    public partial class MockInputModel
    {
        // In the last contract, both properties were required so the initialization
        // constructor accepted both of them.
        public MockInputModel(string name, string resources)
        {
            Name = name;
            Resources = resources;
        }

        public string Name { get; set; }

        public string Resources { get; set; }
    }
}
