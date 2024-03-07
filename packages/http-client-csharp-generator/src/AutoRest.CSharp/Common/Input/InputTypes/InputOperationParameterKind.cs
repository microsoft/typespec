// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal enum InputOperationParameterKind
{
    Method = 0,
    Client = 1,
    Constant = 2,
    Flattened = 3,
    Spread = 4,
    Grouped = 5,
}
