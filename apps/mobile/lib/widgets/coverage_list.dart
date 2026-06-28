import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// Renders per-country network coverage with 2G/3G/4G/5G badges.
class CoverageList extends StatelessWidget {
  final List<CountryCoverage> coverage;
  const CoverageList(this.coverage, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(children: coverage.map((c) => _CoverageCard(c)).toList());
  }
}

class _CoverageCard extends StatelessWidget {
  final CountryCoverage c;
  const _CoverageCard(this.c);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(c.country, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...c.networks.map((n) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(children: [
                  Expanded(child: Text(n.name, style: TextStyle(color: BpColors.inkFade(0.7)))),
                  ...['2G', '3G', '4G', '5G'].map((g) => _GenBadge(g, n.generations.contains(g))),
                ]),
              )),
        ]),
      ),
    );
  }
}

class _GenBadge extends StatelessWidget {
  final String gen;
  final bool active;
  const _GenBadge(this.gen, this.active);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: active ? BpColors.brand : BpColors.sand100,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(gen,
          style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: active ? Colors.white : BpColors.inkFade(0.3))),
    );
  }
}
