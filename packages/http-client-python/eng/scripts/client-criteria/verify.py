#!/usr/bin/env python3
"""Deterministic client-surface checks - the tool the orchestrator calls.

Two modes, both AI-free:

  --batch:  read a checks manifest (JSON), run EVERY deterministic check in
            parallel (thread pool), and print {"results": [...], "needs_ai": [...]}.
            The orchestrator calls this once, then AI-verifies the needs_ai list.

  single:   run one check and print {"status","evidence"} (handy for debugging).

Batch usage:
  verify.py --batch --checks demo-checks.json --verifiers verifiers.json \
            --generated-root tests/generated --flavor azure --language python [--workers 16]

Single usage:
  verify.py --category naming --package <pkg> --expected clientName --verifiers verifiers.json
"""
from __future__ import annotations
import argparse, concurrent.futures, json, re
from pathlib import Path


def norm(s: str) -> str:
    return re.sub(r"[_\-]", "", s).lower()


def _words(name: str) -> list[str]:
    """Split an identifier (camel/Pascal/snake/kebab) into its component words."""
    s = re.sub(r"[_\-\s]+", " ", name)
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", s)
    s = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", s)
    return [w for w in s.split() if w]


def apply_casing(name: str, casing: str) -> str:
    """Recast a language-agnostic name into a language's idiomatic form."""
    words = _words(name)
    if casing == "pascal":
        return "".join(w[:1].upper() + w[1:].lower() for w in words)
    if casing == "camel":
        parts = [w.lower() for w in words]
        return parts[0] + "".join(w[:1].upper() + w[1:].lower() for w in parts[1:]) if parts else name
    if casing == "snake":
        return "_".join(w.lower() for w in words)
    if casing == "upper_snake":
        return "_".join(w.upper() for w in words)
    return name


def blob(pkg: Path) -> str:
    return "\n".join(p.read_text(errors="replace") for p in pkg.rglob("*.py"))


def find_package(root: Path, flavor: str, scenario: str) -> Path | None:
    base = root / flavor
    if not base.is_dir():
        return None
    for d in sorted(base.iterdir()):
        if d.is_dir() and scenario.lower() in d.name.lower():
            return d
    return None


# --- deterministic routines (no AI) ----------------------------------------
def export_visibility(pkg: Path, target: str, internal: bool, public_init: str):
    inits = list(pkg.rglob(public_init))
    if not inits:
        return "error", f"no {public_init} found"
    text = "\n".join(p.read_text(errors="replace") for p in inits)
    present = re.search(rf"\b{re.escape(target)}\b", text) is not None
    ok = present == (not internal)
    return ("pass" if ok else "fail",
            f"{target} {'in' if present else 'absent from'} {inits[0].name} "
            f"(wanted {'internal' if internal else 'public'})")


def identifier_exact(pkg: Path, expected: str):
    ok = re.search(rf"\b{re.escape(expected)}\b", blob(pkg)) is not None
    return ("pass" if ok else "fail", f"identifier '{expected}' {'found' if ok else 'not found'}")


def identifier_casing_insensitive(pkg: Path, expected: str):
    ok = norm(expected) in norm(blob(pkg))
    return ("pass" if ok else "fail",
            f"'{expected}' {'matched (modulo casing)' if ok else 'not matched'}")


def identifier_idiomatic_casing(pkg: Path, expected: str, kind: str | None, casing_map: dict):
    """Assert the generated identifier equals the client name recast to this
    language's idiomatic casing for the symbol kind (e.g. Python enum → PascalCase,
    enum value → UPPER_SNAKE, property/method → snake_case). Case-sensitive: a
    wrongly-cased identifier fails."""
    casing = casing_map.get(kind) if kind else None
    if casing is None:
        return "na", f"no casing rule for kind '{kind}' in verifiers.json"
    wanted = apply_casing(expected, casing)
    ok = re.search(rf"\b{re.escape(wanted)}\b", blob(pkg)) is not None
    return ("pass" if ok else "fail",
            f"expected {kind} '{wanted}' ({casing}) {'found' if ok else 'not found'} "
            f"(from client name '{expected}')")


def _classes_with_methods(pkg: Path) -> dict[str, set[str]]:
    """Map each generated operation-group class to its public method names."""
    out: dict[str, set[str]] = {}
    for p in pkg.rglob("operations/_operations.py"):
        current = None
        for line in p.read_text(errors="replace").splitlines():
            cm = re.match(r"class (\w+)", line)
            if cm:
                current = cm.group(1)
                out.setdefault(current, set())
                continue
            dm = re.match(r"    (?:async )?def (\w+)", line)
            if dm and current and not dm.group(1).startswith("_"):
                out[current].add(dm.group(1))
    return out


def operation_client_membership(pkg: Path, target: str, expected_client: str, absent_from: str | None):
    """Assert an operation is surfaced on expected_client and gone from absent_from."""
    classes = _classes_with_methods(pkg)
    method = norm(target)

    def has(client: str) -> bool:
        return any(norm(client) in norm(cls) and any(norm(m) == method for m in methods)
                   for cls, methods in classes.items())

    on_expected = has(expected_client)
    on_absent = has(absent_from) if absent_from else False
    ok = on_expected and not on_absent
    return ("pass" if ok else "fail",
            f"'{target}' {'on' if on_expected else 'missing from'} {expected_client}"
            + (f", {'still on' if on_absent else 'absent from'} {absent_from}" if absent_from else ""))


