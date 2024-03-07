// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Input;

#pragma warning disable SA1649
namespace AutoRest.CSharp.Common.Input
{
    internal record CodeModelType(Schema Schema, bool IsNullable) : InputType(Schema.Name, IsNullable);
}
