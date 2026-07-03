import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'support_screen.dart';

const _issues = [
  {
    'q': 'No internet after installing?',
    'steps': [
      'Turn ON mobile data for the BackpackLink eSIM line.',
      'Enable Data Roaming for that line (stays local — no roaming charges).',
      'Toggle Airplane mode on/off, or restart your phone.',
    ],
  },
  {
    'q': 'QR won’t scan / install?',
    'steps': [
      'Install over Wi-Fi before you travel.',
      'Use the one-tap iOS/Android install button on your eSIM.',
      'Or add it manually with the SM-DP+ address + activation code.',
    ],
  },
  {
    'q': 'Slow or no signal somewhere?',
    'steps': [
      'Manually pick a supported network in Settings → Cellular.',
      'Some areas only have 3G/4G — check the plan’s coverage.',
    ],
  },
  {
    'q': 'Data ran out?',
    'steps': ['Buy a top-up or a new plan — it installs onto the same eSIM in seconds.'],
  },
];

class TroubleshootingScreen extends StatelessWidget {
  const TroubleshootingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Troubleshooting')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen())),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(color: BpColors.coral, borderRadius: BorderRadius.circular(20)),
              child: const Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Chat with support', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                    SizedBox(height: 2),
                    Text('Real humans, fast replies — not bots.', style: TextStyle(color: Colors.white70)),
                  ]),
                ),
                Text('💬', style: TextStyle(fontSize: 28)),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          ..._issues.map((it) => Card(
                child: ExpansionTile(
                  shape: const Border(),
                  title: Text(it['q'] as String, style: const TextStyle(fontWeight: FontWeight.w700)),
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  children: (it['steps'] as List)
                      .map((s) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              const Text('•  '),
                              Expanded(child: Text('$s', style: TextStyle(color: BpColors.inkFade(0.75)))),
                            ]),
                          ))
                      .toList(),
                ),
              )),
        ],
      ),
    );
  }
}
