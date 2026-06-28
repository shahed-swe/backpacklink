import 'package:flutter/material.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../data/models.dart';
import 'bp_chip.dart';

/// Tappable card summarizing a package (data, validity, price).
class PlanTile extends StatelessWidget {
  final Package pkg;
  final VoidCallback onTap;
  const PlanTile({required this.pkg, required this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                if (pkg.unlimited) const BpChip.coral('Unlimited'),
                if (pkg.topGeneration.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  BpChip.brand(pkg.topGeneration),
                ],
                const Spacer(),
                if (pkg.coverage.length > 1) BpChip.brand('${pkg.coverage.length} countries'),
              ]),
              const SizedBox(height: 12),
              Text(pkg.dataLabel, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
              Text('for ${pkg.validityLabel}', style: TextStyle(color: BpColors.inkFade(0.5))),
              const Divider(height: 24),
              Row(children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('From', style: TextStyle(fontSize: 11, color: BpColors.inkFade(0.4))),
                  Text(money(pkg.retail, pkg.currency),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: BpColors.brand)),
                ]),
                const Spacer(),
                const Text('View →', style: TextStyle(fontWeight: FontWeight.w700, color: BpColors.brand)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
