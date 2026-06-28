import 'package:flutter/material.dart';
import '../core/theme.dart';

/// "EYEBROW" + big title pair used as a section heading.
class SectionHeader extends StatelessWidget {
  final String eyebrow;
  final String title;
  const SectionHeader(this.eyebrow, this.title, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow.toUpperCase(),
          style: const TextStyle(
              color: BpColors.coral, fontWeight: FontWeight.w800, fontSize: 12, letterSpacing: 1),
        ),
        const SizedBox(height: 2),
        Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
      ],
    );
  }
}
