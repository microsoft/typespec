#!/usr/bin/env python3
"""Deterministic client-surface checks - the tool the orchestrator calls.

Two modes, both AI-free:

  --batch:  read a checks manifest (JSON), run EVERY deterministic check in
            parallel (thread pool), and print {"results": [...], "needs_ai": [...]}.
            The orchestrator calls this once, then AI-verifies the needs_ai list.

  single:   run one check and print {"status","evidence"} (handy for debugging).

Batch usage:
  verify.py --batch --checks demo-checks.json --signatures signatures.json \
            --generated-root tests/generated --flavor azure --language python [--workers 16]

Single usage:
  verify.py --category naming --package <pkg> --expected clientName --signatures signatures.json
"""
from __future__ import annotations
import argparse, concurrent.futures, json, re
from pathlib import Path


def norm(s: str) -> str:
    return re.sub(r"[_\-]", "", s).lower()


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


def run_routine(check: str, pkg: Path, item: dict, sig: dict, language: str):
    if check == "export_visibility":
        internal = "internal" in (item.get("verify", "") + item.get("access", "")).lower() or item.get("internal", False)
        return export_visibility(pkg, item["target"], internal, sig.get("public_init", "models/__init__.py"))
    expected = (item.get("client_names", {}) or {}).get(language) or item.get("expected")
    if expected is None:
        return "na", f"no expected value for language '{language}'"
    if check == "identifier_exact":
        return identifier_exact(pkg, expected)
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
    sigs = {k: v for k, v in json.loads(Path(args.signatures).read_text()).items() if not k.startswith("_")}
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
                                 "target": src.get("target"), "verify": src.get("verify", "")})
            else:
                results.append(r)
    results.sort(key=lambda r: r["id"]); needs_ai.sort(key=lambda r: r["id"])
    print(json.dumps({"results": results, "needs_ai": needs_ai}, indent=2))


def run_single(args) -> None:
    sigs = {k: v for k, v in json.loads(Path(args.signatures).read_text()).items() if not k.startswith("_")}
    sig = sigs.get(args.category)
    pkg = Path(args.package)
    if sig is None:
        out = {"status": "na", "evidence": f"no deterministic check for '{args.category}'"}
    elif not pkg.is_dir():
        out = {"status": "error", "evidence": f"package not found: {pkg}"}
    else:
        item = {"target": args.target, "expected": args.expected, "internal": args.internal}
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
    ap.add_argument("--signatures", required=True)
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
