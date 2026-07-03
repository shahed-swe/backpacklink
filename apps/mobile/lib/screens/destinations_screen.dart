import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'country_screen.dart';

/// Full browsable list of every destination (matches the web /destinations).
class DestinationsScreen extends StatefulWidget {
  const DestinationsScreen({super.key});
  @override
  State<DestinationsScreen> createState() => _DestinationsScreenState();
}

class _DestinationsScreenState extends State<DestinationsScreen> {
  late Future<List<Country>> _future;
  String _q = '';

  @override
  void initState() {
    super.initState();
    _future = context.read<AppState>().catalog.countries();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('All destinations')),
      body: AsyncView<List<Country>>(
        future: _future,
        onRetry: () => setState(() => _future = context.read<AppState>().catalog.countries()),
        builder: (all) {
          final list = _q.isEmpty
              ? all
              : all.where((c) => c.name.toLowerCase().contains(_q.toLowerCase())).toList();
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: const InputDecoration(hintText: 'Search 200+ countries…', prefixIcon: Icon(Icons.search)),
                  onChanged: (v) => setState(() => _q = v),
                ),
              ),
              Expanded(
                child: list.isEmpty
                    ? const Center(child: Text('No destinations match your search.'))
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        itemCount: list.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (_, i) => CountryTile(
                          country: list[i],
                          onTap: () => Navigator.push(
                              context, MaterialPageRoute(builder: (_) => CountryScreen(country: list[i]))),
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
