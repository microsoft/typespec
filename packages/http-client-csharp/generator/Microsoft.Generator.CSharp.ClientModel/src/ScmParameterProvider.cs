// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ScmParameterProvider : ParameterProvider
    {
        public ScmParameterProvider(InputModelProperty property) : base(property)
        {
            Validation = ParameterValidationType.None;
        }
    }
}
