import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// Thin full-bleed offer strip at the very top of the home page.
/// Content is admin-managed (see the Campaigns admin section).
class PromoBar extends StatelessWidget {
  final Promotion promo;
  const PromoBar({super.key, required this.promo});

  static Color _parse(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    final h = hex.replaceAll('#', '');
    final v = int.tryParse(h.length == 6 ? 'FF$h' : h, radix: 16);
    return v == null ? fallback : Color(v);
  }

  bool get _launchable {
    final uri = promo.ctaUrl == null ? null : Uri.tryParse(promo.ctaUrl!);
    return uri != null && uri.hasScheme;
  }

  @override
  Widget build(BuildContext context) {
    final bg = _parse(promo.bgColor, BpColors.coral);
    final fg = _parse(promo.textColor, Colors.white);
    final label =
        [promo.title, if (promo.subtitle != null && promo.subtitle!.isNotEmpty) promo.subtitle!].join('  ·  ');

    final content = Container(
      width: double.infinity,
      color: bg,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Flexible(
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
          if (promo.ctaLabel != null && promo.ctaLabel!.isNotEmpty) ...[
            const SizedBox(width: 8),
            Text('${promo.ctaLabel} →',
                style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: 13)),
          ],
        ],
      ),
    );

    if (!_launchable) return content;
    return InkWell(
      onTap: () => launchUrl(Uri.parse(promo.ctaUrl!), mode: LaunchMode.externalApplication),
      child: content,
    );
  }
}
