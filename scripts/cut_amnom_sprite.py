from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "amnom5.jpg"
TARGET = ROOT / "assets" / "amnom-open-cut.png"


def close_to_white(pixel, tolerance=34):
    r, g, b, _ = pixel
    return r > 214 and g > 214 and b > 214 and max(r, g, b) - min(r, g, b) < tolerance


def main():
    image = Image.open(SOURCE).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = set()
    queue = deque()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or x < 0 or y < 0 or x >= width or y >= height:
            continue

        visited.add((x, y))
        if not close_to_white(pixels[x, y]):
            continue

        pixels[x, y] = (255, 255, 255, 0)
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    image.save(TARGET)
    print(TARGET)


if __name__ == "__main__":
    main()
