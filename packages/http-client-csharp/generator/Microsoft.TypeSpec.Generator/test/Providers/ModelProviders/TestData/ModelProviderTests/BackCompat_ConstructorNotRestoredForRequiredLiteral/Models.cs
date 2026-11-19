namespace Sample.Models
{
    public partial class StringModel
    {
        public StringModel(string value) { }
        public string Value { get; set; }
    }

    public partial class BoolModel
    {
        public BoolModel(bool value) { }
        public bool Value { get; set; }
    }

    public partial class IntModel
    {
        public IntModel(int value) { }
        public int Value { get; set; }
    }
}
