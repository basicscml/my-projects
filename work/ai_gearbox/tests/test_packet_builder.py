"""Tests for the packet builder."""

import pathlib
import tempfile
import unittest

import packet_builder


class CollectMemoryFilesTests(unittest.TestCase):
    def test_collects_markdown_sorted(self):
        with tempfile.TemporaryDirectory() as tmp:
            mem = pathlib.Path(tmp)
            (mem / "b.md").write_text("B", encoding="utf-8")
            (mem / "a.md").write_text("A", encoding="utf-8")
            (mem / "skip.txt").write_text("nope", encoding="utf-8")

            files = packet_builder.collect_memory_files(mem)

            self.assertEqual([p.name for p in files], ["a.md", "b.md"])

    def test_missing_dir_returns_empty(self):
        files = packet_builder.collect_memory_files(pathlib.Path("/does/not/exist"))
        self.assertEqual(files, [])


class BuildPacketTests(unittest.TestCase):
    def _memory(self, tmp):
        mem = pathlib.Path(tmp) / "memory"
        mem.mkdir()
        (mem / "system_purpose.md").write_text("PURPOSE", encoding="utf-8")
        (mem / "global_working_agreement.md").write_text("AGREEMENT", encoding="utf-8")
        return mem

    def test_includes_memory_and_task(self):
        with tempfile.TemporaryDirectory() as tmp:
            mem = self._memory(tmp)
            packet = packet_builder.build_packet("Do the thing", memory_dir=mem)

            self.assertIn("SHARED MEMORY", packet)
            self.assertIn("PURPOSE", packet)
            self.assertIn("AGREEMENT", packet)
            self.assertIn("Do the thing", packet)
            self.assertIn("===== TASK =====", packet)

    def test_includes_selected_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            mem = self._memory(tmp)
            project = pathlib.Path(tmp) / "draft.md"
            project.write_text("CHAPTER ONE", encoding="utf-8")

            packet = packet_builder.build_packet(
                "Review this", [project], memory_dir=mem
            )

            self.assertIn("PACKET FILES", packet)
            self.assertIn("CHAPTER ONE", packet)

    def test_selected_files_resolved_against_base_dir(self):
        with tempfile.TemporaryDirectory() as tmp:
            mem = self._memory(tmp)
            base = pathlib.Path(tmp) / "proj"
            base.mkdir()
            (base / "notes.md").write_text("NOTES HERE", encoding="utf-8")

            packet = packet_builder.build_packet(
                "Use notes", ["notes.md"], memory_dir=mem, base_dir=base
            )

            self.assertIn("NOTES HERE", packet)

    def test_task_is_last_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            mem = self._memory(tmp)
            packet = packet_builder.build_packet("FINAL TASK", memory_dir=mem)
            self.assertTrue(packet.rstrip().endswith("FINAL TASK"))


class SavePacketTests(unittest.TestCase):
    def test_save_writes_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = packet_builder.save_packet("hello", packets_dir=pathlib.Path(tmp))
            self.assertTrue(out.exists())
            self.assertEqual(out.read_text(encoding="utf-8"), "hello")

    def test_save_does_not_clobber(self):
        with tempfile.TemporaryDirectory() as tmp:
            d = pathlib.Path(tmp)
            first = packet_builder.save_packet("one", packets_dir=d)
            second = packet_builder.save_packet("two", packets_dir=d)
            self.assertNotEqual(first, second)


if __name__ == "__main__":
    unittest.main()