def class_base_subtype(pkg: Path, target: str, expected_base: str):
    """Assert the generated class `target` lists `expected_base` among its bases."""
    for p in pkg.rglob("models/_models.py"):
        m = re.search(rf"class\s+{re.escape(target)}\s*\(([^)]*)\)", p.read_text(errors="replace"))
        if m:
            bases = m.group(1)
            ok = re.search(rf"\b{re.escape(expected_base)}\b", bases) is not None
            return ("pass" if ok else "fail",
                    f"{target}({bases.strip()}) — {'subtype of' if ok else 'not a subtype of'} {expected_base}")
    return "fail", f"class {target} not found"


def run_routine(check: str, pkg: Path, item: dict, sig: dict, language: str):
    details = item.get("details", {}) or {}
    if check == "export_visibility":
        return export_visibility(pkg, item["target"], details.get("internal", False),
                                 sig.get("public_init", "models/__init__.py"))
    if check == "operation_client_membership":
        return operation_client_membership(pkg, item["target"], details.get("client"),
                                           details.get("absentFrom"))
    if check == "class_base_subtype":
        return class_base_subtype(pkg, item["target"], details.get("base"))
    expected = (item.get("client_names", {}) or {}).get(language) or details.get("name")
    if expected is None:
        return "na", f"no expected value for language '{language}'"
    if check == "identifier_exact":
        return identifier_exact(pkg, expected)
    if check == "identifier_idiomatic_casing":
        return identifier_idiomatic_casing(pkg, expected, details.get("kind"), sig.get("casing", {}))
    if check == "identifier_casing_insensitive":
        return identifier_casing_insensitive(pkg, expected)
    return "error", f"unknown check '{check}'"


def check_one(item: dict, sigs: dict, root: Path, flavor: str, language: str) -> dict:
    sig = sigs.get(item["category"])
    if sig is None:
        return {"id": item["id"], "category": item["category"], "_needs_ai": True}
    pkg = find_package(root, flavor, item["scenario"])
    if pkg is None:
        return {"id": item["id"], "category": item["category"], "status": "error",
                "evidence": f"package for scenario '{item['scenario']}' not found", "how": "deterministic"}
    try:
        status, evidence = run_routine(sig["check"], pkg, item, sig, language)
    except Exception as e:
        status, evidence = "error", f"{type(e).__name__}: {e}"
    return {"id": item["id"], "category": item["category"], "status": status,
            "evidence": evidence, "how": "deterministic"}


def run_batch(args) -> None:
    items = json.loads(Path(args.checks).read_text())["items"]
    sigs = {k: v for k, v in json.loads(Path(args.verifiers).read_text()).items() if not k.startswith("_")}
    root = Path(args.generated_root)

    results, needs_ai = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = [ex.submit(check_one, it, sigs, root, args.flavor, args.language) for it in items]
        by_id = {it["id"]: it for it in items}
        for fut in concurrent.futures.as_completed(futs):
            r = fut.result()
            if r.get("_needs_ai"):
                src = by_id[r["id"]]
                needs_ai.append({"id": src["id"], "category": src["category"],
                                 "target": src.get("target"), "doc": src.get("doc", ""),
                                 "details": src.get("details", {})})
            else:
                results.append(r)
    results.sort(key=lambda r: r["id"]); needs_ai.sort(key=lambda r: r["id"])
    print(json.dumps({"results": results, "needs_ai": needs_ai}, indent=2))


def run_single(args) -> None:
    sigs = {k: v for k, v in json.loads(Path(args.verifiers).read_text()).items() if not k.startswith("_")}
    sig = sigs.get(args.category)
    pkg = Path(args.package)
    if sig is None:
        out = {"status": "na", "evidence": f"no deterministic check for '{args.category}'"}
    elif not pkg.is_dir():
        out = {"status": "error", "evidence": f"package not found: {pkg}"}
    else:
        item = {"target": args.target, "details": {"name": args.expected, "internal": args.internal}}
        try:
            status, evidence = run_routine(sig["check"], pkg, item, sig, args.language)
            out = {"status": status, "evidence": evidence}
        except Exception as e:
            out = {"status": "error", "evidence": f"{type(e).__name__}: {e}"}
    print(json.dumps(out))


def main() -> None:
    ap = argparse.ArgumentParser(description="Deterministic client-surface checks.")
    ap.add_argument("--batch", action="store_true", help="run all checks from --checks in parallel")
    ap.add_argument("--checks", help="checks manifest JSON (batch mode)")
    ap.add_argument("--verifiers", required=True)
    ap.add_argument("--generated-root", help="batch mode: <root>/<flavor>/<package>")
    ap.add_argument("--flavor", default="azure")
    ap.add_argument("--language", default="python")
    ap.add_argument("--workers", type=int, default=16)
    # single-check args
    ap.add_argument("--category"); ap.add_argument("--package")
    ap.add_argument("--target"); ap.add_argument("--expected"); ap.add_argument("--internal", action="store_true")
    args = ap.parse_args()
    (run_batch if args.batch else run_single)(args)


if __name__ == "__main__":
    main()
