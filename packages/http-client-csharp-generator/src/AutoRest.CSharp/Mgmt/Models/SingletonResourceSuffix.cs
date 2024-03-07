// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Writers;
using Azure.Core;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Mgmt.Models
{
    internal class SingletonResourceSuffix
    {
        public static SingletonResourceSuffix Parse(string[] segments)
        {
            // put the segments in pairs
            var pairs = new List<(string Key, string Value)>();
            for (int i = 0; i < segments.Length; i += 2)
            {
                pairs.Add((segments[i], segments[i + 1]));
            }

            return new SingletonResourceSuffix(pairs);
        }

        private IReadOnlyList<(string Key, string Value)> _pairs;

        private SingletonResourceSuffix(IReadOnlyList<(string Key, string Value)> pairs)
        {
            _pairs = pairs;
        }

        public ValueExpression BuildResourceIdentifier(ValueExpression originalId)
        {
            var result = originalId;
            for (int i = 0; i < _pairs.Count; i++)
            {
                var (key, value) = _pairs[i];
                if (key == Segment.Providers)
                {
                    // when we have a providers segment, we must have a next pair
                    i++;
                    var (nextKey, nextValue) = _pairs[i];
                    // build expression: <id> => <id>.AppendProviderResource(value, nextKey, nextValue)
                    result = new InvokeStaticMethodExpression(
                        typeof(ResourceIdentifier),
                        nameof(ResourceIdentifier.AppendProviderResource),
                        new[] { result, Literal(value), Literal(nextKey), Literal(nextValue) },
                        CallAsExtension: true);
                }
                else
                {
                    // if not, we just call the method to append this pair
                    result = new InvokeStaticMethodExpression(
                        typeof(ResourceIdentifier),
                        nameof(ResourceIdentifier.AppendChildResource),
                        new[] { result, Literal(key), Literal(value) },
                        CallAsExtension: true);
                }
            }

            return result;
        }

        public override string ToString()
        {
            return string.Join("/", this._pairs.Select(kv => $"{(kv.Key == Segment.Providers ? "" : $"{kv.Key}/")}{kv.Value}"));
        }
    }
}
