using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Microsoft.TypeSpec.VisualStudio
{
    internal static class VariableResolver
    {
        private const string VARIABLE_REGEXP = @"\$\{(.*?)\}";

        public static string ResolveVariables(string value, IDictionary<string, string> variables)
        {
            return Regex.Replace(value, VARIABLE_REGEXP, (match) =>
            {
                var group = match.Groups[1];
                if (group != null && variables.TryGetValue(group.Value, out var variable))
                {
                    return variable;
                }
                return match.Value;
            });
        }
    }
}

