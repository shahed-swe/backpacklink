import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';
import 'checkout_screen.dart';
import 'login_screen.dart';

class PlanDetailScreen extends StatefulWidget {
  final String packageId;
  const PlanDetailScreen({required this.packageId, super.key});
  @override
  State<PlanDetailScreen> createState() => _PlanDetailScreenState();
}

class _PlanDetailScreenState extends State<PlanDetailScreen> {
  late Future<Package> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Package> _load() => context.read<AppState>().catalog.packageDetail(widget.packageId);

  void _buy(Package pkg) {
    final state = context.read<AppState>();
    if (!state.isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    Navigator.push(context, MaterialPageRoute(builder: (_) => CheckoutScreen(pkg: pkg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plan details')),
      body: AsyncView<Package>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        errorMessage: 'Could not load this plan.',
        builder: (pkg) => Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    if (pkg.unlimited) const BpChip.coral('Unlimited'),
                    if (pkg.topGeneration.isNotEmpty) BpChip.brand('Up to ${pkg.topGeneration}'),
                    if (pkg.tether) const BpChip('Hotspot'),
                    if (pkg.scope != null) BpChip(pkg.scope!),
                  ]),
                  const SizedBox(height: 12),
                  Text(pkg.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: StatCard(label: 'Data', value: pkg.dataLabel)),
                    const SizedBox(width: 8),
                    Expanded(child: StatCard(label: 'Validity', value: pkg.validityLabel)),
                    const SizedBox(width: 8),
                    Expanded(child: StatCard(label: 'Speed', value: pkg.topGeneration.isEmpty ? '—' : pkg.topGeneration)),
                  ]),
                  const SizedBox(height: 24),
                  const SectionHeader('Coverage', 'Networks'),
                  const SizedBox(height: 12),
                  CoverageList(pkg.coverage),
                ],
              ),
            ),
            _BuyBar(pkg: pkg, onBuy: () => _buy(pkg)),
          ],
        ),
      ),
    );
  }
}

class _BuyBar extends StatelessWidget {
  final Package pkg;
  final VoidCallback onBuy;
  const _BuyBar({required this.pkg, required this.onBuy});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x11000000), blurRadius: 12, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Row(children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Total', style: TextStyle(fontSize: 11, color: BpColors.inkFade(0.4))),
            Text(money(pkg.retail, pkg.currency),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          ]),
          const Spacer(),
          FilledButton(onPressed: onBuy, child: const Text('Buy this eSIM')),
        ]),
      ),
    );
  }
}
