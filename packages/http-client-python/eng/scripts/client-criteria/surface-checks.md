# Surface checks

<!-- version: 0.34.0 · commit: f1877e2811cbb2630ede00d8da540453cdfe361a -->

Generated from `@surfaceDoc` annotations. This table is both the human summary
and the machine-readable checks doc parsed by `verify.py`.

| id                                      | scenario    | category  | target               | details                              | doc                                                                  |
| --------------------------------------- | ----------- | --------- | -------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| SurfaceDemo_Dog_hierarchy               | SurfaceDemo | hierarchy | Dog                  | base=Pet                             | Dog is surfaced as a subtype of Pet, not a direct subtype of Animal. |
| SurfaceDemo_ServerExtensibleEnum_naming | SurfaceDemo | naming    | ServerExtensibleEnum | name=ClientExtensibleEnum; kind=enum | Enum is surfaced to clients as `ClientExtensibleEnum`.               |
