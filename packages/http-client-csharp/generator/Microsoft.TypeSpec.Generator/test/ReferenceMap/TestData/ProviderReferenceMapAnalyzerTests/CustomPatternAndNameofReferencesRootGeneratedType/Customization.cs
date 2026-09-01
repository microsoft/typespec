using Sample.Models;

namespace Sample
{
    public partial class CustomType
    {
        public bool Matches(object value)
        {
            var converted = value as CastModel;
            return value is PatternModel && converted != null && nameof(NameofModel) != null;
        }
    }
}
