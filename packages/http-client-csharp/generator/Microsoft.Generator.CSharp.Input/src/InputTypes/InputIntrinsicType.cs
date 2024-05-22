// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Input
{
    // TODO -- after we have adopted getAllModels in our emitter, we no longer need to have this type. https://github.com/microsoft/typespec/issues/3338
    // The only thing we need in these "intrinsic types" is the "unknown", and TCGC put it in the primitive type. Others we will never generate therefore we do not need to have others
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
