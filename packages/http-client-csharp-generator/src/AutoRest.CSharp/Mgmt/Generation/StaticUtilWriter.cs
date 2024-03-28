// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Mgmt.AutoRest;

namespace AutoRest.CSharp.Mgmt.Generation
{
    internal class StaticUtilWriter
    {
        private CodeWriter _writer;

        public StaticUtilWriter(CodeWriter writer)
        {
            _writer = writer;
        }

        public void Write()
        {
            using (_writer.Namespace(MgmtContext.Context.DefaultNamespace))
            {
                using (_writer.Scope($"internal static class ProviderConstants"))
                {
                    WriteProviderDefaultNamespace();
                }
            }
        }

        protected void WriteProviderDefaultNamespace()
        {
            _writer.Line($"public static string DefaultProviderNamespace {{ get; }} = {Configuration.ApiTypes.ClientDiagnosticsType}.GetResourceProviderNamespace(typeof(ProviderConstants).Assembly);");
        }
    }
}
