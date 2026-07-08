#!/usr/bin/env python3
"""Build manual/index.md from the app repo's generated MANUAL.md.

Usage: scripts/build-manual.py path/to/MANUAL.md

Inserts illustrative screenshots (assets/screens/) after selected section
headings and prepends Jekyll front matter plus the mirror note. Rerun after
every `swift run generate-manual` in the app repository.
"""
import sys, re, pathlib

# section heading -> (image file, alt text, caption)
IMAGES = {
    "Read me first": ("ready.png", "READY screen with gas, gradient factors, sensor limit and the secondary-display disclaimer", "Pre-dive READY screen — the disclaimer is always visible."),
    "The five pages": ("tissues.png", "Tissue saturation page with compartment bars and M-value line", "The Tissues page: compartment loading against the M-value line."),
    "Dive display, top to bottom": ("dive-air.png", "Dive display showing depth and the no-deco limit", "The dive display on air: depth rules the screen."),
    "Screens and colours": ("deco.png", "Decompression screen with amber accents, first stop and time to surface", "Deco: amber state, first stop and time-to-surface."),
    "Warnings and honesty": ("violation.png", "Red ABOVE STOP - DESCEND directive during a stop violation", "A stop violation: the red directive names the action."),
    "Demo dives (Try it)": ("demo.png", "Demo dive with the DEMO x60 badge", "A demo dive — the DEMO badge stays visible throughout."),
}

FRONT = """---
title: WatchDiver Manual
---

"""

MIRROR_NOTE = "> Mirror of the WatchDiver in-app Manual page — generated from the app sources (`swift run generate-manual`), published for reading on the phone via the QR code on the watch. [← watchdiver home](../)"


def figure(filename, alt, caption):
    return (f'\n<img src="../assets/screens/{filename}" alt="{alt}" width="240">\n\n'
            f'*{caption}*\n')


def main():
    src = pathlib.Path(sys.argv[1]).read_text()
    lines = src.splitlines()
    # Replace the generation note (line 3 of MANUAL.md) with the mirror note.
    if len(lines) > 2 and lines[2].startswith("> Generated from"):
        lines[2] = MIRROR_NOTE
    out = []
    for line in lines:
        out.append(line)
        m = re.match(r"^## (.+)$", line)
        if m and m.group(1) in IMAGES:
            out.append(figure(*IMAGES[m.group(1)]))
    pathlib.Path("manual/index.md").write_text(FRONT + "\n".join(out) + "\n")
    print(f"manual/index.md written ({len(IMAGES)} figures)")


if __name__ == "__main__":
    main()
