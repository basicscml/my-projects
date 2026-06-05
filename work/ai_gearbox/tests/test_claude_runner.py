"""Tests for the claude runner that do not hit the network.

The actual API call is exercised manually with a real key; here we cover the
parts that are pure logic: text extraction, saving, and the status pointer.
"""

import pathlib
import tempfile
import unittest

import claude_runner


class _Block:
    def __init__(self, text):
        self.text = text


class _Message:
    def __init__(self, blocks):
        self.content = blocks


class ExtractTextTests(unittest.TestCase):
    def test_joins_text_blocks(self):
        msg = _Message([_Block("hello"), _Block("world")])
        self.assertEqual(claude_runner._extract_text(msg), "hello\nworld")

    def test_ignores_blocks_without_text(self):
        msg = _Message([_Block("keep"), object()])
        self.assertEqual(claude_runner._extract_text(msg), "keep")

    def test_empty_content(self):
        self.assertEqual(claude_runner._extract_text(_Message([])), "")


class SaveResponseTests(unittest.TestCase):
    def test_saves_and_updates_pointer(self):
        with tempfile.TemporaryDirectory() as tmp:
            responses = pathlib.Path(tmp) / "responses"
            pointer = pathlib.Path(tmp) / "status" / "latest_response.txt"

            out = claude_runner.save_response(
                "ANSWER", responses_dir=responses, status_pointer=pointer
            )

            self.assertTrue(out.exists())
            self.assertEqual(out.read_text(encoding="utf-8"), "ANSWER")
            self.assertEqual(pointer.read_text(encoding="utf-8"), str(out))

    def test_pointer_tracks_latest(self):
        with tempfile.TemporaryDirectory() as tmp:
            responses = pathlib.Path(tmp) / "responses"
            pointer = pathlib.Path(tmp) / "status" / "latest_response.txt"

            claude_runner.save_response(
                "first", responses_dir=responses, status_pointer=pointer
            )
            second = claude_runner.save_response(
                "second", responses_dir=responses, status_pointer=pointer
            )

            self.assertEqual(pointer.read_text(encoding="utf-8"), str(second))


if __name__ == "__main__":
    unittest.main()
