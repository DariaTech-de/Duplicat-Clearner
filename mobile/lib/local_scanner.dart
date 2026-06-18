import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as p;

class MobileFileInfo {
  MobileFileInfo({
    required this.path,
    required this.name,
    required this.size,
    required this.sha256,
  });

  final String path;
  final String name;
  final int size;
  final String sha256;

  Map<String, dynamic> toJson() => {
        'path': path,
        'name': name,
        'size': size,
        'sha256': sha256,
      };
}

class MobileDuplicateGroup {
  MobileDuplicateGroup({required this.hash, required this.files});

  final String hash;
  final List<MobileFileInfo> files;

  Map<String, dynamic> toJson() => {
        'hash': hash,
        'files': files.map((item) => item.toJson()).toList(),
      };
}

class MobileScanner {
  Future<List<MobileDuplicateGroup>> pickAndScanFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result == null) return [];

    final byHash = <String, List<MobileFileInfo>>{};
    for (final picked in result.files) {
      final filePath = picked.path;
      if (filePath == null) continue;
      final file = File(filePath);
      if (!await file.exists()) continue;
      final digest = await _sha256(file);
      final info = MobileFileInfo(
        path: filePath,
        name: p.basename(filePath),
        size: await file.length(),
        sha256: digest,
      );
      byHash.putIfAbsent(digest, () => []).add(info);
    }

    return byHash.entries
        .where((entry) => entry.value.length > 1)
        .map((entry) => MobileDuplicateGroup(hash: entry.key, files: entry.value))
        .toList();
  }

  Future<String> _sha256(File file) async {
    final digest = await sha256.bind(file.openRead()).first;
    return digest.toString();
  }
}
