namespace Sample.Models
{
    public class ParameterDefaults
    {
        public void Method(
            float defaultLiteral = default,
            float defaultExpression = default(float),
            float explicitZero = 0F,
            string discriminator = "Unknown")
        { }
    }
}
