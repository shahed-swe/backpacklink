import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'plan_detail_screen.dart';

class CountryScreen extends StatefulWidget {
  final Country country;
  const CountryScreen({required this.country, super.key});
  @override
  State<CountryScreen> createState() => _CountryScreenState();
}

class _CountryScreenState extends State<CountryScreen> {
  late Future<List<Package>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Package>> _load() async {
    final catalog = context.read<AppState>().catalog;
    final results = await Future.wait([
      catalog.countryPackages(widget.country.id, type: 'DATA-ONLY'),
      catalog.countryPackages(widget.country.id, type: 'DATA-VOICE-SMS'),
    ]);
    return [...results[0], ...results[1]]..sort((a, b) => a.retail.compareTo(b.retail));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.country.name} eSIM')),
      body: AsyncView<List<Package>>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        errorMessage: 'Could not load plans.',
        builder: (plans) {
          if (plans.isEmpty) {
            return const Center(child: Text('No plans available yet for this destination.'));
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
