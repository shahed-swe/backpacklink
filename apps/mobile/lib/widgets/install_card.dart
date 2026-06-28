import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../data/models.dart';

/// QR code + one-tap install links + manual SM-DP+ details for an eSIM.
class InstallCard extends StatelessWidget {
  final EsimRow esim;
  final void Function(String url) onOpen;
  const InstallCard({required this.esim, required this.onOpen, super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          const Align(
            alignment: Alignment.centerLeft,
            child: Text('Install your eSIM', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          ),
          const SizedBox(height: 12),
          if (esim.qrCodeText != null)
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: QrImageView(data: esim.qrCodeText!, size: 200),
            ),
          const SizedBox(height: 12),
          Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
            if (esim.universalLinkIos != null)
              OutlinedButton.icon(
                onPressed: () => onOpen(esim.universalLinkIos!),
                icon: const Icon(Icons.phone_iphone, size: 18),
                label: const Text('iOS install'),
              ),
            if (esim.universalLinkAndroid != null)
              OutlinedButton.icon(
                onPressed: () => onOpen(esim.universalLinkAndroid!),
                icon: const Icon(Icons.android, size: 18),
                label: const Text('Android install'),
              ),
          ]),
          const Divider(height: 24),
          _ManualRow('SM-DP+ Address', esim.smdpAddress),
          _ManualRow('Activation code', esim.matchingId),
          _ManualRow('APN', esim.apn),
        ]),
      ),
    );
  }
}

class _ManualRow extends StatelessWidget {
  final String label;
  final String? value;
  const _ManualRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    if (value == null || value!.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Text(label, style: const TextStyle(color: Colors.black54)),
        const Spacer(),
        Flexible(
          child: Text(value!,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 12), overflow: TextOverflow.ellipsis),
        ),
      ]),
    );
  }
}
