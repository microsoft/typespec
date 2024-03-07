// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Types;
using Azure.Core.TestFramework;

namespace AutoRest.CSharp.LowLevel.Output.Tests
{
    internal class DpgTestEnvironmentProvider : ExpressionTypeProvider
    {
        public DpgTestEnvironmentProvider(string defaultNamespace, SourceInputModel? sourceInputModel) : base(defaultNamespace, sourceInputModel)
        {
            DefaultNamespace = $"{defaultNamespace}.Tests";
            DefaultName = $"{ClientBuilder.GetRPName(defaultNamespace)}TestEnvironment";
            Inherits = typeof(TestEnvironment);
            DeclarationModifiers = TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial;
        }

        protected override string DefaultNamespace { get; }

        protected override string DefaultName { get; }
    }
}
