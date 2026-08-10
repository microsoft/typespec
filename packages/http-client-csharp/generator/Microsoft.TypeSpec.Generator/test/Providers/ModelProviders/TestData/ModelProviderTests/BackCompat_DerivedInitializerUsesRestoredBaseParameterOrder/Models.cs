namespace Sample.Models
{
    public partial class BaseModel
    {
        public BaseModel(int minimumCount, int maximumCount)
        {
        }
    }

    public partial class DerivedModel : BaseModel
    {
        public DerivedModel(int minimumCount, int maximumCount, string label)
            : base(minimumCount, maximumCount)
        {
        }
    }
}
