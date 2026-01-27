# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Simple profiler utility to measure execution time of code blocks.
Usage:
    from pygen.timing_utils import Profiler

    # For sync functions
    result = Profiler.measure('myFunction', lambda: myFunction(args))

    # For code blocks (manual start/stop)
    stop_timer = Profiler.start('processData')
    # ... your code here ...
    stop_timer()

    # Print summary at the end
    Profiler.print_summary()
"""
import time
from typing import Callable, TypeVar, Dict, Any
from dataclasses import dataclass

T = TypeVar("T")


@dataclass
class TimingEntry:
    """Stores timing information for a labeled operation."""

    total_ms: float = 0.0
    call_count: int = 0
    min_ms: float = float("inf")
    max_ms: float = float("inf")


class ProfilerClass:
    """Profiler for measuring execution time of code blocks."""

    def __init__(self):
        self.timings: Dict[str, TimingEntry] = {}
        self.enabled: bool = True

    def enable(self):
        """Enable profiling."""
        self.enabled = True

    def disable(self):
        """Disable profiling."""
        self.enabled = False

    def reset(self):
        """Clear all recorded timings."""
        self.timings.clear()

    def _record(self, label: str, duration_ms: float):
        """Record a timing measurement."""
        if label not in self.timings:
            self.timings[label] = TimingEntry(
                total_ms=duration_ms,
                call_count=1,
                min_ms=duration_ms,
                max_ms=duration_ms,
            )
        else:
            entry = self.timings[label]
            entry.total_ms += duration_ms
            entry.call_count += 1
            entry.min_ms = min(entry.min_ms, duration_ms)
            entry.max_ms = max(entry.max_ms, duration_ms)

    def measure(self, label: str, fn: Callable[[], T]) -> T:
        """Measure execution time of a synchronous function.

        Args:
            label: Label for this measurement
            fn: Function to measure

        Returns:
            Result of the function

        Example:
            result = Profiler.measure('loadData', lambda: load_data())
        """
        if not self.enabled:
            return fn()

        start = time.perf_counter()
        try:
            return fn()
        finally:
            duration = (time.perf_counter() - start) * 1000  # Convert to ms
            self._record(label, duration)
            print(f"[Profiler] {label}: {duration:.2f}ms")

    def start(self, label: str) -> Callable[[], None]:
        """Start a manual timer for measuring code blocks.

        Args:
            label: Label for this measurement

        Returns:
            A stop function to call when done measuring

        Example:
            stop_timer = Profiler.start('processData')
            # ... your code here ...
            stop_timer()
        """
        if not self.enabled:
            return lambda: None

        start_time = time.perf_counter()

        def stop():
            duration = (time.perf_counter() - start_time) * 1000  # Convert to ms
            self._record(label, duration)
            print(f"[Profiler] {label}: {duration:.2f}ms")

        return stop

    def print_summary(self):
        """Print a summary of all recorded timings, sorted by total time."""
        if not self.timings:
            print("[Profiler] No timings recorded.")
            return

        print("\n" + "=" * 100)
        print("PROFILER SUMMARY")
        print("=" * 100)

        # Sort by total time descending
        sorted_timings = sorted(self.timings.items(), key=lambda x: x[1].total_ms, reverse=True)

        total_time = sum(entry.total_ms for entry in self.timings.values())

        # Print header
        header = (
            f"{'Label':<45} {'Total(ms)':>12} {'Calls':>8} " f"{'Avg(ms)':>12} {'Min(ms)':>10} {'Max(ms)':>10} {'%':>8}"
        )
        print(header)
        print("-" * 100)

        # Print each timing
        for label, entry in sorted_timings:
            avg = entry.total_ms / entry.call_count
            percent = (entry.total_ms / total_time * 100) if total_time > 0 else 0
            row = (
                f"{label:<45} {entry.total_ms:>12.2f} {entry.call_count:>8} "
                f"{avg:>12.2f} {entry.min_ms:>10.2f} {entry.max_ms:>10.2f} {percent:>7.1f}%"
            )
            print(row)

        print("-" * 100)
        print(f"{'TOTAL':<45} {total_time:>12.2f}")
        print("=" * 100 + "\n")

    def get_timings(self) -> Dict[str, Dict[str, Any]]:
        """Get timings as a dictionary for programmatic access.

        Returns:
            Dictionary mapping labels to timing information
        """
        result = {}
        for label, entry in self.timings.items():
            result[label] = {
                "total_ms": entry.total_ms,
                "call_count": entry.call_count,
                "avg_ms": entry.total_ms / entry.call_count,
                "min_ms": entry.min_ms,
                "max_ms": entry.max_ms,
            }
        return result


# Global profiler instance
Profiler = ProfilerClass()
