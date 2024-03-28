// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputIntrinsicType(InputIntrinsicTypeKind Kind) : InputType(Kind.ToString(), false)
{
    public static InputIntrinsicType ErrorType { get; } = new(InputIntrinsicTypeKind.ErrorType);
    public static InputIntrinsicType Void { get; } = new(InputIntrinsicTypeKind.Void);
    public static InputIntrinsicType Never { get; } = new(InputIntrinsicTypeKind.Never);
    public static InputIntrinsicType Unknown { get; } = new(InputIntrinsicTypeKind.Unknown);
    public static InputIntrinsicType Null { get; } = new(InputIntrinsicTypeKind.Null);
};
