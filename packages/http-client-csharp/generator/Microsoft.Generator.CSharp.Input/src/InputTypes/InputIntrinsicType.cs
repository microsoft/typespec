// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    public class InputIntrinsicType : InputType
    {
        public InputIntrinsicType(InputIntrinsicTypeKind kind) : base(kind.ToString(), false)
        {
            Kind = kind;
        }

        public InputIntrinsicTypeKind Kind { get; }

        public static InputIntrinsicType ErrorType { get; } = new(InputIntrinsicTypeKind.ErrorType);
        public static InputIntrinsicType Void { get; } = new(InputIntrinsicTypeKind.Void);
        public static InputIntrinsicType Never { get; } = new(InputIntrinsicTypeKind.Never);
        public static InputIntrinsicType Unknown { get; } = new(InputIntrinsicTypeKind.Unknown);
        public static InputIntrinsicType Null { get; } = new(InputIntrinsicTypeKind.Null);
    }
}
