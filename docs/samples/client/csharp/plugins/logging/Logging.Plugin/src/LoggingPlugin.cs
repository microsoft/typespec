using Microsoft.TypeSpec.Generator;

namespace Logging.Plugin
{
    public class LoggingPlugin : GeneratorPlugin
    {
        public override void Apply(CodeModelGenerator generator)
        {
            generator.AddVisitor(new LoggingVisitor());
        }
    }
}
