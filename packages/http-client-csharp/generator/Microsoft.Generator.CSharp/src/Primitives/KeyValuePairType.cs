// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Primitives
{
    public class KeyValuePairType : CSharpType
    {
        public CSharpType KeyType { get; }
        public CSharpType ValueType { get; }

        public KeyValuePairType(CSharpType keyType, CSharpType valueType)
            : base(typeof(KeyValuePair<,>), keyType, valueType)
        {
            KeyType = keyType;
            ValueType = valueType;
        }
    }
}
