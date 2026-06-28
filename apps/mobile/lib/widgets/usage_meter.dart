import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// Remaining-vs-initial data meter (handles unlimited + demo usage).
class UsageMeter extends StatelessWidget {
  final Usage usage;
  const UsageMeter(this.usage, {super.key});

  @override
  Widget build(BuildContext context) {
    if (usage.unlimited) {
      return const Text('Unlimited data', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800));
    }
    final init = (usage.initialQuantity is num) ? (usage.initialQuantity as num).toDouble() : 0.0;
    final rem = (usage.remainingQuantity is num) ? (usage.remainingQuantity as num).toDouble() : 0.0;
    final frac = init == 0 ? 0.0 : (rem / init).clamp(0.0, 1.0);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('$rem ${usage.remainingUnit} left',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
      Text('of $init ${usage.initialUnit}', style: TextStyle(color: BpColors.inkFade(0.5))),
      const SizedBox(height: 10),
      ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: LinearProgressIndicator(
            value: frac, minHeight: 10, backgroundColor: BpColors.sand100, color: BpColors.brand),
      ),
      if (usage.mock)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text('(Demo usage — live data shows for real plans.)',
              style: TextStyle(fontSize: 11, color: BpColors.inkFade(0.4))),
        ),
    ]);
  }
}
