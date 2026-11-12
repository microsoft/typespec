namespace Sample.Models
{
    public partial class MockInputModel
    {
        // Note: deliberately a different property name than the spec ("Count")
        // so the back-compat lookup misses and the spec type is preserved.
        public string? Other { get; set; }
    }
}
