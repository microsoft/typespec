using Sample.Models;

namespace Sample
{
    public partial class CustomClient
    {
        public void Test(object response)
        {
            ReferencedModel result = (ReferencedModel)response;
        }
    }
}
