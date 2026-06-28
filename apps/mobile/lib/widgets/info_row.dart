import 'package:flutter/material.dart';
import '../core/theme.dart';

/// Label + value row used in profile / details.
class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final double labelWidth;
  const InfoRow(this.label, this.value, {this.labelWidth = 70, super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(children: [
        SizedBox(width: labelWidth, child: Text(label, style: TextStyle(color: BpColors.inkFade(0.5)))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600))),
      ]),
    );
  }
}
