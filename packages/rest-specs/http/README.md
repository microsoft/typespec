# HTTP Test Cadl scenarios

Structure:

- one folder per scenario with entry point called `main.tsp`

## Tests

### Clients

- [interfaces](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/clients/interfaces) - Generate two service clients from operations defined in two different interfaces.

### Models

The tests in the http/models directory describe scenarios for generating models with different model features.

- [input-basic](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/input-basic) - Generate and send an input-only model with required reference and value type properties.
- [output-basic](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/output-basic) - Generate and receive an output-only model with required reference and value type properties.
- [roundtrip-basic](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/roundtrip-basic) - Generate, send, and receive a round-trip model with required reference and value type properties.
- [primitive-properties](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/primitive-properties) - Generate/send a round-trip model with basic Cadl primitive type properties.
- [collections-basic](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/collections-basic) - Generate, send, and receive input, output, and round-trip models with required collection properties.
- [collections-models](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/collections-models) - Generate, send, and receive input, output, and round-trip models that have properties with collections of models.
- [optional-properties](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/optional-properties) - Generate, send, and receive input, output, and round-trip models with optional properties.
- [enum-properties](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/enum-properties) - Generate, send, and receive input, output, and round-trip models with required enum properties.
- [nested-models](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/nested-models) - Generate, send, and receive input, output, and round-trip models with required nested model properties.
- [visibility](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/visibility) - Generate, send, and receive models with visibility properties.
- [inheritance](https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs/http/models/inheritance) - Generate, send, and receive round-trip models polymorphic models.
