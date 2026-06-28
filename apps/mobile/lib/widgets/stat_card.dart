import 'package:flutter/material.dart';
import '../core/theme.dart';

/// Small labeled value card (e.g. Data / Validity / Speed).
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  const StatCard({required this.label, required this.value, super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(fontSize: 11, color: BpColors.inkFade(0.4))),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ]),
      ),
    );
  }
}
