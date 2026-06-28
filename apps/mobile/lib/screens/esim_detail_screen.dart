import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import '../widgets/widgets.dart';

class EsimDetailScreen extends StatefulWidget {
  final String esimId;
  final bool justPurchased;
  const EsimDetailScreen({required this.esimId, this.justPurchased = false, super.key});
  @override
  State<EsimDetailScreen> createState() => _EsimDetailScreenState();
}

class _EsimDetailScreenState extends State<EsimDetailScreen> {
  late Future<({EsimRow esim, Usage? usage})> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<({EsimRow esim, Usage? usage})> _load() =>
      context.read<AppState>().account.esimDetail(widget.esimId);

  Future<void> _open(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Your eSIM')),
      body: AsyncView<({EsimRow esim, Usage? usage})>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        errorMessage: 'Could not load this eSIM.',
        builder: (data) {
          final esim = data.esim;
          final usage = data.usage;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (widget.justPurchased)
                const Card(
                  color: BpColors.brandBg,
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('🎉 Your eSIM is ready! Scan the QR below to install.',
                        style: TextStyle(fontWeight: FontWeight.w700, color: BpColors.brand)),
                  ),
                ),
              Text(esim.lastBundle ?? 'eSIM', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              Text('ICCID ${esim.iccid}', style: TextStyle(color: BpColors.inkFade(0.5))),
              const SizedBox(height: 16),
              InstallCard(esim: esim, onOpen: _open),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Data usage', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    const SizedBox(height: 12),
                    if (usage == null) const Text('Usage not available yet.') else UsageMeter(usage),
                  ]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
