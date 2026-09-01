namespace Test
{
    public class OutOverloadType
    {
        public bool TryParse(string value, out int result)
        {
            result = 0;
            return false;
        }
    }
}
