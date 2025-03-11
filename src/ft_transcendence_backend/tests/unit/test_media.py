import os
import shutil
import pytest
from PIL import Image  # For image dimension tests (if needed)
import stat # for file permission tests

# Assuming your app directory is at the root of your project
MEDIA_DIR = "media/avatars"  

def test_media_files_exist_and_size():
    media_dir = MEDIA_DIR # use the global variable.
    for filename in os.listdir(media_dir):
        if filename.lower().endswith(".png"):
            filepath = os.path.join(media_dir, filename)
            assert os.path.exists(filepath)
            assert os.path.getsize(filepath) > 0  # Check for non-empty files
            assert os.path.getsize(filepath) <= 200 * 1024  # Check size limit (200KB)

def test_png_file_headers():
    media_dir = MEDIA_DIR
    png_header = b'\x89PNG\r\n\x1a\n'  # Standard PNG header
    for filename in os.listdir(media_dir):
        if filename.lower().endswith(".png"):
            filepath = os.path.join(media_dir, filename)
            with open(filepath, "rb") as f:
                header = f.read(8)  # Read the first 8 bytes
                assert header == png_header

# TODO check with omio and arthur and olly what they think about these tests - what size needs the images be
# def test_image_dimensions():
#     media_dir = MEDIA_DIR
#     expected_width = 200  # Replace with your expected width
#     expected_height = 200  # Replace with your expected height
#     for filename in os.listdir(media_dir):
#         if filename.lower().endswith(".png"):
#             filepath = os.path.join(media_dir, filename)
#             with Image.open(filepath) as img:
#                 width, height = img.size
#                 assert width == expected_width
#                 assert height == expected_height

def test_file_extension():
    media_dir = MEDIA_DIR
    for filename in os.listdir(media_dir):
      if filename.lower().endswith(".png"):
        filepath = os.path.join(media_dir, filename)
        assert os.path.splitext(filepath)[1].lower() == ".png"

def test_file_permissions():
    media_dir = MEDIA_DIR
    for filename in os.listdir(media_dir):
        if filename.lower().endswith(".png"):
            filepath = os.path.join(media_dir, filename)
            mode = os.stat(filepath).st_mode
            assert mode & stat.S_IRUSR  # Check read permission for owner