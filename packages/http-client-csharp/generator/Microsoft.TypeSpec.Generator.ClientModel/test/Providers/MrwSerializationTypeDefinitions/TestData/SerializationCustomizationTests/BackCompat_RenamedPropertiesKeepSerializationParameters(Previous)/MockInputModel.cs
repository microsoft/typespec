// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public MockInputModel(bool enabled, DestinationKind type)
        {
            IsEnabled = enabled;
            DestinationType = type;
        }

        internal MockInputModel(bool enabled, DestinationKind type, DestinationKind? enforcement, IDictionary<string, BinaryData> additionalBinaryDataProperties)
        {
            IsEnabled = enabled;
            DestinationType = type;
            Enforcement = enforcement;
        }

        public bool IsEnabled { get; set; }
        public bool Enabled
        {
            get => IsEnabled;
            set => IsEnabled = value;
        }

        public DestinationKind DestinationType { get; set; }
        public DestinationKind? Enforcement { get; set; }
        public DestinationKind Type
        {
            get => DestinationType;
            set => DestinationType = value;
        }
    }

    public enum DestinationKind
    {
        VirtualNetwork
    }
}
