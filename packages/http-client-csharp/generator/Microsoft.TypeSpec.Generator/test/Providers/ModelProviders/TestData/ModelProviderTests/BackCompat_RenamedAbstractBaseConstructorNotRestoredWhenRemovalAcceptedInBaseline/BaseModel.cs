namespace Sample.Models
{
    public abstract partial class BaseModel
    {
        // Previously published a public constructor whose parameter was later renamed to "kind"; its removal
        // is accepted in the ApiCompat baseline, so it must not be resurrected.
        public BaseModel(string createdOn)
        {
        }
    }
}
