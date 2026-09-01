using System.Threading.Tasks;

namespace Test
{
    public class AsyncTaskOverloadType
    {
        public async Task DoWorkAsync(int param1)
        {
            await Task.CompletedTask;
        }
    }
}
