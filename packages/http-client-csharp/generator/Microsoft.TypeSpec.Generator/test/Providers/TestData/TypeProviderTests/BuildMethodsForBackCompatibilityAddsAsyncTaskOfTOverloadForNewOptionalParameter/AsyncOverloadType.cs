using System.Threading.Tasks;

namespace Test
{
    public class AsyncOverloadType
    {
        public async Task<string> GetDataAsync(int param1)
        {
            return await Task.FromResult<string>(null);
        }
    }
}
