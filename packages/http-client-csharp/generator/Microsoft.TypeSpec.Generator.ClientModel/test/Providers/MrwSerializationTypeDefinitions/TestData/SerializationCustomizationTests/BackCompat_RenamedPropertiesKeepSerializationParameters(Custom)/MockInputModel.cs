// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public partial class MockInputModel
    {
        public bool Enabled
        {
            get => IsEnabled;
            set => IsEnabled = value;
        }

        public DestinationKind Type
        {
            get => DestinationType;
            set => DestinationType = value;
        }
    }
}
