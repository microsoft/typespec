---
id: release-notes
title: Release notes
---

# Release notes and breaking changes

{% set navItems = collections.all | cadlNavigation(docs.toc, "release-notes") %}
{%- for item in navItems %}

- [{{ item.label }}]({{ item.url }})
  {%- endfor %}
