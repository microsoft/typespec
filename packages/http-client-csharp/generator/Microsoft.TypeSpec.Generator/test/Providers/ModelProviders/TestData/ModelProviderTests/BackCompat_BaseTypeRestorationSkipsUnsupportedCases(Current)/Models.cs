namespace Sample.Models
{
    public class CustomBase
    {
    }

    public partial class CustomizedDerived : CustomBase
    {
    }

    public partial class CustomizedCurrentBase
    {
        public string CustomMember { get; set; }
    }
}
