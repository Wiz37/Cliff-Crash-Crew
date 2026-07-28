#!/usr/bin/env python3
"""Generate a 1024x1024 opaque Cliff Crash Crew iOS icon using stdlib only."""
from __future__ import annotations

import math
import struct
import sys
import zlib
from pathlib import Path

W = H = 1024
pixels = bytearray(W * H * 3)


def set_px(x: int, y: int, rgb: tuple[int, int, int]) -> None:
    if 0 <= x < W and 0 <= y < H:
        i = (y * W + x) * 3
        pixels[i:i+3] = bytes(rgb)


def fill(rgb: tuple[int, int, int]) -> None:
    row = bytes(rgb) * W
    for y in range(H):
        i = y * W * 3
        pixels[i:i + W * 3] = row


def circle(cx: int, cy: int, radius: int, rgb: tuple[int, int, int]) -> None:
    r2 = radius * radius
    for y in range(max(0, cy - radius), min(H, cy + radius + 1)):
        dy2 = (y - cy) ** 2
        span = int(math.sqrt(max(0, r2 - dy2)))
        for x in range(max(0, cx - span), min(W, cx + span + 1)):
            set_px(x, y, rgb)


def gradient_circle(cx: int, cy: int, radius: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> None:
    r2 = radius * radius
    for y in range(max(0, cy - radius), min(H, cy + radius + 1)):
        t = (y - (cy - radius)) / (2 * radius)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        dy2 = (y - cy) ** 2
        span = int(math.sqrt(max(0, r2 - dy2)))
        for x in range(max(0, cx - span), min(W, cx + span + 1)):
            set_px(x, y, color)


def polygon(points: list[tuple[int, int]], rgb: tuple[int, int, int]) -> None:
    min_y = max(0, min(y for _, y in points))
    max_y = min(H - 1, max(y for _, y in points))
    n = len(points)
    for y in range(min_y, max_y + 1):
        xs: list[float] = []
        for i in range(n):
            x1, y1 = points[i]
            x2, y2 = points[(i + 1) % n]
            if y1 == y2:
                continue
            if y >= min(y1, y2) and y < max(y1, y2):
                xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(max(0, math.ceil(xs[i])), min(W, math.floor(xs[i + 1]) + 1)):
                set_px(x, y, rgb)


def rect(x0: int, y0: int, x1: int, y1: int, rgb: tuple[int, int, int]) -> None:
    for y in range(max(0, y0), min(H, y1)):
        for x in range(max(0, x0), min(W, x1)):
            set_px(x, y, rgb)


def rounded_rect(x0: int, y0: int, x1: int, y1: int, r: int, rgb: tuple[int, int, int]) -> None:
    rect(x0 + r, y0, x1 - r, y1, rgb)
    rect(x0, y0 + r, x1, y1 - r, rgb)
    circle(x0 + r, y0 + r, r, rgb)
    circle(x1 - r - 1, y0 + r, r, rgb)
    circle(x0 + r, y1 - r - 1, r, rgb)
    circle(x1 - r - 1, y1 - r - 1, r, rgb)


def png_bytes() -> bytes:
    raw = bytearray()
    stride = W * 3
    for y in range(H):
        raw.append(0)
        raw.extend(pixels[y * stride:(y + 1) * stride])

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)

    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
        + chunk(b'IEND', b'')
    )


fill((21, 22, 41))
gradient_circle(512, 455, 365, (88, 221, 255), (123, 97, 255))
polygon([(120, 700), (420, 270), (545, 455), (670, 320), (905, 700)], (255, 246, 213))
polygon([(160, 675), (420, 330), (545, 515), (670, 385), (855, 675)], (88, 185, 87))
polygon([(335, 455), (420, 330), (500, 448), (455, 430), (420, 470), (390, 425)], (255, 246, 213))
polygon([(610, 445), (670, 385), (735, 480), (690, 455), (655, 490)], (255, 246, 213))
rounded_rect(325, 535, 710, 700, 48, (21, 22, 41))
rounded_rect(345, 550, 690, 675, 38, (255, 77, 134))
polygon([(405, 555), (475, 470), (610, 470), (665, 555)], (21, 22, 41))
polygon([(430, 545), (492, 492), (590, 492), (635, 545)], (88, 221, 255))
circle(420, 685, 72, (21, 22, 41))
circle(620, 685, 72, (21, 22, 41))
circle(420, 685, 31, (255, 246, 213))
circle(620, 685, 31, (255, 246, 213))
for cx, cy, size in [(760, 470, 40), (270, 445, 30), (780, 610, 24)]:
    polygon([
        (cx, cy - size), (cx + size // 4, cy - size // 4),
        (cx + size, cy), (cx + size // 4, cy + size // 4),
        (cx, cy + size), (cx - size // 4, cy + size // 4),
        (cx - size, cy), (cx - size // 4, cy - size // 4),
    ], (255, 212, 59))

out = Path(sys.argv[1] if len(sys.argv) > 1 else 'app-icon-1024.png')
out.write_bytes(png_bytes())
print(out)
