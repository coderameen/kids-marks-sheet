import shutil
from pathlib import Path

from config import UPLOAD_DIR

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MIME_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}


def photo_path(student_id: int) -> Path | None:
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOAD_DIR / f"{student_id}{ext}"
        if p.is_file():
            return p
    return None


def save_photo(student_id: int, src_path: Path) -> str:
    ext = src_path.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".png"
    delete_photo(student_id)
    dest = UPLOAD_DIR / f"{student_id}{ext}"
    shutil.copy2(src_path, dest)
    return dest.name


def delete_photo(student_id: int) -> None:
    for ext in ALLOWED_EXTENSIONS:
        p = UPLOAD_DIR / f"{student_id}{ext}"
        if p.is_file():
            p.unlink()


def mime_for_path(path: Path) -> str:
    return MIME_BY_EXT.get(path.suffix.lower(), "application/octet-stream")
