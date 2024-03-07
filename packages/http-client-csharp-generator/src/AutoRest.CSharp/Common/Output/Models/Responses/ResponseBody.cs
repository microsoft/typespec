// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.


using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Responses
{
    internal abstract class ResponseBody
    {
        public abstract CSharpType Type { get; }

        protected bool Equals(ResponseBody other)
        {
            return Type.Equals(other.Type);
        }

        public override bool Equals(object? obj)
        {
            if (ReferenceEquals(null, obj)) return false;
            if (ReferenceEquals(this, obj)) return true;
            if (obj.GetType() != this.GetType()) return false;
            return Equals((ResponseBody) obj);
        }

        public override int GetHashCode()
        {
            return Type.GetHashCode();
        }
    }
}
