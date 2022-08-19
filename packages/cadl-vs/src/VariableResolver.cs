using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.Workspace;
using Microsoft.VisualStudio.Workspace.Settings;
using Microsoft.VisualStudio.Workspace.VSIntegration.Contracts;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Shell;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;
using Task = System.Threading.Tasks.Task;
using System.Linq;
using System.ComponentModel;
using System.Text.RegularExpressions;

namespace Microsoft.Cadl.VisualStudio
{
    public class VariableResolver
    {
        public const string VARIABLE_REGEXP = @"\$\{(.*?)\}";
        private IDictionary<string, string> variables;

        public VariableResolver(IDictionary<string, string> variables)
        {
            this.variables = variables;
        }
        public string ResolveVariables(string value)
        {
            return Regex.Replace(value, VARIABLE_REGEXP, (match) =>
            {
                var group = match.Groups[1];
                if(group == null)
                {
                    return match.Value;
                }
                try
                {
                    return variables[group.Value];
                }
                catch (KeyNotFoundException)
                {
                    return match.Value;
                }
            });
        }
    }
}

