// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;

namespace External
{
    [Experimental("EXTERNAL001")]
    public sealed class ParameterValue
    {
        public ParameterValue(IConfigurationSection section)
        {
        }
    }
}
