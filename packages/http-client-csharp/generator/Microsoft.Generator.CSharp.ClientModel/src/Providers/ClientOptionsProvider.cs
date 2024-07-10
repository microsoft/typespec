// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using System.IO;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Primitives;
using System.ClientModel.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ClientOptionsProvider : TypeProvider
    {
        // TO-DO: Implement the ClientOptions class : https://github.com/microsoft/typespec/issues/3688
        private readonly InputClient _inputClient;

        public ClientOptionsProvider(InputClient inputClient)
        {
            _inputClient = inputClient;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}Options.cs");
        protected override string BuildName() => $"{_inputClient.Name}Options".ToCleanName();

        protected override CSharpType[] BuildImplements()
        {
            return [typeof(ClientPipelineOptions)];
        }
    }
}
