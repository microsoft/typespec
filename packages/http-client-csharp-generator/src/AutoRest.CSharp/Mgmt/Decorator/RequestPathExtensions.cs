// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Text;
using AutoRest.CSharp.Mgmt.Models;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    internal static class RequestPathExtensions
    {
        private static bool TryMinus(RequestPath requestPath, RequestPath other, [MaybeNullWhen(false)] out string diff)
        {
            diff = null;
            if (requestPath == other)
            {
                diff = RequestPath.Tenant;
                return true;
            }

            if (requestPath.IsAncestorOf(other))
            {
                diff = $"-{requestPath.TrimAncestorFrom(other)}";
                return true;
            }

            if (other.IsAncestorOf(requestPath))
            {
                diff = other.TrimAncestorFrom(requestPath);
                return true;
            }

            return false;
        }

        public static string Minus(this RequestPath requestPath, RequestPath other)
        {
            if (TryMinus(requestPath, other, out var diff))
                return diff;

            // if they do not have parent relationship, this could be because of the different scopes
            // therefore we trim the scope out of them and then minus
            var requestTrimmed = requestPath.TrimScope();
            var otherTrimmed = other.TrimScope();

            return TryMinus(requestTrimmed, otherTrimmed, out diff) ? diff : requestTrimmed;
        }
    }
}
