import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../data/models.dart';
import '../state/app_state.dart';
import 'esim_detail_screen.dart';
import 'order_status_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final Package pkg;
  const CheckoutScreen({required this.pkg, super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _busy = false;
  String? _error;

  Future<void> _pay() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final account = context.read<AppState>().account;
    try {
      final result = await account.checkout(widget.pkg.id);
      if (result.checkoutUrl != null) {
        // Stripe: open hosted checkout, then track the order on return.
        await launchUrl(Uri.parse(result.checkoutUrl!), mode: LaunchMode.externalApplication);
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => OrderStatusScreen(orderId: result.orderId)),
          );
        }
        return;
      }
      final order = await account.orderStatus(result.orderId);
      if (!mounted) return;
      if (order.status == 'completed' && order.esimId != null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => EsimDetailScreen(esimId: order.esimId!, justPurchased: true)),
        );
      } else {
        setState(() {
          _busy = false;
          _error = order.failureReason ?? 'Order could not be completed.';
        });
      }
    } catch (e) {
      setState(() {
        _busy = false;
        _error = '$e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final pkg = widget.pkg;
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(pkg.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${pkg.dataLabel} · ${pkg.validityLabel}',
                          style: TextStyle(color: BpColors.inkFade(0.5))),
                    ]),
                  ),
                  Text(money(pkg.retail, pkg.currency),
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                ]),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(_error!, style: const TextStyle(color: BpColors.coral)),
              ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _busy ? null : _pay,
                child: _busy
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Pay ${money(pkg.retail, pkg.currency)}'),
              ),
            ),
            const SizedBox(height: 8),
            Text('Secure card payment · instant eSIM delivery',
                style: TextStyle(fontSize: 12, color: BpColors.inkFade(0.4))),
          ],
        ),
      ),
    );
  }
}
