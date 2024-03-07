// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace AutoRest.CSharp.Common.Input;

internal record InputNamespace(string Name, string Description, IReadOnlyList<string> ApiVersions, IReadOnlyList<InputEnumType> Enums, IReadOnlyList<InputModelType> Models, IReadOnlyList<InputClient> Clients, InputAuth Auth)
{
    public InputNamespace() : this(Name: string.Empty, Description: string.Empty, ApiVersions: Array.Empty<string>(), Enums: Array.Empty<InputEnumType>(), Models: Array.Empty<InputModelType>(), Clients: Array.Empty<InputClient>(), Auth: new InputAuth()) { }
}
