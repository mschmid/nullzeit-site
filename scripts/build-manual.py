#!/usr/bin/env python3
"""Build manual/index.md from the app repo's generated MANUAL.md.

Usage: scripts/build-manual.py path/to/MANUAL.md

Inserts illustrative screenshots (assets/screens/) after selected section
headings and prepends Jekyll front matter plus the mirror note. Rerun after
every `swift run generate-manual` in the app repository.
"""
import sys, re, pathlib

# section heading -> list of (image file, alt text, caption)
IMAGES = {
    "Read me first": [
        ("ready.png", "READY screen with gas and sensor limit, the Dive button and the secondary-display disclaimer", "Pre-dive READY screen — the disclaimer is always visible."),
    ],
    "The six pages": [
        ("dive-air.png", "Dive page showing water temperature, dive time, depth and the no-deco limit", "Page 1, the dive display: depth rules the screen."),
    ],
    "Planner": [
        ("planner.png", "No-deco planner listing the no-stop time at a range of depths", "The surface planner: no-stop time by depth, from your current tissue loading."),
    ],
    "Dive display, top to bottom": [
        ("deco.png", "Decompression screen with temperature, dive time, depth, GF, ceiling, first stop and time to surface", "All elements populated: a dive in decompression."),
    ],
    "Screens and colours": [
        ("violation.png", "Red ABOVE STOP - DESCEND directive during a stop violation", "A stop violation: the red directive names the action."),
        ("slow.png", "SLOW - ASCENT TOO FAST takeover showing 15 m/min against 10 max safe", "Ascending too fast: SLOW with the live rate against the safe maximum."),
        ("night.png", "Night mode: the dive display in a dim red monochrome palette", "Night mode: a dim red palette that keeps your dark adaptation."),
    ],
    "Try it on land": [
        ("demo.png", "Demo dive with the DEMO x60 badge", "A demo dive — the DEMO badge stays visible throughout."),
    ],
    "The model, in one breath": [
        ("tissues.png", "Tissue saturation page with compartment bars and M-value line", "The Tissues page: compartment loading against the M-value line."),
    ],
}

FRONT = """---
title: Nullzeit Manual
description: >-
  The full Nullzeit user manual — dive start modes, screens and warnings,
  the ZH-L16C tissue model and gradient factors, logbook, and troubleshooting
  on the Apple Watch Ultra.
image: /assets/og-image.png
---

"""

MIRROR_NOTE = "> Mirror of the Nullzeit in-app Manual page — generated from the app sources (`swift run generate-manual`), published for reading on the phone via the QR code on the watch. [← nullzeit home](../)"


def figure(filename, alt, caption):
    return (f'\n<p align="center"><img src="../assets/screens/{filename}?v=3" alt="{alt}" width="240"><br>'
            f'<em>{caption}</em></p>\n')


def main():
    src = pathlib.Path(sys.argv[1]).read_text()
    lines = src.splitlines()
    # Replace the generation note (line 3 of MANUAL.md) with the mirror note.
    if len(lines) > 2 and lines[2].startswith("> Generated from"):
        lines[2] = MIRROR_NOTE
    out = []
    count = 0
    for line in lines:
        out.append(line)
        m = re.match(r"^## (.+)$", line)
        if m and m.group(1) in IMAGES:
            for spec in IMAGES[m.group(1)]:
                out.append(figure(*spec))
                count += 1
    pathlib.Path("manual/index.md").write_text(FRONT + "\n".join(out) + "\n")
    print(f"manual/index.md written ({count} figures)")


if __name__ == "__main__":
    main()
