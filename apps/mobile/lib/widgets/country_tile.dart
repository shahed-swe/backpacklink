import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../data/models.dart';

/// Flag + name row card linking to a country's plans.
class CountryTile extends StatelessWidget {
  final Country country;
  final VoidCallback onTap;
  const CountryTile({required this.country, required this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            if (country.flag != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Image.network(country.flag!, width: 36, height: 26, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox(width: 36, height: 26)),
              )
            else
              const Text('🌍'),
            const SizedBox(width: 10),
            Expanded(
                child: Text(country.name,
                    style: const TextStyle(fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis)),
            const Icon(Icons.chevron_right, color: BpColors.brand),
          ]),
        ),
      ),
    );
  }
}
