namespace Sample.Models
{
    public partial class MockInputModel
    {
        public MockInputModel(string name, int?[] values)
        {
            Name = name;
            Values = values;
        }

        public string Name { get; }
        public int?[] Values { get; set; }
    }
}
