// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Output.Models.Serialization;

namespace AutoRest.CSharp.Output.Models.Requests
{
    internal class PathSegment
    {
        public PathSegment(ReferenceOrConstant value, bool escape, SerializationFormat format, bool isRaw = false)
        {
            Value = value;
            Escape = escape;
            Format = format;
            IsRaw = isRaw;
        }

        public ReferenceOrConstant Value { get; }
        public bool Escape { get; }
        public SerializationFormat Format { get; }
        public bool IsRaw { get; }
    }
}
