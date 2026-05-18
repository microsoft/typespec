---
changeKind: feature
packages:
  - "@typespec/http-client-py"
---

Add early long-running operation (LRO) support and an optional pyodide
post-processor to `@typespec/http-client-py`.

Because the unbranded TypeSpec stack (`@typespec/compiler`, `@typespec/http`,
`@typespec/http-client`) does not yet model LROs, detection is heuristic-based
for now: an operation is treated as an LRO when it returns HTTP 202 with one
of the `Operation-Location`, `Location`, or `Azure-AsyncOperation` headers.
The rendered output mirrors `pygen.codegen.models.lro_operation`: a public
`begin_X` method returning `LROPoller[T]` and a private `_X_initial`
companion. The renderer is decoupled from detection so the heuristic can be
swapped for a first-class contract when one lands upstream.

```python
from corehttp.polling import LROBasePolling, LROPoller

class WidgetServiceClient:
    def _create_widget_initial(self, widget: Widget) -> object: ...
    def begin_create_widget(self, widget: Widget) -> LROPoller[Widget]:
        raw_result = self._create_widget_initial(widget)
        return LROPoller(
            client=self,
            initial_response=raw_result,
            deserialization_callback=lambda pipeline_response: pipeline_response,
            polling_method=LROBasePolling(),
        )
```

A new opt-in `post-process: "pyodide" | "none"` emitter option (default
`"none"`) runs `black` over the emitted output and injects pylint headers for
shippable Python, matching `@typespec/http-client-python`'s behavior.
