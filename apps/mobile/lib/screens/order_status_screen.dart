import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import 'esim_detail_screen.dart';

/// Shown after returning from Stripe checkout — polls confirm() until the
/// order completes (or fails), then offers the eSIM.
class OrderStatusScreen extends StatefulWidget {
  final String orderId;
  const OrderStatusScreen({required this.orderId, super.key});
  @override
  State<OrderStatusScreen> createState() => _OrderStatusScreenState();
}

class _OrderStatusScreenState extends State<OrderStatusScreen> {
  OrderRow? _order;
  bool _polling = true;

  @override
  void initState() {
    super.initState();
    _poll();
  }

  @override
  void dispose() {
    _polling = false;
    super.dispose();
  }

  Future<void> _poll() async {
    final account = context.read<AppState>().account;
    for (var i = 0; i < 40 && mounted && _polling; i++) {
      try {
        final o = await account.confirm(widget.orderId);
        if (!mounted) return;
        setState(() => _order = o);
        if (o.status == 'completed' || o.status == 'failed' || o.status == 'refunded') {
          _polling = false;
          return;
        }
      } catch (_) {
        // keep polling — the user may still be paying
      }
      await Future.delayed(const Duration(seconds: 3));
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = _order;
    final done = o?.status == 'completed';
    final failed = o?.status == 'failed' || o?.status == 'refunded';
    final emoji = done ? '🎉' : (failed ? '⚠️' : '⏳');
    final title = done
        ? 'Your eSIM is ready!'
        : (failed ? 'Payment / order issue' : 'Completing your order…');

    return Scaffold(
      appBar: AppBar(title: const Text('Your order')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 56)),
              const SizedBox(height: 16),
              Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(o?.packageName ?? '', textAlign: TextAlign.center, style: TextStyle(color: BpColors.inkFade(0.6))),
              const SizedBox(height: 24),
              if (!done && !failed) const CircularProgressIndicator(),
              if (failed && o?.failureReason != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(o!.failureReason!, textAlign: TextAlign.center, style: const TextStyle(color: BpColors.coral)),
                ),
              if (done && o?.esimId != null)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: FilledButton(
                    onPressed: () => Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => EsimDetailScreen(esimId: o!.esimId!, justPurchased: true)),
                    ),
                    child: const Text('View & install eSIM'),
                  ),
                ),
              if (!done)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: TextButton(
                    onPressed: () {
                      if (_polling) return;
                      _polling = true;
                      _poll();
                    },
                    child: const Text('Check again'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
