namespace Sample.Models
{
    /// <summary>
    /// A model in a different namespace that is not referenced from any root type and is internalized,
    /// so its model factory method (and the using directive for this namespace) is removed.
    /// </summary>
    public class OtherNamespaceModel
    {
    }
}
