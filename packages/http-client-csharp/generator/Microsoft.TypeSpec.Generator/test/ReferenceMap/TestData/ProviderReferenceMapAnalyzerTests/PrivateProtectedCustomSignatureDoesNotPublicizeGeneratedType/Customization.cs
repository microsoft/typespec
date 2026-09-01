namespace Sample
{
    internal readonly struct AdvancedFilterOperatorType
    {
    }

    public readonly struct PublicFilterOperatorType
    {
    }

    public partial class AdvancedFilter
    {
        private protected AdvancedFilter(AdvancedFilterOperatorType operatorType)
        {
        }

        protected AdvancedFilter(PublicFilterOperatorType operatorType)
        {
        }
    }
}
