import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'plan_detail_screen.dart';

class GlobalScreen extends StatefulWidget {
  const GlobalScreen({super.key});
  @override
  State<GlobalScreen> createState() => _GlobalScreenState();
}

class _GlobalScreenState extends State<GlobalScreen> {
  late Future<List<Package>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Package>> _load() async {
    final list = await context.read<AppState>().catalog.globalPackages();
    return list..sort((a, b) => a.retail.compareTo(b.retail));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Global eSIM')),
      body: AsyncView<List<Package>>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        errorMessage: 'Could not load global plans.',
        builder: (plans) {
          if (plans.isEmpty) {
            return const Center(child: Text('Global plans are being updated — check back soon.'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: plans.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => PlanTile(
              pkg: plans[i],
              onTap: () => Navigator.push(
                  context, MaterialPageRoute(builder: (_) => PlanDetailScreen(packageId: plans[i].id))),
            ),
          );
        },
      ),
    );
  }
}
