namespace Sample.Models
{
    // Note: this last-contract model has a different name than the spec model
    // ("MockInputModel"), so the back-compat lookup misses and the spec types are preserved.
    public partial class UnrelatedModel
    {
        public int? Count { get; set; }
    }
}
