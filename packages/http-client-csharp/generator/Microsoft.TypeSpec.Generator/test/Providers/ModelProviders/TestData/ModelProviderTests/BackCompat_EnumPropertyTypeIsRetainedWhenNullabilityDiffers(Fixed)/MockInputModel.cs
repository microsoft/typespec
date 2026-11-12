namespace Sample.Models
{
    public partial class MockInputModel
    {
        public StatusEnum? Status { get; set; }
    }

    public enum StatusEnum
    {
        Active,
        Inactive
    }
}
