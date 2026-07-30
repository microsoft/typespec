# Surface checks

Generated from `@surfaceDoc` annotations. This table is both the human summary
and the machine-readable checks doc parsed by the shared `verify-surface-checks` runner.

| id                                                            | scenario                                            | category  | target                           | scope | details              | doc                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------- | --------- | -------------------------------- | ----- | -------------------- | ----------------------------------------------------------------------------------- |
| Payload_Pageable_PageSize_listWithoutContinuation_paging      | Payload_Pageable_PageSize_listWithoutContinuation   | paging    | listWithoutContinuation          |       | expected=Pet         | Single-page pageable operation yielding `Pet` elements, no continuation.            |
| Payload_Pageable_PageSize_listWithPageSize_paging             | Payload_Pageable_PageSize_listWithPageSize          | paging    | listWithPageSize                 |       | expected=Pet         | Page-size-driven pageable operation yielding `Pet` elements.                        |
| Payload_Pageable_ServerDrivenPagination_link_paging           | Payload_Pageable_ServerDrivenPagination_link        | paging    | link                             |       | expected=Pet         | The paginated operation yields `Pet` elements.                                      |
| Serialization_EncodedName_Json_Property_send_naming           | Serialization_EncodedName_Json_Property_send        | naming    | JsonEncodedNameModel.defaultName |       | expected=defaultName | The client property is named `defaultName` even though the wire name is `wireName`. |
| Type_Model_Inheritance_NotDiscriminated_getValid_hierarchy    | Type_Model_Inheritance_NotDiscriminated_getValid    | hierarchy | Siamese                          |       | expected=Cat         | The `Siamese` model extends `Cat` as its base type on the client surface.           |
| Type_Model_Inheritance_SingleDiscriminator_getModel_hierarchy | Type_Model_Inheritance_SingleDiscriminator_getModel | hierarchy | Sparrow                          |       | expected=Bird        | The `Sparrow` model extends `Bird` as its base type on the client surface.          |
