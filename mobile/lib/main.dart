import 'package:flutter/material.dart';

import 'api_client.dart';
import 'local_scanner.dart';

void main() {
  runApp(const DuplicatCleanerMobileApp());
}

class DuplicatCleanerMobileApp extends StatelessWidget {
  const DuplicatCleanerMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Duplicat-Cleaner Mobile',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final serverController = TextEditingController(text: 'http://127.0.0.1:8787');
  final scanner = MobileScanner();
  List<MobileDuplicateGroup> groups = [];
  String status = 'Bereit';

  Future<void> scanLocalFiles() async {
    setState(() => status = 'Lokaler Scan läuft …');
    final result = await scanner.pickAndScanFiles();
    setState(() {
      groups = result;
      status = '${result.length} Duplikatgruppe(n) gefunden';
    });
  }

  Future<void> checkServer() async {
    setState(() => status = 'Server wird geprüft …');
    try {
      final client = EnterpriseApiClient(serverController.text.trim());
      final result = await client.capabilities();
      setState(() => status = 'Verbunden: ${result['product']}');
    } catch (error) {
      setState(() => status = 'Keine Verbindung: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Duplicat-Cleaner Mobile')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: serverController,
              decoration: const InputDecoration(
                labelText: 'Enterprise API URL',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(onPressed: checkServer, child: const Text('Server prüfen')),
            FilledButton.tonal(onPressed: scanLocalFiles, child: const Text('Dateien auf Smartphone auswählen & scannen')),
            const SizedBox(height: 12),
            Text(status),
            const Divider(),
            Expanded(
              child: ListView.builder(
                itemCount: groups.length,
                itemBuilder: (context, index) {
                  final group = groups[index];
                  return Card(
                    child: ExpansionTile(
                      title: Text('Gruppe ${index + 1}: ${group.files.length} Dateien'),
                      subtitle: Text(group.hash.substring(0, 16)),
                      children: group.files
                          .map((file) => ListTile(
                                title: Text(file.name),
                                subtitle: Text('${file.size} Bytes\n${file.path}'),
                              ))
                          .toList(),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
