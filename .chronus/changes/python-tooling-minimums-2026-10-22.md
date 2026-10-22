---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Upgrade pip and uv in generator virtual environments to compatible releases satisfying pip >=26.2.2 and uv >=0.13.4. Require certifi >=2026.10.19 for test clients using the requests transport.
