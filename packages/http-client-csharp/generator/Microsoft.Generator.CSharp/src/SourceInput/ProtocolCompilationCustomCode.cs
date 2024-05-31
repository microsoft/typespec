// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;

namespace Microsoft.Generator.CSharp.SourceInput
{
    internal class ProtocolCompilationCustomCode : CompilationCustomCode
    {
        private List<IMethodSymbol>? _methodSet;
        private List<IMethodSymbol> MethodSet => _methodSet ??= EnsureMethodSet();

        public ProtocolCompilationCustomCode(Compilation compilation)
            : base(compilation) { }

        private protected List<IMethodSymbol> EnsureMethodSet()
        {
            var result = new List<IMethodSymbol>();
            foreach (IModuleSymbol module in _compilation.Assembly.Modules)
            {
                foreach (var type in SourceInputHelper.GetSymbols(module.GlobalNamespace))
                {
                    if (type is INamedTypeSymbol typeSymbol && IsClient(typeSymbol))
                    {
                        foreach (var member in typeSymbol.GetMembers())
                        {
                            if (member is IMethodSymbol methodSymbol && IsProtocolMethod(methodSymbol))
                            {
                                result.Add(methodSymbol);
                            }
                        }
                    }
                }
            }
            return result;
        }

        internal override IMethodSymbol? FindMethod(string namespaceName, string typeName, string methodName, IEnumerable<CSharpType> parameters)
        {
            var methods = MethodSet.Where(m =>
                m.ContainingNamespace.ToString() == namespaceName &&
                m.ContainingType.Name == typeName &&
                m.Name == methodName).ToArray();
            if (methods.Length == 0)
            {
                return null;
            }
            else if (methods.Length == 1)
            {
                return methods.First();
            }
            else
            {
                foreach (var method in methods)
                {
                    var existingParameters = method.Parameters;
                    var parametersCount = parameters.Count();
                    if (existingParameters.Length - 1 != parametersCount)
                    {
                        continue;
                    }

                    int index = 0;
                    foreach (var parameter in parameters)
                    {
                        if ((existingParameters[index].Type as INamedTypeSymbol)!.IsSameType(parameter))
                        {
                            break;
                        }
                        ++index;
                    }

                    if (index == parametersCount)
                    {
                        return method;
                    }
                }
                return null;
            }
        }

        private bool IsClient(INamedTypeSymbol type) => type.Name.EndsWith("Client");
        private bool IsProtocolMethod(IMethodSymbol method) => method.Parameters.Length > 0 && (method.Parameters.Last().Type as INamedTypeSymbol)!.IsSameType(KnownParameters.RequestContext.Type);
    }
}
