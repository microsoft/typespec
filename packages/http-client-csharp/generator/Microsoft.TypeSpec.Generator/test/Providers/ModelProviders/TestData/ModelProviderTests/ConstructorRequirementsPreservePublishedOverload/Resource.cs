namespace Sample.Models
{
    public partial class Resource
    {
        public Resource(string title, string state)
        {
            Title = title;
            State = state;
        }

        public string Title { get; }

        public string State { get; }
    }
}
