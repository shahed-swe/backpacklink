import 'package:flutter/material.dart';
import '../core/theme.dart';

/// Small rounded label chip used across the app.
class BpChip extends StatelessWidget {
  final String label;
  final Color bg;
  final Color fg;
  const BpChip(this.label, {this.bg = BpColors.sand100, this.fg = BpColors.ink, super.key});

  const BpChip.brand(String label, {Key? key})
      : this(label, bg: BpColors.brandBg, fg: BpColors.brand, key: key);
  const BpChip.coral(String label, {Key? key})
      : this(label, bg: BpColors.coralBg, fg: BpColors.coral, key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
