// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

using System;
using System.Collections.Generic;
using System.Text;

namespace AutoRest.CSharp.Mgmt.Decorator
{
    public static class EnumerableExtensions
    {
        public static IEnumerable<T> AsIEnumerable<T>(this T item)
        {
            yield return item;
        }
    }
}
