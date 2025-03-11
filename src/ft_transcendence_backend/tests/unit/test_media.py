import os
import shutil
import pytest


# Assuming your app directory is at the root of your project
MEDIA_DIR = "app/media"
TEST_MEDIA_DIR = "app/test_media" # A test media directory to not touch the real media dir.

@pytest.fixture(autouse=True)
def setup_teardown():
	if not os.path.exists(TEST_MEDIA_DIR):
		os.makedirs(TEST_MEDIA_DIR)

		yield # run tests
	
	# teardown
	if os.path.exists(TEST_MEDIA_DIR):
		shutil.rmtree(TEST_MEDIA_DIR)