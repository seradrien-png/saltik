"""Compatibility entry point for the two-stage boss browser check."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('browser_dual_boss.py')),run_name='__main__')
