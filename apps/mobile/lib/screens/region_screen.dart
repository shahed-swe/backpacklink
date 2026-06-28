import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'plan_detail_screen.dart';

class RegionScreen extends StatefulWidget {
  final Continent continent;
  const RegionScreen({required this.continent, super.key});
  @override
  State<RegionScreen> createState() => _RegionScreenState();
}

class _RegionScreenState extends State<RegionScreen> {
  late Future<List<Package>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Package>> _load() async {
    final list = await context.read<AppState>().catalog.continentPackages(widget.continent.id);
    return list..sort((a, b) => a.retail.compareTo(b.retail));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.continent.name} eSIM')),
      body: AsyncView<List<Package>>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        errorMessage: 'Could not load regional plans.',
        builder: (plans) {
          if (plans.isEmpty) {
            return const Center(child: Text('No regional plans available right now.'));
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
