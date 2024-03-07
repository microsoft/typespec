// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Azure.Core.Tests
{
    public class MockRequest : Request
    {
        public MockRequest()
        {
            ClientRequestId = Guid.NewGuid().ToString();
        }

        private readonly Dictionary<string, object> _headers = new();
        public bool IsDisposed { get; private set; }

        public override RequestContent Content
        {
            get { return base.Content; }
            set
            {
                base.Content = value;
            }
        }

        protected override void SetHeader(string name, string value) => _headers.Add(name, value);

        protected override void AddHeader(string name, string value) => _headers.Add(name, value);

        protected override bool TryGetHeader(string name, out string value)
        {
            var found = _headers.TryGetValue(name, out object obj);
            value = found ? (string)obj : null;
            return found;
        }

        protected override bool TryGetHeaderValues(string name, out IEnumerable<string> values)
        {
            var found = _headers.TryGetValue(name, out object obj);
            values = found ? (IEnumerable<string>)obj : null;
            return found;
        }

        protected override bool ContainsHeader(string name) => _headers.TryGetValue(name, out _);

        protected override bool RemoveHeader(string name) => _headers.Remove(name);

        protected override IEnumerable<HttpHeader> EnumerateHeaders()
        {
            foreach (var header in _headers)
            {
                yield return new HttpHeader(header.Key, header.Value.ToString());
            }
        }

        public override string ClientRequestId { get; set; }

        public override string ToString() => $"{Method} {Uri}";

        public override void Dispose()
        {
            IsDisposed = true;
        }
    }
}
