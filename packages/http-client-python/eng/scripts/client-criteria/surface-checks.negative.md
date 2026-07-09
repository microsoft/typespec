# Surface checks (negative twin)

<!-- Hand-edited to expect WRONG surface: verify.py must report both as fail. -->

| id                                      | scenario    | category  | target               | details                            | doc                                                                     |
| --------------------------------------- | ----------- | --------- | -------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| SurfaceDemo_Dog_hierarchy               | SurfaceDemo | hierarchy | Dog                  | base=Animal                        | Dog is (incorrectly) expected to be a direct subtype of Animal.         |
| SurfaceDemo_ServerExtensibleEnum_naming | SurfaceDemo | naming    | ServerExtensibleEnum | name=RenamedEnum; kind=enum        | Enum is (incorrectly) expected to surface as `RenamedEnum`.             |
